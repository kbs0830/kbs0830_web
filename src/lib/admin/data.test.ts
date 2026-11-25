import { describe, expect, it } from "vitest";
import { nextReportTimes, parseWatchdog } from "@/lib/admin/data";

describe("parseWatchdog", () => {
  it("新到舊、去 BOM、遮掉信箱、略過不認得的行", () => {
    const raw = [
      "﻿[2026-11-23T09:02:06+08:00] [WEEKLY] 週報：sent → someone@example.com",
      "亂七八糟的一行",
      "[2026-11-24T10:00:00+08:00] [WARN] 外網檢查失敗",
    ].join("\r\n");
    const out = parseWatchdog(raw);
    expect(out.map((l) => l.tag)).toEqual(["WARN", "WEEKLY"]);
    expect(out[1].text).toBe("週報：sent");
    expect(out[1].text).not.toContain("@");
  });
});

describe("nextReportTimes", () => {
  it("週三 → 下週一 9:00；月中 → 下個月 1 號 9:00（台灣時間）", () => {
    const r = nextReportTimes(new Date("2026-11-25T12:00:00+08:00"));
    expect(r.week).toBe(new Date("2026-11-30T09:00:00+08:00").toISOString());
    expect(r.month).toBe(new Date("2026-12-01T09:00:00+08:00").toISOString());
  });
  it("週一 8 點還沒寄 → 就是今天 9:00", () => {
    const r = nextReportTimes(new Date("2026-11-30T08:00:00+08:00"));
    expect(r.week).toBe(new Date("2026-11-30T09:00:00+08:00").toISOString());
  });
});
