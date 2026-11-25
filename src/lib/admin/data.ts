import "server-only";
import fs from "node:fs";
import { dataFile, logFile, readJsonFile } from "@/lib/data-file";

// 站長後台（TODO A1）讀的資料：watchdog.log 的告警／寄信紀錄、report-mail 的狀態。
// 其他數字直接用現成的：lib/ops/status.ts（部署、重啟）、lib/ops/colophon.ts（readSiteFacts）、lib/stats/reports.ts（buildReport）。

export const DEPLOY_RESULT = { ok: "成功", failed: "失敗", rollback: "退回", running: "進行中" } as const;

interface LogLine {
  time: string; // ISO
  tag: string; // RADAR / WARN / RECOVERED / FAILED / REPORT / WEEKLY / BOOT …
  text: string;
}

/** watchdog.log → 新到舊。行首可能有 BOM。信箱一律遮掉（後台畫面也不放） */
export function parseWatchdog(raw: string): LogLine[] {
  const out: LogLine[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = /^﻿?\[([^\]]+)\]\s*\[([A-Z]+)\]\s*(.*)$/.exec(line);
    if (!m) continue;
    out.push({ time: m[1], tag: m[2], text: m[3].replace(/\s*→\s*\S+@\S+/g, "").trim() });
  }
  return out.reverse();
}

export function readWatchdog(): LogLine[] {
  try {
    return parseWatchdog(fs.readFileSync(logFile("watchdog.log"), "utf8"));
  } catch {
    return [];
  }
}

/** 需要注意的事件（告警、失敗、恢復、開機），不含雷達例行紀錄跟寄信 */
export const ALERT_TAGS = new Set(["WARN", "FAILED", "RECOVERED", "BOOT", "ALERT", "ERROR"]);
/** 寄信紀錄（WEEKLY 是 2026-11-25 前的舊格式） */
export const MAIL_TAGS = new Set(["REPORT", "WEEKLY"]);

interface MailState {
  at?: string;
  week?: string; // 最後寄出的週（週一日期）
  month?: string; // 最後寄出的月（YYYY-MM）
  gscIndexed?: number;
}
export const readMailState = () => readJsonFile<MailState>(dataFile(null, "report-mail-state.json"));

/** 下一封週報（下週一 9:00）、月報（下個月 1 號 9:00），台灣時間；跟 scripts/report-mail.ps1 的排程一致 */
export function nextReportTimes(now = new Date()): { week: string; month: string } {
  const tw = new Date(now.getTime() + 8 * 3600000); // 用 UTC 欄位當台灣時間算
  const dow = (tw.getUTCDay() + 6) % 7; // 週一＝0
  const mondayThisWeek = Date.UTC(tw.getUTCFullYear(), tw.getUTCMonth(), tw.getUTCDate() - dow, 9);
  const week = tw.getTime() < mondayThisWeek ? mondayThisWeek : mondayThisWeek + 7 * 86400000;
  const firstThisMonth = Date.UTC(tw.getUTCFullYear(), tw.getUTCMonth(), 1, 9);
  const month = tw.getTime() < firstThisMonth ? firstThisMonth : Date.UTC(tw.getUTCFullYear(), tw.getUTCMonth() + 1, 1, 9);
  const iso = (ms: number) => new Date(ms - 8 * 3600000).toISOString();
  return { week: iso(week), month: iso(month) };
}
