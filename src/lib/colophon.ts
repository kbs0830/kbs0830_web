import fs from "fs";
import { dataFile, logFile } from "./data-file";
import { availability, readDeploys, readRestarts, readUptime } from "./status";
import { readCloudflareSummary } from "./cloudflare-analytics";
import { readCountryCounts } from "./site-stats";
import { readState, summarize as summarizeRadar } from "../../scripts/lib/radar.js";

// 本站構造 /colophon（TODO A8，2026-11-21）每個節點旁邊的即時數字。全部是既有的資料來源，這裡只是收集：
// 部署／可用率／重啟（lib/status.ts）、Cloudflare 流量、真人造訪、備份 log、雷達彙總。
// 跟 /status 一樣只有彙總數字，沒有路徑、IP、log 原文。

export interface SiteFacts {
  slot: string; // 現在線上的 build 槽（.next-a／.next-b）
  processUptime: number; // 秒
  memoryMB: number;
  lastDeploy: string | null; // ISO
  deploys90: number;
  rollbacks90: number;
  autoRestarts90: number;
  uptime30: number | null; // 0～1
  cloudflare30: { uniques: number; requests: number } | null;
  visitors: number; // 真人造訪累計
  lastBackup: string | null; // ISO
  radar: { online: boolean; aircraftNow: number } | null;
}

const radarFile = () => dataFile("RADAR_FILE", "radar.json");

/** backup.log 最後一次成功的時間 */
export function lastBackupTime(raw: string): string | null {
  const all = [...raw.matchAll(/^﻿?\[([^\]]+)\] ===== Backup succeeded/gm)];
  return all.length ? all[all.length - 1][1] : null;
}

export function readSiteFacts(now = Date.now()): SiteFacts {
  const deploys = readDeploys();
  const restarts = readRestarts();
  const within90 = (iso: string) => now - new Date(iso).getTime() < 90 * 86400000;
  const finished = deploys.filter((d) => d.result !== "running");
  const cf = readCloudflareSummary();
  let backupRaw = "";
  try {
    backupRaw = fs.readFileSync(logFile("backup.log"), "utf8");
  } catch {}
  const radar = summarizeRadar(readState(radarFile()), now) as { configured: boolean; online?: boolean; aircraftNow?: number };

  return {
    slot: process.env.NEXT_DIST_DIR || ".next",
    processUptime: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1048576),
    lastDeploy: finished[0]?.start ?? null,
    deploys90: finished.filter((d) => within90(d.start)).length,
    rollbacks90: finished.filter((d) => within90(d.start) && d.result === "rollback").length,
    autoRestarts90: restarts.filter((r) => within90(r.time) && r.auto).length,
    uptime30: availability(readUptime(30)),
    cloudflare30: cf ? { uniques: cf.last30.uniques, requests: cf.last30.requests } : null,
    visitors: readCountryCounts().reduce((n, [, v]) => n + v, 0),
    lastBackup: lastBackupTime(backupRaw),
    radar: radar.configured ? { online: Boolean(radar.online), aircraftNow: radar.aircraftNow ?? 0 } : null,
  };
}
