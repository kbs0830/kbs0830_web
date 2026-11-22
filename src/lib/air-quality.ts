import { cached, fetchJson } from "./live-cache";

// 空氣品質作品的「線上版」（TODO D5，2026-11-22）：高雄現在的空氣品質，用環境部的公式從六項污染物算出 AQI 跟等級。
// 作品（school repo 的 Orange 期末報告）是用機器學習從同樣這六項「預測」等級；這裡用官方公式「直接算」——
// 作品裡決策樹 17/17 全對，就是因為等級本來就是污染物切門檻算出來的。
//
// 資料：Open-Meteo Air Quality（歐洲 CAMS 空品模型推估，免費、不用金鑰），**不是環境部測站實測**，數字會跟環境部 App 不一樣。
//   環境部的開放資料要申請金鑰（api_key），有了可以改抓測站。
// 公式：環境部「空氣品質指標（114 年啟用）」即時 AQI（https://airtw.moenv.gov.tw/cht/Information/Standard/AirQualityIndicatorNew.aspx，2026-11-22 對過）
//   PM2.5／PM10：0.5×前 12 小時平均＋0.5×前 4 小時平均；O3 8 小時、CO 8 小時移動平均；O3、SO2、NO2 取即時值
//   各副指標取最大值＝AQI，那一項是指標污染物

export const AQ_PLACE = { name: "高雄", lat: 22.63, lon: 120.3 };

type Row = [cLo: number, cHi: number, iLo: number, iHi: number];
const rows = (bps: [number, number][], from = 0): Row[] => {
  const idx: [number, number][] = [[0, 50], [51, 100], [101, 150], [151, 200], [201, 300], [301, 400], [401, 500]];
  return bps.map(([lo, hi], i) => [lo, hi, idx[i + from][0], idx[i + from][1]]);
};

// 114 年啟用的對照表
const TABLE = {
  o3_8h: rows([[0, 0.054], [0.055, 0.07], [0.071, 0.085], [0.086, 0.105], [0.106, 0.2]]), // ppm
  o3_1h: rows([[0.101, 0.134], [0.135, 0.204], [0.205, 0.404], [0.405, 0.504], [0.505, 0.604]], 2), // ppm，從 101 開始
  pm25: rows([[0, 12.4], [12.5, 30.4], [30.5, 50.4], [50.5, 125.4], [125.5, 225.4], [225.5, 325.4], [325.5, 500.4]]), // μg/m³
  pm10: rows([[0, 30], [31, 75], [76, 190], [191, 354], [355, 424], [425, 504], [505, 604]]), // μg/m³
  co: rows([[0, 4.4], [4.5, 9.4], [9.5, 12.4], [12.5, 15.4], [15.5, 30.4], [30.5, 40.4], [40.5, 50.4]]), // ppm，8 小時
  so2: rows([[0, 8], [9, 65], [66, 160], [161, 304]]), // ppb，小時值（200 以上官方改用 24 小時值，這裡到 200 為止）
  no2: rows([[0, 21], [22, 100], [101, 360], [361, 649], [650, 1249], [1250, 1649], [1650, 2049]]), // ppb
};
// 濃度先照官方的有效位數四捨五入，再查表（不然 12.45 會落在兩段中間的縫）
const DIGITS = { o3_8h: 3, o3_1h: 3, pm25: 1, pm10: 0, co: 1, so2: 0, no2: 0 } as const;

/** 濃度 → 副指標（線性內插）；超出表的範圍回 null（O3 小時值 < 0.101 不算） */
export function subIndex(kind: keyof typeof TABLE, c: number): number | null {
  if (!Number.isFinite(c) || c < 0) return null;
  const v = Number(c.toFixed(DIGITS[kind]));
  for (const [cLo, cHi, iLo, iHi] of TABLE[kind]) {
    if (v >= cLo && v <= cHi) return Math.round(((iHi - iLo) / (cHi - cLo)) * (v - cLo) + iLo);
  }
  const last = TABLE[kind][TABLE[kind].length - 1];
  return v > last[1] ? last[3] : null;
}

export function aqiStatus(aqi: number): string {
  if (aqi <= 50) return "良好";
  if (aqi <= 100) return "普通";
  if (aqi <= 150) return "對敏感族群不健康";
  if (aqi <= 200) return "對所有族群不健康";
  if (aqi <= 300) return "非常不健康";
  return "危害";
}

// μg/m³ → ppb（25°C、1 大氣壓：ppb = μg/m³ × 24.45 ÷ 分子量）
const toPpb = (ugm3: number, mw: number) => (ugm3 * 24.45) / mw;
const MW = { o3: 48.0, no2: 46.0055, so2: 64.066, co: 28.01 };

export interface Pollutant {
  key: "pm25" | "pm10" | "o3" | "co" | "so2" | "no2";
  name: string;
  value: number; // 換算後、拿去查表的濃度
  unit: string;
  basis: string; // 用哪種平均
  index: number | null;
}

export interface AirQuality {
  place: string;
  time: string; // 資料時間（台灣時間，YYYY-MM-DDTHH:00）
  aqi: number;
  status: string;
  main: string | null; // 指標污染物（AQI ≤ 50 時官方不標，這裡也回 null）
  pollutants: Pollutant[];
}

type Hourly = { time: string[]; pm2_5: (number | null)[]; pm10: (number | null)[]; ozone: (number | null)[]; nitrogen_dioxide: (number | null)[]; sulphur_dioxide: (number | null)[]; carbon_monoxide: (number | null)[] };

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
};

/** Open-Meteo 的逐時資料 → 現在這個小時的即時 AQI。nowHour：台灣時間 "YYYY-MM-DDTHH:00" */
export function computeAirQuality(h: Hourly, nowHour: string): AirQuality {
  let i = h.time.lastIndexOf(nowHour);
  if (i < 0) i = h.time.filter((t) => t <= nowHour).length - 1;
  if (i < 11) throw new Error("逐時資料不夠 12 小時");
  const last = (arr: (number | null)[], n: number) => arr.slice(i - n + 1, i + 1);
  const movingPm = (arr: (number | null)[]) => 0.5 * avg(last(arr, 12)) + 0.5 * avg(last(arr, 4));

  const pm25 = movingPm(h.pm2_5);
  const pm10 = movingPm(h.pm10);
  const o3now = toPpb(h.ozone[i] ?? NaN, MW.o3) / 1000;
  const o38 = toPpb(avg(last(h.ozone, 8)), MW.o3) / 1000;
  const co8 = toPpb(avg(last(h.carbon_monoxide, 8)), MW.co) / 1000;
  const so2 = toPpb(h.sulphur_dioxide[i] ?? NaN, MW.so2);
  const no2 = toPpb(h.nitrogen_dioxide[i] ?? NaN, MW.no2);

  const o3Index = Math.max(subIndex("o3_8h", o38) ?? -1, subIndex("o3_1h", o3now) ?? -1);
  const pollutants: Pollutant[] = [
    { key: "pm25", name: "PM2.5", value: Number(pm25.toFixed(1)), unit: "μg/m³", basis: "12＋4 小時移動平均", index: subIndex("pm25", pm25) },
    { key: "pm10", name: "PM10", value: Math.round(pm10), unit: "μg/m³", basis: "12＋4 小時移動平均", index: subIndex("pm10", pm10) },
    { key: "o3", name: "O₃", value: Number(o38.toFixed(3)), unit: "ppm", basis: "8 小時平均", index: o3Index >= 0 ? o3Index : null },
    { key: "co", name: "CO", value: Number(co8.toFixed(1)), unit: "ppm", basis: "8 小時平均", index: subIndex("co", co8) },
    { key: "so2", name: "SO₂", value: Math.round(so2), unit: "ppb", basis: "即時", index: subIndex("so2", so2) },
    { key: "no2", name: "NO₂", value: Math.round(no2), unit: "ppb", basis: "即時", index: subIndex("no2", no2) },
  ];
  const valid = pollutants.filter((p) => p.index !== null);
  if (valid.length < 4) throw new Error("可以算的污染物太少");
  const top = valid.reduce((a, b) => (b.index! > a.index! ? b : a));
  const aqi = top.index!;
  return { place: AQ_PLACE.name, time: h.time[i], aqi, status: aqiStatus(aqi), main: aqi > 50 ? top.name : null, pollutants };
}

const taipeiHour = (ms: number) => new Date(ms + 8 * 3600_000).toISOString().slice(0, 13) + ":00";

/** 30 分鐘抓一次（模型資料一小時才更新一次） */
export function getAirQuality() {
  return cached(
    "air-quality",
    30 * 60_000,
    async () => {
      const raw = await fetchJson<{ hourly: Hourly }>(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${AQ_PLACE.lat}&longitude=${AQ_PLACE.lon}` +
          "&hourly=pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide&past_days=1&forecast_days=1&timezone=Asia%2FTaipei",
      );
      return computeAirQuality(raw.hourly, taipeiHour(Date.now()));
    },
    { failRetryMs: 5 * 60_000 },
  );
}
