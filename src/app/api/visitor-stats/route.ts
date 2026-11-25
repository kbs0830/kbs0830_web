import { NextRequest, NextResponse, after, connection } from "next/server";
import { dataFile, readJsonFile, writeJsonFile } from "@/lib/data-file";
import { isBrowserUA } from "../../../../scripts/lib/bot-patterns.js";
import { readCloudflareSummary, refreshCloudflareIfStale } from "@/lib/stats/cloudflare-analytics";
import { readFeatureRelease, readRawTraffic } from "@/lib/stats/site-stats";
import { recordVisit, type VisitInput } from "@/lib/stats/visit-detail";
import { clientIp, RateLimiter, readLimitedText } from "@/lib/api/request-guard";

// 灌數字的防線（2026-11-25 安全檢查）：一個 IP 10 分鐘最多記 20 次造訪（正常人換 20 頁的量），超過照樣回彙總、不記
const recordLimit = new RateLimiter(600_000, 20);

// production 由 scripts/server.js 透過 VISITOR_STATS_FILE 傳絕對路徑進來，
// 因為 Task Scheduler 啟動時的 process.cwd() 不保證是專案根目錄。
// `next dev` 沒有這個環境變數，fallback 回 process.cwd()（本機開發時就是專案根目錄）。
// turbopackIgnore：這個 fs 路徑組合是給執行期讀寫用的資料檔，不是程式碼依賴，
// 不需要（也不應該）被 Turbopack 追蹤進 build 的檔案清單，避免它誤判整個專案
// 都被這支 API route 依賴（deploy.log 曾經真的跳出這個 NFT over-trace 警告）。
const statsFile = () => dataFile("VISITOR_STATS_FILE", "visitor-stats.json");

export type { RawTraffic } from "@/lib/stats/site-stats";

const readStats = (): Record<string, number> => readJsonFile<Record<string, number>>(statsFile()) ?? {};

function summarize(stats: Record<string, number>) {
  const entries = Object.entries(stats).filter(([code]) => code !== "XX");
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const top = entries.toSorted((a, b) => b[1] - a[1]).slice(0, 5);
  // Cloudflare 的數字一小時更新一次：回應送出之後才去抓（after），這次回應用檔案裡現有的
  after(refreshCloudflareIfStale);
  return { total, countryCount: entries.length, top, raw: readRawTraffic(), cloudflare: readCloudflareSummary(), newFeature: readFeatureRelease() };
}

export async function GET() {
  await connection(); // Cache Components：同步讀檔不算「即時」，不加這行 build 時會把當下的數字凍結（TODO C13）
  return NextResponse.json(summarize(readStats()));
}

// 訪客計數改由前端 JS 執行時回報（見 VisitorStats.tsx），不是伺服器對每個 request 的
// header 做啟發式判斷。原本 server.js 端的做法只要 UA 沒有明顯寫 "bot" 字樣就會被算進去，
// 對偽裝成一般瀏覽器 UA 的掃描器/爬蟲完全沒有防護——2026-07 就真的抓到一次
// 這樣混進來的 "TR" (土耳其) 假訪客。只有真的執行 JS 的瀏覽器才會打這支 POST，
// 過濾掉絕大多數不執行 JS 的掃描器；User-Agent 檢查留著當第二道防線。
export async function POST(req: NextRequest) {
  // 沒有 cf-ipcountry ＝沒經過 Cloudflare（CI 的 E2E、本機測試、印履歷 PDF），不是訪客。
  // 2026-11-05 之前這種請求會被記成 "XX"，資料檔裡累積了 1037 筆（GET 本來就不計 XX，所以沒顯示出來）。
  // Cloudflare 自己認不出國家時也會送 "XX"，那種才留著。跟 /api/web-vitals 同一條規則。
  const ua = req.headers.get("user-agent") || "";
  if (!req.headers.get("cf-ipcountry") || !isBrowserUA(ua)) {
    return NextResponse.json(summarize(readStats()));
  }

  // 訪客分析的明細（VisitBeacon 送來的頁面、來源、新訪客）。body 要在下面同步區段「之前」讀完（await）；
  // 沒有 body（舊版頁面、keepalive 失敗）就當空的，國家照算
  let input: VisitInput & { notMe?: unknown } = {};
  try {
    const text = await readLimitedText(req, 2000);
    if (text) input = JSON.parse(text);
  } catch {}
  // 站長自己的瀏覽器（/stats 的「不計入」開關，lib/client/not-me.ts）：國家、明細都不記，只回彙總（新功能指示燈要用）
  if (input.notMe === true || recordLimit.limited(clientIp(req))) return NextResponse.json(summarize(readStats()));

  // 這段 read-modify-write 中間刻意不夾雜任何 await，靠 fs.*Sync 的同步阻塞特性
  // 讓 Node.js 事件迴圈不會在兩次 request 的 handler 之間交錯執行，藉此避免
  // lost update 競態條件——這個正確性依賴「同步 fs 呼叫」+「scripts/server.js
  // 是單一 process、沒有 cluster」這兩個目前成立的前提。不要為了風格一致把
  // readFileSync/writeFileSync 改成 fs.promises 版本，也不要改成多 process 模式，
  // 除非同時把這段改成真正的原子操作（例如檔案鎖或換成資料庫）。
  const country = req.headers.get("cf-ipcountry")!.toUpperCase();
  // 國碼只收兩個英文字母（Cloudflare 一定是這個格式；格式不對＝偽造的請求，直接不記）
  if (!/^[A-Z]{2}$/.test(country)) return NextResponse.json(summarize(readStats()));
  const stats = readStats();
  stats[country] = (stats[country] || 0) + 1;

  writeJsonFile(statsFile(), stats); // 寫檔失敗不影響回應，下次還有機會
  recordVisit(input, ua, new Date(), country);

  return NextResponse.json(summarize(stats));
}
