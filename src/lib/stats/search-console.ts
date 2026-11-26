import "server-only";
import { dataFile, readJsonFile } from "@/lib/data-file";

// Google Search Console 的搜尋成效快取（TODO G9，2026-11-26）：scripts/search-console-cache.ps1 每天抓一次寫 data/search-console.json，
// 站長後台 /admin/reports 讀來顯示。搜尋字詞只在後台看（可能有人搜本名，那是給站長看的）；沒有快取檔（沒設金鑰、還沒抓過）回 null。

export type GscRow = { key: string; clicks: number; impressions: number };
export type GscTotals = { clicks: number; impressions: number; ctr: number; position: number };
export type GscCache = {
  fetchedAt: string;
  site: string;
  analytics: { range: string; days: number; cur: GscTotals; prev: GscTotals; queries: GscRow[]; pages: GscRow[] };
};

export function readSearchConsole(): GscCache | null {
  const c = readJsonFile<GscCache>(dataFile("GSC_CACHE_FILE", "search-console.json"));
  return c?.analytics && Array.isArray(c.analytics.queries) ? c : null;
}
