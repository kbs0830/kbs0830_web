import { NextResponse, connection } from "next/server";
import { dataFile } from "@/lib/data-file";
import { getBoards, upcoming, type Flight } from "@/lib/travel/airport-board";
import { getWeather } from "@/lib/live/weather";
import { getAirQuality } from "@/lib/live/air-quality";
import { getMetarRaw } from "@/lib/live/metar";
import { AIRLINE_NAMES, TYPE_NAMES, readState } from "../../../../../scripts/lib/radar.js";
import { twDate } from "../../../../../scripts/lib/tw-time.js";

// 直播畫面（/radar/live）「沒有飛機時」輪播的四張卡片用的資料：小港起飛、小港降落、現在天氣（含高雄機場 METAR 電報）、近三天雷達資料。
// 主 API（/api/radar/live，5 秒一次）不放這些：外部資料第一次抓可能要幾秒，不能拖慢它；畫面閒置時才每分鐘來問一次這支。
// 時刻表、天氣、空品都是各自 lib/live 的快取（3～30 分鐘才真的去抓）；任何一項抓不到就是 null，畫面那張卡就略過。
// 福岡不放（使用者：「天氣跟小港機場時刻表，跟福岡不要有關係」）。
const radarFile = () => dataFile("RADAR_FILE", "radar.json");

const nowHmTaipei = (ms: number) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);

const rows = (all: Flight[] | undefined, dir: Flight["dir"], nowHm: string) =>
  all
    ? upcoming(all.filter((f) => f.dir === dir), nowHm, 6).map((f) => ({ t: f.sched, changed: f.changed, code: f.code, place: f.place, status: f.status, kind: f.kind, gate: f.gate }))
    : null;

export async function GET() {
  await connection(); // 現在的時刻表、近三天的統計都是即時的
  const now = Date.now();
  const nowHm = nowHmTaipei(now);
  const [boards, weather, aq, metar] = await Promise.all([
    getBoards().catch(() => null),
    getWeather().catch(() => null),
    getAirQuality().catch(() => null),
    getMetarRaw("RCKH").catch(() => null),
  ]);

  // 近三天（含今天）的雷達統計：只有數字、航空公司
  const state = readState(radarFile());
  const days = [0, 1, 2].map((i) => twDate(now - i * 86400_000)).reverse();
  const perDay = days.map((d) => ({ date: d, unique: state?.days?.[d]?.unique ?? 0, peak: state?.days?.[d]?.peak ?? 0 }));
  const air: Record<string, number> = {};
  for (const d of days) for (const [k, n] of Object.entries((state?.days?.[d]?.airlines ?? {}) as Record<string, number>)) air[k] = (air[k] ?? 0) + n;
  // 三天的機型：把每天的「機型 → 架數」加起來
  const typ: Record<string, number> = {};
  for (const d of days) for (const [k, n] of Object.entries((state?.days?.[d]?.types ?? {}) as Record<string, number>)) typ[k] = (typ[k] ?? 0) + n;
  const last3 = state
    ? {
        unique: perDay.reduce((n, d) => n + d.unique, 0),
        peak: Math.max(...perDay.map((d) => d.peak)),
        days: perDay,
        airlines: Object.entries(air)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 3)
          .map(([code, n]) => ({ name: (AIRLINE_NAMES as Record<string, string>)[code] || code, n })),
        types: Object.entries(typ)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 3)
          .map(([code, n]) => ({ name: (TYPE_NAMES as Record<string, string>)[code] || code, n })),
      }
    : null;

  const kh = weather?.value.find((c) => c.id === "kh");
  return NextResponse.json(
    {
      nowHm,
      dep: rows(boards?.khh?.value, "dep", nowHm),
      arr: rows(boards?.khh?.value, "arr", nowHm),
      weather: kh ? { temp: kh.temp, label: kh.label } : null,
      aqi: aq ? { aqi: aq.value.aqi, status: aq.value.status, main: aq.value.main } : null,
      metar: metar ? { raw: metar.raw, at: metar.at } : null,
      last3,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
