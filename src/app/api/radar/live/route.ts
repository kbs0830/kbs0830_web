import path from "node:path";
import { NextResponse, connection } from "next/server";
import { dataFile } from "@/lib/data-file";
import { AIRLINE_NAMES, TYPE_NAMES, detail, readState } from "../../../../../scripts/lib/radar.js";
import { twDate } from "../../../../../scripts/lib/tw-time.js";
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
  const state = readState(file);
  const d = detail(state, now);
  // 昨天的航空公司統計（只有數字）：「剛剛經過」不滿 5 班時拿來補滿；昨天沒有逐班紀錄，不編班號
  const yd = state?.days?.[twDate(now - 86400_000)];
  const yesterday = yd
    ? {
        date: twDate(now - 86400_000),
        unique: yd.unique,
        airlines: Object.entries(yd.airlines as Record<string, number>)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 5)
          .map(([code, n]) => ({ code, name: (AIRLINE_NAMES as Record<string, string>)[code] || code, n })),
      }
    : null;
  // 底部輪播要用的統計：跟 /radar 頁公開的是同一批（只有數字、航空公司、機型、時段，沒有位置）
  const stats =
    "daily" in d
      ? { online: Boolean(d.online), today: d.today, week: d.week, lastAircraftAt: d.lastAircraftAt ?? null, hours: d.hours, yesterday, weekAirlines: d.weekAirlines.slice(0, 4), weekTypes: d.weekTypes.slice(0, 4), total: d.total }
      : { online: false };
  // build：這次部署的 commit。OBS 的瀏覽器來源不會自己刷新，畫面看到 build 變了就自己重新載入（RadarLiveScreen）
  return NextResponse.json({ ...frame, ...stats, build: process.env.BUILD_COMMIT_SHA ?? null }, { headers: { "cache-control": "no-store" } });
}
