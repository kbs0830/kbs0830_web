import path from "node:path";
import { NextResponse, connection } from "next/server";
import { dataFile } from "@/lib/data-file";
import { AIRLINE_NAMES, TYPE_NAMES, detail, readState } from "../../../../../scripts/lib/radar.js";
import { buildFrame, readTrack } from "../../../../../scripts/lib/radar-live.js";

// /radar/live（OBS 直播畫面）用的飛機位置。⚠️ 這支是整個站唯一會回座標的 API，所以：
//   - 只回 1 分鐘以前的取樣（buildFrame 的 DELAY_MS），沒有「現在」的位置
//   - id 是每天換一次的雜湊，沒有 ICAO hex／squawk／訊號強度；座標存到小數 4 位
//   - 地圖固定在高雄周邊、不標接收器（畫面端的規則，見 RadarLiveScreen.tsx）
// 規則全文在 scripts/lib/radar-live.js 開頭。
const radarFile = () => dataFile("RADAR_FILE", "radar.json");

export async function GET() {
  await connection(); // 同步讀檔：不加這行 build 時會把當下的內容凍結
  const file = radarFile();
  const dir = path.dirname(file);
  const now = Date.now();
  const frame = buildFrame(readTrack(path.join(dir, "radar-track.json")), readState(path.join(dir, "aircraft-types.json")), { airlines: AIRLINE_NAMES, types: TYPE_NAMES }, now);
  const d = detail(readState(file), now);
  const stats = "daily" in d ? { online: Boolean(d.online), today: d.today, week: d.week, lastAircraftAt: d.lastAircraftAt ?? null } : { online: false };
  return NextResponse.json({ ...frame, ...stats }, { headers: { "cache-control": "no-store" } });
}
