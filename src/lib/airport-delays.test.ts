import { describe, expect, it } from "vitest";
import type { Flight } from "./airport-board";
import { delayMinutes, recordBoard, summarizeDelays } from "./airport-delays";

const f = (code: string, sched: string, changed: string | null, kind: Flight["kind"]): Flight => ({
  code,
  codeshares: [],
  airline: "",
  place: "福岡",
  placeCode: "FUK",
  dir: "dep",
  intl: true,
  sched,
  changed,
  status: "",
  kind,
  gate: null,
  aircraft: null,
  note: null,
});
const T0 = Date.parse("2026-11-25T02:00:00Z"); // 台灣 10:00

describe("delayMinutes", () => {
  it("一般、提早、跨午夜", () => {
    expect(delayMinutes("10:00", null)).toBe(0);
    expect(delayMinutes("10:00", "10:45")).toBe(45);
    expect(delayMinutes("10:00", "09:50")).toBe(-10);
    expect(delayMinutes("23:50", "00:20")).toBe(30);
    expect(delayMinutes("00:10", "23:55")).toBe(-15);
    expect(delayMinutes("10:00", "bad")).toBeNull();
  });
});

describe("recordBoard + summarizeDelays", () => {
  it("同一班同一天只留最後的狀態；還沒飛走的不算；至少 5 次才排進最常延誤", () => {
    let s = recordBoard(null, [f("CI110", "08:00", null, "scheduled")], T0);
    s = recordBoard(s, [f("CI110", "08:00", "08:50", "done")], T0 + 3600_000);
    expect(Object.keys(s.days)).toHaveLength(1);
    expect(Object.values(s.days)[0]["CI110|dep|08:00"].changed).toBe("08:50");

    // 再補 4 天、每天晚 50 分，加一班準時的、一班取消的、一班還沒飛的
    for (let i = 1; i <= 4; i++) s = recordBoard(s, [f("CI110", "08:00", "08:50", "done")], T0 + i * 86400_000);
    s = recordBoard(s, [f("IT720", "16:55", null, "done"), f("BR106", "11:15", null, "cancelled"), f("IT270", "18:55", null, "scheduled")], T0 + 4 * 86400_000);

    const sum = summarizeDelays(s, T0 + 4 * 86400_000);
    expect(sum.days).toBe(5);
    expect(sum.flights).toBe(7); // CI110×5 + IT720 + BR106（IT270 還沒飛，不算）
    expect(sum.cancelled).toBe(1);
    expect(sum.onTimePct).toBeCloseTo((1 / 7) * 100, 0);
    expect(sum.worst).toEqual([{ code: "CI110", dir: "dep", place: "福岡", n: 5, avgDelay: 50, lateCount: 5 }]);
  });
  it("只留 120 天", () => {
    let s = recordBoard(null, [f("CI110", "08:00", null, "done")], T0);
    s = recordBoard(s, [f("CI110", "08:00", null, "done")], T0 + 121 * 86400_000);
    expect(Object.keys(s.days)).toHaveLength(1);
  });
});
