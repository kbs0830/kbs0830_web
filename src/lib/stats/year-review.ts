import "server-only";
import { getAllPosts } from "@/lib/content/blog";
import { incidents } from "@/lib/ops/incidents";
import { availability, readDeploys, readUptime } from "@/lib/ops/status";
import { readCloudflareSummary } from "@/lib/stats/cloudflare-analytics";
import { readCountryCounts } from "@/lib/stats/site-stats";
import { dataFile } from "@/lib/data-file";
import { twDate } from "../../../scripts/lib/tw-time.js";
import { readState } from "../../../scripts/lib/radar.js";

// /2026 年度回顧（TODO B18，2026-11-28）：全部是網站自己記下來的數字，不用人寫。
// 隱私：不放本名、日期級的行程、雷達位置；雷達只放彙總（幾架、幾種機型）。
// commit 數、第一個 commit 的時間在 build 時由 next.config.ts 讀 git 放進 env（部署環境才有 git）。

export interface YearReview {
  asOf: string; // YYYY-MM-DD（台灣）
  since: string | null; // 第一個 commit 的日期
  commits: number | null;
  deploys: number;
  rollbacks: number;
  posts: number;
  uptime90: number | null; // 0～1
  incidentList: { id: string; date: string; title: string; post?: string }[];
  countries: number;
  cloudflare: { uniques: number; pageViews: number; since: string } | null;
  radar: { days: number; aircraft: number; types: number; busiest: number } | null;
}

type RadarDays = Record<string, { unique?: number; types?: Record<string, number> }>;

/** 純函式：雷達每天的資料 → 累計彙總（架次＝每天不重複的加總） */
export function radarTotals(days: RadarDays) {
  const entries = Object.values(days);
  const types = new Set(entries.flatMap((d) => Object.keys(d.types ?? {})));
  return {
    days: entries.length,
    aircraft: entries.reduce((n, d) => n + (d.unique ?? 0), 0),
    types: types.size,
    busiest: Math.max(0, ...entries.map((d) => d.unique ?? 0)),
  };
}

export function readYearReview(now = Date.now()): YearReview {
  const deploys = readDeploys().filter((d) => d.result !== "running");
  const cf = readCloudflareSummary();
  const radarState = readState(dataFile("RADAR_FILE", "radar.json")) as { days?: RadarDays } | null;
  const first = process.env.BUILD_FIRST_COMMIT_TIME;
  return {
    asOf: twDate(now),
    since: first ? twDate(Date.parse(first)) : null,
    commits: Number(process.env.BUILD_COMMIT_COUNT) || null,
    deploys: deploys.length,
    rollbacks: deploys.filter((d) => d.result === "rollback").length,
    posts: getAllPosts().length,
    uptime90: availability(readUptime(90)),
    incidentList: incidents.map((i) => ({ id: i.id, date: i.date, title: i.title, post: i.post })),
    countries: readCountryCounts().length,
    cloudflare: cf ? { uniques: cf.total.uniques, pageViews: cf.total.pageViews, since: cf.since } : null,
    radar: radarState?.days ? radarTotals(radarState.days) : null,
  };
}
