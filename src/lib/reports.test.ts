import { describe, expect, it } from "vitest";
import { delta, refKind, resolveRange } from "./reports";

const NOW = new Date("2026-11-25T04:00:00Z"); // 台灣 11/25（三）12 點

describe("resolveRange", () => {
  it("日報：預設今天、前一天比；未來的日期當今天", () => {
    const r = resolveRange("day", undefined, NOW);
    expect([r.from, r.to, r.prevFrom, r.prevEnd, r.partial, r.nextAnchor]).toEqual(["2026-11-25", "2026-11-25", "2026-11-24", "2026-11-24", false, null]);
    expect(resolveRange("day", "2099-01-01", NOW).from).toBe("2026-11-25");
    expect(resolveRange("day", "亂打", NOW).from).toBe("2026-11-25");
    expect(resolveRange("day", "2026-11-20", NOW).nextAnchor).toBe("2026-11-21");
  });
  it("週報：週一到週日；還沒過完的一週跟上週同樣天數比", () => {
    const r = resolveRange("week", undefined, NOW);
    expect([r.from, r.to, r.end, r.partial]).toEqual(["2026-11-23", "2026-11-29", "2026-11-25", true]);
    expect([r.prevFrom, r.prevEnd]).toEqual(["2026-11-16", "2026-11-18"]);
    expect(r.days).toEqual(["2026-11-23", "2026-11-24", "2026-11-25"]);
    expect([r.allDays.length, r.today]).toEqual([7, true]);
    const last = resolveRange("week", "2026-11-22", NOW); // 週日 → 那一週
    expect([last.from, last.to, last.partial, last.nextAnchor]).toEqual(["2026-11-16", "2026-11-22", false, "2026-11-23"]);
  });
  it("月報：日曆月；跨年、2 月", () => {
    const r = resolveRange("month", "2026-10-15", NOW);
    expect([r.from, r.to, r.prevFrom, r.prevEnd, r.days.length]).toEqual(["2026-10-01", "2026-10-31", "2026-09-01", "2026-09-30", 31]);
    const jan = resolveRange("month", "2026-01-05", NOW);
    expect([jan.prevFrom, jan.label]).toEqual(["2025-12-01", "2026 年 1 月"]);
    expect(resolveRange("month", "2026-02-10", NOW).to).toBe("2026-02-28");
  });
});

describe("refKind", () => {
  it.each([
    ["google.com", "搜尋"],
    ["com.google.android.gm", "信件"],
    ["gemini.google.com", "AI"],
    ["chatgpt.com", "AI"],
    ["t.co", "社群"],
    ["github.com", "GitHub"],
    ["ref:reddit-selfhosted", "活動連結"],
    ["example.org", "其他網站"],
  ])("%s → %s", (h, k) => expect(refKind(h)).toBe(k));
});

it("delta", () => {
  expect(delta(12, 10)).toBe("（+20%）");
  expect(delta(5, 10)).toBe("（-50%）");
  expect(delta(5, 0)).toBe("");
});
