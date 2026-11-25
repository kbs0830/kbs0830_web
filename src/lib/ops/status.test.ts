import { describe, expect, it } from "vitest";
import { availability, parseDeploys, parseRestarts, parseUptime } from "@/lib/ops/status";
import { incidents } from "@/lib/ops/incidents";

describe("status：可用率", () => {
  const now = new Date("2026-11-21T12:00:00+08:00");
  const raw = [
    "2026-11-21T00:00:01+08:00 o=1 p=1 m=0",
    "2026-11-21T00:05:01+08:00 o=0 p=- m=0", // origin 掛了（外網沒檢查）＝不可用
    "2026-11-21T00:10:01+08:00 o=1 p=0 m=0", // 外網連不到＝不可用
    "2026-11-21T00:15:01+08:00 o=- p=- m=1", // 維修模式不計
    "2026-11-20T23:59:00+08:00 o=1 p=1 m=0",
    "垃圾行",
    "2026-08-01T00:00:00+08:00 o=1 p=1 m=0", // 超過 90 天，不算
  ].join("\r\n");

  it("每天的檢查次數、正常次數、維修次數", () => {
    const days = parseUptime(raw, now, 90);
    expect(days).toHaveLength(90);
    expect(days.at(-1)).toEqual({ date: "2026-11-21", checks: 3, up: 1, maint: 1 });
    expect(days.at(-2)).toEqual({ date: "2026-11-20", checks: 1, up: 1, maint: 0 });
    expect(days[0].checks).toBe(0);
  });

  it("可用率只算有紀錄的檢查；完全沒紀錄回 null", () => {
    const days = parseUptime(raw, now, 90);
    expect(availability(days)).toBeCloseTo(2 / 4);
    expect(availability(days.slice(0, 10))).toBeNull();
  });

  it("日期用台灣時間切", () => {
    const [d] = parseUptime("2026-11-20T16:30:00Z o=1 p=1 m=0", now, 1);
    expect(d).toEqual({ date: "2026-11-21", checks: 1, up: 1, maint: 0 });
  });
});

describe("status：部署紀錄", () => {
  const raw = [
    "﻿[2026-11-03T00:40:00.1+08:00] ===== Deploy started =====",
    "[2026-11-03T00:40:25.1+08:00] ===== Deploy FAILED =====",
    "[2026-11-03T00:45:00.1+08:00] ===== Deploy started =====",
    "[2026-11-03T00:47:09.1+08:00] [ROLLBACK] 健檢沒過，指回 .next-a",
    "[2026-11-03T00:47:12.1+08:00] ===== Deploy FAILED =====",
    "[2026-11-04T10:00:00.1+08:00] ===== Deploy started =====", // 沒結束、後面又開始＝中途斷掉
    "[2026-11-21T22:04:32.4+08:00] ===== Deploy started =====",
    "[2026-11-21T22:04:40.0+08:00]   next build → .next-a",
    "[2026-11-21T22:04:57.5+08:00] ===== Deploy succeeded — https://kbs0830.com updated =====",
    "[2026-11-21T22:10:00.0+08:00] ===== Deploy started =====", // 最後一筆還在跑
  ].join("\n");

  it("成功／失敗／自動退回／中途斷掉／進行中，新的在前", () => {
    const d = parseDeploys(raw);
    expect(d.map((x) => x.result)).toEqual(["running", "ok", "failed", "rollback", "failed"]);
    expect(d[1].seconds).toBe(25);
    expect(d[3].seconds).toBe(132);
  });
});

describe("status：自動重啟紀錄", () => {
  it("分類成網站／外網／runner，原始訊息不出去", () => {
    const raw = [
      "[2026-07-13T13:11:12+08:00] [WARN] 健康檢查失敗：首頁在 10 秒內沒有正常回應",
      "[2026-07-13T13:11:16+08:00] [RECOVERED] 重啟後恢復正常：首頁與 JS chunk 都正常",
      "[2026-08-30T10:00:00+08:00] [RECOVERED] GitHub Actions runner 重啟後恢復",
      "[2026-11-13T01:47:34+08:00] [FAILED] origin 正常但外網連不到：Chunk /_next/static/chunks/x.js 回傳 ",
      "[2026-11-14T01:00:00+08:00] [FAILED] 網站重啟後仍然異常：xxx —— 需要人工介入",
      "[2026-11-21T09:00:00+08:00] [RADAR] 雷達離線 20 分鐘",
    ].join("\n");
    const ev = parseRestarts(raw);
    expect(ev).toEqual([
      { time: "2026-11-14T01:00:00+08:00", kind: "site", auto: false },
      { time: "2026-11-13T01:47:34+08:00", kind: "tunnel", auto: false },
      { time: "2026-08-30T10:00:00+08:00", kind: "runner", auto: true },
      { time: "2026-07-13T13:11:16+08:00", kind: "site", auto: true },
    ]);
    expect(JSON.stringify(ev)).not.toContain("chunks");
  });
});

describe("事故報告", () => {
  it("id 不重複、新的在前、欄位都有寫", () => {
    expect(new Set(incidents.map((i) => i.id)).size).toBe(incidents.length);
    const dates = incidents.map((i) => i.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const i of incidents) for (const k of ["title", "duration", "impact", "detection", "cause", "fix", "prevention"] as const) expect(i[k]).toBeTruthy();
  });

  it("隱私：沒有內網 IP、本名、信箱", () => {
    expect(JSON.stringify(incidents)).not.toMatch(/192\.168\.|李秉威|@[a-z0-9-]+\.[a-z]|otemon/i);
  });
});

describe("status：頁面數字", () => {
  it("只算近 90 天、進行中的不算、中位數", async () => {
    const { summarizeStatus } = await import("@/lib/ops/status");
    const now = new Date("2026-11-21T12:00:00+08:00").getTime();
    const s = summarizeStatus(
      [
        { start: "2026-11-21T11:00:00+08:00", result: "running" },
        { start: "2026-11-20T10:00:00+08:00", result: "ok", seconds: 30 },
        { start: "2026-11-19T10:00:00+08:00", result: "ok", seconds: 50 },
        { start: "2026-11-18T10:00:00+08:00", result: "rollback", seconds: 120 },
        { start: "2026-11-17T10:00:00+08:00", result: "ok", seconds: 40 },
        { start: "2026-07-01T10:00:00+08:00", result: "ok", seconds: 999 },
      ],
      [
        { time: "2026-11-01T00:00:00+08:00", kind: "site", auto: true },
        { time: "2026-11-02T00:00:00+08:00", kind: "tunnel", auto: false },
        { time: "2026-07-01T00:00:00+08:00", kind: "site", auto: true },
      ],
      now,
    );
    expect(s).toMatchObject({ deploys90: 4, okDeploys90: 3, rollbacks90: 1, autoRestarts90: 1, medianDeploySeconds: 40 });
    expect(s.lastDeploy?.start).toBe("2026-11-20T10:00:00+08:00");
  });
});
