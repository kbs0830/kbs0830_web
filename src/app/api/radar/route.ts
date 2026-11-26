import { NextResponse, connection } from "next/server";
import { dataFile } from "@/lib/data-file";
import { detail, readState, summarize } from "../../../../scripts/lib/radar.js";

// 自家 FR24 雷達的公開狀態（/flights 的 RadarStatus 每分鐘讀一次）。
// 資料是 scripts/server.js 每 30 秒在區網讀雷達後寫的 data/radar.json；這裡只讀、只回傳 summarize() 挑過的欄位
// （現在幾架、今天幾架、航空公司統計、在線率），識別碼／座標／內網 IP／FR24 金鑰都不會出去。
// `next dev` 沒有 RADAR_FILE，退回專案根目錄的 data/radar.json（沒有就回 configured: false，元件不顯示）。
const radarFile = () => dataFile("RADAR_FILE", "radar.json");


// ?hours=1：多回傳「一天的節奏」（近 7 天每小時平均最多同時幾架，24 個數字）——雷達站作品頁的即時小圖用（TODO M14）。
// 作品頁是 ensureStatic 的靜態頁，不能在 server 串流即時資料，改由瀏覽器來抓。只有時段，不含位置
export async function GET(req: Request) {
  await connection(); // Cache Components：同步讀檔不算「即時」，不加這行 build 時會把當下的數字凍結（TODO C13）
  const state = readState(radarFile());
  const now = Date.now();
  const body = new URL(req.url).searchParams.has("hours")
    ? (() => {
        const d = detail(state, now);
        return "hours" in d ? { ...summarize(state, now), hours: d.hours } : d;
      })()
    : summarize(state, now);
  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}
