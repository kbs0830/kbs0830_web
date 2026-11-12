import { describe, expect, it } from "vitest";
import { addVisit, classifyUA, emptyDetail, lastDays, normalizePath, referrerHost, taipeiTime } from "./visit-detail";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const WIN_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
const WIN_EDGE = WIN_CHROME + " Edg/142.0.0.0";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
const IG = IPHONE.replace("Safari/604.1", "Instagram 300.0");

describe("visit-detail", () => {
  it("UA 粗分：裝置／瀏覽器／作業系統（Edge、IG 內建瀏覽器不會被當成 Chrome／Safari）", () => {
    expect(classifyUA(IPHONE)).toEqual({ device: "手機", browser: "Safari", os: "iOS" });
    expect(classifyUA(WIN_CHROME)).toEqual({ device: "桌機", browser: "Chrome", os: "Windows" });
    expect(classifyUA(WIN_EDGE).browser).toBe("Edge");
    expect(classifyUA(ANDROID_TABLET)).toEqual({ device: "平板", browser: "Chrome", os: "Android" });
    expect(classifyUA(IG).browser).toBe("FB／IG");
  });

  it("路徑：只收像本站路由的，query／怪字元／太長的都算（其他）", () => {
    expect(normalizePath("/blog/task-scheduler-72-hours")).toBe("/blog/task-scheduler-72-hours");
    expect(normalizePath("/Blog/?utm=x")).toBe("/blog");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/<script>")).toBe("(其他)");
    expect(normalizePath("/" + "a".repeat(100))).toBe("(其他)");
    expect(normalizePath(123)).toBe("(其他)");
  });

  it("來源只留網域；自己的網域、空的、亂的不算", () => {
    expect(referrerHost("https://www.google.com/search?q=secret")).toBe("google.com");
    expect(referrerHost("https://kbs0830.com/blog")).toBeNull();
    expect(referrerHost("")).toBeNull();
    expect(referrerHost("not a url")).toBeNull();
  });

  it("台灣時間：UTC 16:30 已經是隔天 00:30", () => {
    expect(taipeiTime(new Date("2026-11-09T16:30:00Z"))).toEqual({ date: "2026-11-10", hour: 0 });
  });

  it("每頁算瀏覽；工作階段、新訪客、來源、裝置只在工作階段第一頁算一次", () => {
    const now = new Date("2026-11-12T04:00:00Z"); // 台灣 12 點
    let d = emptyDetail(now);
    d = addVisit(d, { path: "/", ref: "https://www.google.com/", newSession: true, newVisitor: true }, IPHONE, now);
    d = addVisit(d, { path: "/blog", ref: "", newSession: false, newVisitor: false }, IPHONE, now);
    d = addVisit(d, { path: "/", newSession: true, newVisitor: false }, WIN_CHROME, now);
    expect(d.days["2026-11-12"]).toEqual({ views: 3, sessions: 2, newVisitors: 1 });
    expect(d.hours[12]).toBe(3);
    expect(d.pages).toEqual({ "/": 2, "/blog": 1 });
    expect(d.referrers).toEqual({ "google.com": 1 });
    expect(d.devices).toEqual({ 手機: 1, 桌機: 1 });
    expect(d.browsers).toEqual({ Safari: 1, Chrome: 1 });
  });

  it("隱私：存下來的東西沒有完整 UA、query string", () => {
    const now = new Date("2026-11-12T04:00:00Z");
    const d = addVisit(emptyDetail(now), { path: "/?token=abc", ref: "https://x.com/a?b=c", newSession: true, newVisitor: true }, IPHONE, now);
    const text = JSON.stringify(d);
    expect(text).not.toContain("token");
    expect(text).not.toContain("b=c");
    expect(text).not.toContain("Mozilla");
  });

  it("lastDays：剛好 n 天、沒資料補 0", () => {
    const now = new Date("2026-11-12T04:00:00Z");
    const d = addVisit(emptyDetail(now), { path: "/", newSession: true }, IPHONE, now);
    const rows = lastDays(d, 3, now);
    expect(rows.map((r) => r.date)).toEqual(["2026-11-10", "2026-11-11", "2026-11-12"]);
    expect(rows[2].views).toBe(1);
    expect(rows[0].views).toBe(0);
  });
});
