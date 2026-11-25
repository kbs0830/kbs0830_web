// 首頁的天空跟高雄真的天空同步（2026-11-25，使用者：「我要有感一點的改動」「尤其 3 的部分」）。
// 一份 module 層級的狀態，三個地方讀：
//   - HeroSky（色層＋左下角那行字）：useSky()，React 訂閱
//   - HeroScene／HeroSceneLite（雨、櫻花、夜晚流星）：每幀直接讀 skyNow()，不進 React
// 天氣：/api/weather（伺服器 30 分鐘跟 Open-Meteo 抓一次）的高雄 WMO 代碼；時段：瀏覽器自己算高雄的日出日落。
// 預覽：網址加 ?sky=rain|storm|cloud|fog|clear&phase=dawn|day|dusk|night&sakura=1 強制指定（截圖、E2E、給人看效果）
// 月相：?moon=<0～29.5 的月齡> 強制指定（手機夜空的月亮）

import { useSyncExternalStore } from "react";

export type Phase = "dawn" | "day" | "dusk" | "night";
export type SkyWeather = "clear" | "cloud" | "rain" | "storm" | "fog";
export interface Sky {
  phase: Phase;
  weather: SkyWeather;
  sakura: boolean;
  temp: number | null;
  /** 天氣是不是讀到了（讀到之前 weather 是 clear、不顯示天氣字） */
  live: boolean;
  /** 今天的月相名字（新月、上弦、滿月…），夜晚顯示 */
  moon: string;
}

const KAOHSIUNG = { lat: 22.63, lon: 120.3 };
const DAY_MS = 86_400_000;

/** 日出日落（NOAA 簡化公式，誤差一兩分鐘），回傳 UTC 毫秒 */
export function sunTimes(date: Date, lat = KAOHSIUNG.lat, lon = KAOHSIUNG.lon): { sunrise: number; sunset: number } {
  const rad = Math.PI / 180;
  // 以該地的當地正午為基準算當天
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const n = Math.floor((dayStart - Date.UTC(2000, 0, 1, 12)) / DAY_MS) + 1;
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = jStar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const decl = Math.asin(Math.sin(lambda * rad) * Math.sin(23.4397 * rad));
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad;
  const toMs = (j: number) => Date.UTC(2000, 0, 1, 12) + j * DAY_MS;
  return { sunrise: toMs(jTransit - H / 360), sunset: toMs(jTransit + H / 360) };
}

/** 日出前後是 dawn、日落前後是 dusk（各約一個半小時） */
export function phaseAt(now: number, lat = KAOHSIUNG.lat, lon = KAOHSIUNG.lon): Phase {
  // 用台灣日期算當天的日出日落（UTC+8 的日期）
  const tw = new Date(now + 8 * 3600_000);
  const { sunrise, sunset } = sunTimes(new Date(Date.UTC(tw.getUTCFullYear(), tw.getUTCMonth(), tw.getUTCDate())), lat, lon);
  const MIN = 60_000;
  if (now >= sunrise - 40 * MIN && now < sunrise + 50 * MIN) return "dawn";
  if (now >= sunset - 50 * MIN && now < sunset + 40 * MIN) return "dusk";
  if (now >= sunrise + 50 * MIN && now < sunset - 50 * MIN) return "day";
  return "night";
}

/** WMO 天氣代碼 → 這裡用到的五種 */
export function skyWeather(code: number): SkyWeather {
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code === 2 || code === 3) return "cloud";
  return "clear"; // 0、1；高雄不下雪，其他少見代碼也當晴
}

/** 福岡櫻花季：平年開花約 3/22、滿開約 3/30，抓 3/18～4/12（台灣日期） */
export function isSakuraSeason(now: number): boolean {
  const tw = new Date(now + 8 * 3600_000);
  const md = (tw.getUTCMonth() + 1) * 100 + tw.getUTCDate();
  return md >= 318 && md <= 412;
}

// ── 月相（2026-11-26，手機夜空畫月亮用）────────────────────
// 平均朔望月＋一個已知新月（2000-01-06 18:14 UTC）推算，誤差半天以內；只拿來畫圖跟顯示名字，夠用。
export const SYNODIC_DAYS = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export interface MoonPhase {
  /** 月齡（天，0＝新月、約 14.77＝滿月） */
  age: number;
  /** 被照亮的比例 0～1 */
  illum: number;
  /** 盈（上半月，北半球右邊亮）／虧（左邊亮） */
  waxing: boolean;
  name: string;
}

const MOON_NAMES = ["新月", "眉月", "上弦", "盈凸", "滿月", "虧凸", "下弦", "殘月"] as const;

export function moonPhase(now: number): MoonPhase {
  const days = (now - KNOWN_NEW_MOON) / DAY_MS;
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const frac = age / SYNODIC_DAYS; // 0～1
  const illum = (1 - Math.cos(frac * 2 * Math.PI)) / 2;
  return { age, illum, waxing: frac < 0.5, name: MOON_NAMES[Math.round(frac * 8) % 8] };
}

export const PHASE_NAMES: Record<Phase, string> = { dawn: "清晨", day: "白天", dusk: "黃昏", night: "夜晚" };
export const WEATHER_NAMES: Record<SkyWeather, string> = { clear: "晴", cloud: "多雲", rain: "雨", storm: "雷雨", fog: "霧" };

// ── 狀態 ────────────────────────────────────────────────
let sky: Sky = { phase: "day", weather: "clear", sakura: false, temp: null, live: false, moon: "" };
const listeners = new Set<() => void>();
let started = false;
const forced: Partial<Sky> = {};
let forcedMoonAge: number | null = null;

/** 現在的月相（?moon= 有指定就用指定的月齡） */
export function moonNow(): MoonPhase {
  if (forcedMoonAge === null) return moonPhase(Date.now());
  return moonPhase(KNOWN_NEW_MOON + forcedMoonAge * DAY_MS);
}

const set = (next: Partial<Sky>) => {
  const merged = { ...sky, ...next, ...forced };
  if (JSON.stringify(merged) === JSON.stringify(sky)) return;
  sky = merged;
  listeners.forEach((l) => l());
};

/** 每幀讀（canvas 用），不訂閱 */
export const skyNow = () => sky;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const q = new URLSearchParams(location.search);
  const w = q.get("sky"), p = q.get("phase");
  if (w && w in WEATHER_NAMES) forced.weather = w as SkyWeather;
  if (p && p in PHASE_NAMES) forced.phase = p as Phase;
  if (q.get("sakura") === "1") forced.sakura = true;
  const m = Number(q.get("moon"));
  if (q.has("moon") && Number.isFinite(m)) forcedMoonAge = ((m % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  if (forced.weather) forced.live = true;

  const tick = () => set({ phase: phaseAt(Date.now()), sakura: isSakuraSeason(Date.now()), moon: moonNow().name });
  tick();
  setInterval(tick, 60_000);
  const load = async () => {
    if (document.hidden) return;
    try {
      const r = await fetch("/api/weather");
      const { cities } = (await r.json()) as { cities: { id: string; temp: number; code: number }[] };
      const kh = cities.find((c) => c.id === "kh");
      if (kh) set({ weather: skyWeather(kh.code), temp: kh.temp, live: true });
    } catch {}
  };
  void load();
  setInterval(load, 30 * 60_000);
}

export function useSky(): Sky | null {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sky,
    () => null,
  );
}

/** canvas 元件掛載時呼叫一次，確保有人開始抓天氣（HeroSky 沒掛也能動） */
export const ensureSky = start;
