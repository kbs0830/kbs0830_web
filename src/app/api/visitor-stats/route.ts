import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// production 由 scripts/server.js 透過 VISITOR_STATS_FILE 傳絕對路徑進來，
// 因為 Task Scheduler 啟動時的 process.cwd() 不保證是專案根目錄。
// `next dev` 沒有這個環境變數，fallback 回 process.cwd()（本機開發時就是專案根目錄）。
// turbopackIgnore：這個 fs 路徑組合是給執行期讀寫用的資料檔，不是程式碼依賴，
// 不需要（也不應該）被 Turbopack 追蹤進 build 的檔案清單，避免它誤判整個專案
// 都被這支 API route 依賴（deploy.log 曾經真的跳出這個 NFT over-trace 警告）。
const statsFile =
  process.env.VISITOR_STATS_FILE ||
  path.join(/* turbopackIgnore: true */ process.cwd(), "data", "visitor-stats.json");

const BOT_UA_PATTERN = /bot|spider|crawl|slurp|facebookexternalhit|preview|curl|wget|python-requests|axios|scrapy|headless/i;

function readStats(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(statsFile, "utf8"));
  } catch {
    return {};
  }
}

function summarize(stats: Record<string, number>) {
  const entries = Object.entries(stats).filter(([code]) => code !== "XX");
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const top = entries.sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { total, countryCount: entries.length, top };
}

export async function GET() {
  return NextResponse.json(summarize(readStats()));
}

// 訪客計數改由前端 JS 執行時回報（見 VisitorStats.tsx），不是伺服器對每個 request 的
// header 做啟發式判斷。原本 server.js 端的做法只要 UA 沒有明顯寫 "bot" 字樣就會被算進去，
// 對偽裝成一般瀏覽器 UA 的掃描器/爬蟲完全沒有防護——2026-07 就真的抓到一次
// 這樣混進來的 "TR" (土耳其) 假訪客。只有真的執行 JS 的瀏覽器才會打這支 POST，
// 過濾掉絕大多數不執行 JS 的掃描器；User-Agent 檢查留著當第二道防線。
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT_UA_PATTERN.test(ua)) {
    return NextResponse.json(summarize(readStats()));
  }

  const country = (req.headers.get("cf-ipcountry") || "XX").toUpperCase();
  const stats = readStats();
  stats[country] = (stats[country] || 0) + 1;

  try {
    const dir = path.dirname(statsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(statsFile, JSON.stringify(stats));
  } catch {
    // 寫檔失敗不影響回應，下次還有機會
  }

  return NextResponse.json(summarize(stats));
}
