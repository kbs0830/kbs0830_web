import { flightHours, greatCircleKm, hm, kmToMiles } from "@/lib/tools/flight-calc";

// 熱門航線距離頁（TODO V3，2026-11-27）：台灣 5 個機場 × 日本 6 個機場＝30 頁，網址 /tools/airport-distance/tpe-fuk。
// 起因：Google 自動完成有「台北到福岡飛行距離」「桃園 機場 距離」，搜的人想直接看到答案，不是一個空的輸入框。
// 座標取自 public/data/airports.json（OurAirports，公共領域）；測試會比對兩邊一致，改了資料這裡會抓到。
// 只放算得出來的數字（距離、粗估時間），不放航空公司、班表：那些要即時資料，指到 /tools/taiwan-fukuoka。

export type RouteAirport = { code: string; label: string; name: string; city: string; lat: number; lon: number };

/** 出發：台灣 5 個有國際線的機場 */
export const ORIGINS: RouteAirport[] = [
  { code: "TPE", label: "台北（桃園）", name: "桃園機場", city: "台北", lat: 25.078, lon: 121.233 },
  { code: "TSA", label: "台北（松山）", name: "松山機場", city: "台北", lat: 25.067, lon: 121.553 },
  { code: "KHH", label: "高雄", name: "小港機場", city: "高雄", lat: 22.577, lon: 120.35 },
  { code: "RMQ", label: "台中", name: "台中機場", city: "台中", lat: 24.265, lon: 120.621 },
  { code: "TNN", label: "台南", name: "台南機場", city: "台南", lat: 22.95, lon: 120.206 },
];

/** 目的地：台灣人最常飛的 6 個日本機場 */
export const DESTINATIONS: RouteAirport[] = [
  { code: "FUK", label: "福岡", name: "福岡機場", city: "福岡", lat: 33.586, lon: 130.451 },
  { code: "NRT", label: "東京（成田）", name: "成田機場", city: "東京", lat: 35.769, lon: 140.389 },
  { code: "HND", label: "東京（羽田）", name: "羽田機場", city: "東京", lat: 35.55, lon: 139.787 },
  { code: "KIX", label: "大阪（關西）", name: "關西機場", city: "大阪", lat: 34.427, lon: 135.244 },
  { code: "NGO", label: "名古屋", name: "中部國際機場", city: "名古屋", lat: 34.858, lon: 136.805 },
  { code: "CTS", label: "札幌（新千歲）", name: "新千歲機場", city: "札幌", lat: 42.775, lon: 141.69 },
];

export type RouteInfo = {
  slug: string;
  from: RouteAirport;
  to: RouteAirport;
  km: number;
  miles: number;
  hours: number;
  /** 「約 2 小時 10 分」這種字串 */
  time: string;
  title: string;
  description: string;
  answer: string;
};

const nf = new Intl.NumberFormat("en-US");
const round10 = (n: number) => Math.round(n / 10) * 10; // 距離寫到十位，避免假精準

/** 「台北（桃園，TPE）」「福岡（FUK）」：括號已經有了就把代碼塞進同一組括號，不要變成兩組 */
export const withCode = (a: RouteAirport) => (a.label.includes("（") ? a.label.replace("）", `，${a.code}）`) : `${a.label}（${a.code}）`);

export const routeSlug = (from: string, to: string) => `${from.toLowerCase()}-${to.toLowerCase()}`;

export function allRouteSlugs(): string[] {
  return ORIGINS.flatMap((o) => DESTINATIONS.map((d) => routeSlug(o.code, d.code)));
}

export function routeInfo(slug: string): RouteInfo | null {
  const [f, t] = slug.toUpperCase().split("-");
  const from = ORIGINS.find((o) => o.code === f);
  const to = DESTINATIONS.find((d) => d.code === t);
  if (!from || !to || slug.split("-").length !== 2) return null;
  const km = greatCircleKm(from, to);
  const hours = flightHours(km);
  const time = `約 ${hm(hours)}`;
  const kmText = nf.format(round10(km));
  const miText = nf.format(round10(kmToMiles(km)));
  const answer = `${withCode(from)}到${withCode(to)}的直線距離約 ${kmText} 公里（${miText} 英里），飛行${time}。`;
  return {
    slug: routeSlug(from.code, to.code),
    from,
    to,
    km,
    miles: kmToMiles(km),
    hours,
    time,
    title: `${from.label}到${to.label}飛行距離與時間：約 ${kmText} 公里、${time}`,
    description: `${answer}距離是大圓路線、時間用 800 km/h 加 30 分鐘起降粗估，實際會依風向跟航路不同。`,
    answer,
  };
}
