import fs from "node:fs";
import { dataFile, logFile } from "@/lib/data-file";
import { twDate } from "../../../scripts/lib/tw-time.js";

// 維運狀態頁 /status（TODO A4，2026-11-21）的資料。三個來源，都只讀不寫，只公開彙總：
//   - data/uptime.log：watchdog 每 5 分鐘一行「時間 o=origin p=外網 m=維修模式」（2026-11-21 才開始記）
//   - logs/deploy.log：每次部署的開始／成功／失敗／自動退回
//   - logs/watchdog.log：只記異常——自動重啟、外網連不到、runner 重啟
// log 裡的原始訊息（路徑、chunk 檔名、錯誤內容）不出去，只轉成「哪一類、幾點、有沒有自己恢復」。

export interface DayUptime {
  date: string; // YYYY-MM-DD（台灣）
  checks: number; // 不含維修模式
  up: number;
  maint: number;
}

export type DeployResult = "ok" | "failed" | "rollback" | "running";
export interface Deploy {
  start: string; // ISO
  seconds?: number;
  result: DeployResult;
}

export type RestartKind = "site" | "tunnel" | "runner";
export interface RestartEvent {
  time: string; // ISO
  kind: RestartKind;
  /** true＝watchdog 自己救回來；false＝要人處理（或外網那種只能通知） */
  auto: boolean;
}

const taipeiDate = (d: Date) => twDate(d.getTime());

/** uptime.log → 最近 days 天（舊 → 新），沒有紀錄的日子 checks=0 */
export function parseUptime(raw: string, now = new Date(), days = 90): DayUptime[] {
  const out: DayUptime[] = [];
  const index = new Map<string, DayUptime>();
  for (let i = days - 1; i >= 0; i--) {
    const date = taipeiDate(new Date(now.getTime() - i * 86400000));
    const d = { date, checks: 0, up: 0, maint: 0 };
    out.push(d);
    index.set(date, d);
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = /^(\S+) o=([01-]) p=([01-]) m=([01])/.exec(line.trim());
    if (!m) continue;
    const t = new Date(m[1]);
    if (Number.isNaN(t.getTime())) continue;
    const d = index.get(taipeiDate(t));
    if (!d) continue;
    if (m[4] === "1") {
      d.maint++;
      continue;
    }
    d.checks++;
    // origin 好、而且外網沒有失敗（"-"＝那一輪沒檢查外網）才算正常
    if (m[2] === "1" && m[3] !== "0") d.up++;
  }
  return out;
}

/** 這幾天的可用率（0～1）；完全沒有紀錄回 null */
export function availability(days: DayUptime[]): number | null {
  const checks = days.reduce((n, d) => n + d.checks, 0);
  return checks ? days.reduce((n, d) => n + d.up, 0) / checks : null;
}

const LINE = /^﻿?\[([^\]]+)\]\s*(.*)$/;

/** deploy.log → 每次部署（新 → 舊） */
export function parseDeploys(raw: string): Deploy[] {
  const out: Deploy[] = [];
  let cur: (Deploy & { rollback?: boolean }) | null = null;
  for (const line of raw.split(/\r?\n/)) {
    const m = LINE.exec(line);
    if (!m) continue;
    const [, time, msg] = m;
    if (msg.startsWith("===== Deploy started")) {
      cur = { start: time, result: "running" };
      out.push(cur);
    } else if (!cur) {
      continue;
    } else if (msg.startsWith("[ROLLBACK]")) {
      cur.rollback = true;
    } else if (msg.startsWith("===== Deploy succeeded") || msg.startsWith("===== Deploy FAILED")) {
      cur.result = msg.includes("succeeded") ? "ok" : cur.rollback ? "rollback" : "failed";
      cur.seconds = Math.round((new Date(time).getTime() - new Date(cur.start).getTime()) / 1000);
      delete cur.rollback;
      cur = null;
    }
  }
  // 開始了卻沒有結束、後面又有新的部署：那次是中途斷掉（例如重開機），算失敗
  for (let i = 0; i < out.length - 1; i++) if (out[i].result === "running") out[i].result = "failed";
  return out.reverse();
}

/** watchdog.log → 自動重啟／外網斷線／runner 事件（新 → 舊） */
export function parseRestarts(raw: string): RestartEvent[] {
  const out: RestartEvent[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = LINE.exec(line);
    if (!m) continue;
    const [, time, msg] = m;
    let ev: Omit<RestartEvent, "time"> | null = null;
    if (msg.startsWith("[RECOVERED]")) ev = { kind: msg.includes("runner") ? "runner" : "site", auto: true };
    else if (msg.startsWith("[FAILED]")) {
      if (msg.includes("外網")) ev = { kind: "tunnel", auto: false };
      else if (msg.includes("runner")) ev = { kind: "runner", auto: false };
      else if (msg.includes("網站")) ev = { kind: "site", auto: false };
    }
    if (ev) out.push({ time, ...ev });
  }
  return out.reverse();
}

// ── 讀檔（依修改時間快取：deploy.log 1MB 多，不要每個請求都重新解析）────────────────
const cache = new Map<string, { key: string; value: unknown }>();
function readCached<T>(file: string, parse: (raw: string) => T, fallback: T): T {
  try {
    const st = fs.statSync(file);
    const key = `${st.mtimeMs}:${st.size}`;
    const hit = cache.get(file);
    if (hit && hit.key === key) return hit.value as T;
    const value = parse(fs.readFileSync(file, "utf8"));
    cache.set(file, { key, value });
    return value;
  } catch {
    return fallback;
  }
}

const uptimeFile = () => dataFile("UPTIME_FILE", "uptime.log");

export function readUptime(days = 90): DayUptime[] {
  // 日期跟著今天走，不能整份快取結果：快取原始字串，每次重新切天
  const raw = readCached(uptimeFile(), (r) => r, "");
  return parseUptime(raw, new Date(), days);
}

export function readDeploys(): Deploy[] {
  return readCached(logFile("deploy.log"), parseDeploys, []);
}

export function readRestarts(): RestartEvent[] {
  return readCached(logFile("watchdog.log"), parseRestarts, []);
}

/** uptime.log 第一筆的時間（「從哪天開始記」）；沒有回 null */
export function uptimeSince(): string | null {
  const raw = readCached(uptimeFile(), (r) => r, "");
  const first = /^(\S+) o=/m.exec(raw);
  return first ? first[1] : null;
}

interface StatusSummary {
  deploys90: number;
  okDeploys90: number;
  rollbacks90: number;
  autoRestarts90: number;
  /** 近 90 天成功部署花的時間的中位數（秒） */
  medianDeploySeconds: number | null;
  lastDeploy: Deploy | undefined;
  /** 這次 server 啟動多久了（秒） */
  processUptime: number;
}

/** 頁面上的數字（「現在」在這裡取，元件裡不能呼叫 Date.now） */
export function summarizeStatus(deploys: Deploy[], restarts: RestartEvent[], now = Date.now()): StatusSummary {
  const within = (iso: string) => now - new Date(iso).getTime() < 90 * 86400000;
  const recent = deploys.filter((d) => within(d.start) && d.result !== "running");
  const okSeconds = recent
    .filter((d) => d.result === "ok" && d.seconds !== undefined)
    .map((d) => d.seconds!)
    .sort((a, b) => a - b);
  return {
    deploys90: recent.length,
    okDeploys90: recent.filter((d) => d.result === "ok").length,
    rollbacks90: recent.filter((d) => d.result === "rollback").length,
    autoRestarts90: restarts.filter((r) => within(r.time) && r.auto).length,
    medianDeploySeconds: okSeconds.length ? okSeconds[Math.floor(okSeconds.length / 2)] : null,
    lastDeploy: deploys.find((d) => d.result !== "running"),
    processUptime: Math.round(process.uptime()),
  };
}
