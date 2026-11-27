import "server-only";
import { dataFile, readJsonFile } from "@/lib/data-file";

// Google 收錄狀態快取（TODO V6，2026-11-27）：scripts/search-console-cache.ps1 每週在背景跑一次 `search-console.js --index`
// （逐網址問 URL Inspection API），寫 data/search-index.json；站長後台 /admin/reports 讀來顯示。沒有檔案（還沒跑過、沒設金鑰）回 null。

export type IndexPage = { path: string; indexed: boolean; state: string };
export type SearchIndex = {
  fetchedAt: string;
  site: string;
  index: { total: number; indexed: number; states: Record<string, number>; notIndexed: string[]; pages: IndexPage[] };
  /** 跟上次比，這次新收錄的頁（第一次跑是空的） */
  newlyIndexed: string[];
};

export function readSearchIndex(): SearchIndex | null {
  const c = readJsonFile<SearchIndex>(dataFile("GSC_INDEX_FILE", "search-index.json"));
  return c?.index && Array.isArray(c.index.pages) ? c : null;
}
