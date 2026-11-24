import { describe, expect, it } from "vitest";
import { addNotFound, normalizePath, shouldRecord } from "./not-found.js";

const req = (headers: Record<string, string> = {}, method = "GET") => ({
  method,
  url: "/x",
  headers: { "cf-ipcountry": "TW", "user-agent": "Mozilla/5.0 Chrome/142", ...headers },
});

describe("not-found（C3）", () => {
  it("只記外面來的 GET 404", () => {
    expect(shouldRecord(req(), 404)).toBe(true);
    expect(shouldRecord(req(), 200)).toBe(false);
    expect(shouldRecord(req({}, "POST"), 404)).toBe(false);
    expect(shouldRecord({ method: "GET", url: "/x", headers: {} }, 404)).toBe(false);
    expect(shouldRecord(req({ "user-agent": "Mozilla/5.0 WindowsPowerShell/5.1" }), 404)).toBe(false);
  });

  it.each(["/wp-login.php", "/.env", "/.git/config", "/admin/", "/vendor/phpunit/x", "/xmlrpc.php", "/backup.zip", "/cgi-bin/luci"])(
    "掃描器路徑不記：%s",
    (p) => expect(normalizePath(p)).toBeNull(),
  );

  it("一般路徑去掉 query；舊 chunk 合成一類；中文解碼", () => {
    expect(normalizePath("/blog/old-post?utm=x")).toBe("/blog/old-post");
    expect(normalizePath("/_next/static/chunks/abc.js")).toBe("/_next/…（舊版的檔案）");
    expect(normalizePath("/%E4%BD%9C%E5%93%81")).toBe("/作品");
    expect(normalizePath("/administration-tips")).toBe("/administration-tips");
  });

  it("按台灣日期累加、掃描器只記次數、只留 35 天", () => {
    const t = new Date("2026-11-25T02:00:00Z");
    let s = addNotFound(null, "/old", t);
    s = addNotFound(s, "/old?a=1", t);
    s = addNotFound(s, "/.env", t);
    expect(s).toEqual({ days: { "2026-11-25": { "/old": 2 } }, scanners: { "2026-11-25": 1 } });
    s = addNotFound(s, "/new", new Date(t.getTime() + 40 * 86400_000));
    expect(Object.keys(s.days)).toEqual(["2027-01-04"]);
    expect(s.scanners).toEqual({});
  });
});
