import { NextResponse } from "next/server";
import path from "path";
import { readState, summarize } from "../../../../scripts/lib/radar.js";

// 自家 FR24 雷達的公開狀態（/flights 的 RadarStatus 每分鐘讀一次）。
// 資料是 scripts/server.js 每 30 秒在區網讀雷達後寫的 data/radar.json；這裡只讀、只回傳 summarize() 挑過的欄位
// （現在幾架、今天幾架、航空公司統計、在線率），識別碼／座標／內網 IP／FR24 金鑰都不會出去。
// `next dev` 沒有 RADAR_FILE，退回專案根目錄的 data/radar.json（沒有就回 configured: false，元件不顯示）。
const radarFile =
  process.env.RADAR_FILE || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "radar.json");

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(summarize(readState(radarFile), Date.now()), {
    headers: { "cache-control": "no-store" },
  });
}
