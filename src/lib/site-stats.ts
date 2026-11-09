// 網站流量資料的讀取（頁尾 /api/visitor-stats 跟 /stats 頁共用）。只讀，寫入在別處：
//   - data/visitor-stats.json：真人造訪的國家次數（/api/visitor-stats POST 寫）
//   - data/raw-traffic.json：未過濾的每個頁面請求，依 UA 分類（scripts/server.js → scripts/lib/raw-traffic.js 寫）
//   - data/cloudflare-daily.json：Cloudflare 每日數字（lib/cloudflare-analytics.ts 寫）
// 都只有彙總數字，沒有 IP、UA、網址。
//
// production 由 scripts/server.js 透過環境變數傳絕對路徑（Task Scheduler 啟動時 cwd 不保證是專案根目錄）；
// `next dev`／測試沒設就退回 process.cwd()/data。每次呼叫才讀環境變數，測試才能換檔案。
// turbopackIgnore：這是執行期資料檔，不是程式碼依賴，不要被 build 追蹤（曾經跳過 NFT over-trace 警告）。
import fs from "fs";
import path from "path";
import { classify } from "../../scripts/lib/raw-traffic.js";

const dataFile = (envName: string, fileName: string) =>
  process.env[envName] || path.join(/* turbopackIgnore: true */ process.cwd(), "data", fileName);

/** 國碼 → 真人造訪次數。XX（Cloudflare 認不出國家）不算 */
export function readCountryCounts(): [string, number][] {
  try {
    const stats = JSON.parse(fs.readFileSync(dataFile("VISITOR_STATS_FILE", "visitor-stats.json"), "utf8"));
    return (Object.entries(stats) as [string, number][])
      .filter(([code]) => code !== "XX")
      .sort((a, b) => b[1] - a[1]);
  } catch {
    return [];
  }
}

export type BotKind = "ai" | "search" | "bot";

export type RawTraffic = {
  since: string;
  total: number;
  browser: number;
  ai: number;
  search: number;
  bot: number;
  /** 認得出名字的爬蟲，次數最多的前 5 個 */
  topBots: [string, number][];
};

function readRawFile() {
  try {
    const raw = JSON.parse(fs.readFileSync(dataFile("RAW_TRAFFIC_FILE", "raw-traffic.json"), "utf8"));
    const names = (Object.entries(raw.names ?? {}) as [string, number][]).sort((a, b) => b[1] - a[1]);
    return { raw, names };
  } catch {
    return null;
  }
}

/** 頁尾用的彙總（/api/visitor-stats 的 raw 欄位） */
export function readRawTraffic(): RawTraffic | null {
  const file = readRawFile();
  if (!file) return null;
  const { raw, names } = file;
  return {
    since: String(raw.since ?? ""),
    total: Number(raw.total) || 0,
    browser: Number(raw.browser) || 0,
    ai: Number(raw.ai) || 0,
    search: Number(raw.search) || 0,
    bot: Number(raw.bot) || 0,
    topBots: names.slice(0, 5),
  };
}

/** 全部認得出名字的爬蟲（次數多的在前），附分類（/stats 的爬蟲排行） */
export function readCrawlers(): { name: string; count: number; kind: BotKind }[] {
  // 存的只有名稱，分類用同一份名單重算（名單在 raw-traffic.js，只維護一份）
  return (readRawFile()?.names ?? []).map(([name, count]) => ({ name, count, kind: classify(name).kind as BotKind }));
}

/** 國碼 → 國旗 emoji（regional indicator 公式，不用維護對照表） */
export function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
