// 飛行紀錄（/flights 頁）。來源：使用者 2026-11-05 提供的 byAir 匯出檔。
//
// ⚠️ 隱私：只留「航班代碼＋起降機場」。日期、時間、座位、訂位代碼、備註一律不放——
// 有日期就拼得出行程（什麼時候不在家），跟足跡區塊同一條規則（CLAUDE.md「足跡」）。
// 陣列順序是依代碼排序，不是時間順序。
// 已排除：JX206（使用者備註「根本沒有搭到」）、GK17（同一天另有 UA837，使用者確認搭的是 UA837）。
// 新增航班直接加一行 [代碼, 出發, 抵達]；機場沒在下面 AIRPORTS 的話要補上（座標用機場官方公開資料）。

export const FLIGHTS: [code: string, from: string, to: string][] = [
  ["6J44", "ISG", "OKA"],
  ["B78689", "KHH", "MZG"], ["B78691", "MZG", "KHH"], ["B78698", "MZG", "KHH"], ["B78712", "MZG", "KHH"],
  ["B78986", "KNH", "TNN"],
  ["BR107", "NRT", "KHH"], ["BR107", "NRT", "KHH"],
  ["BR112", "TPE", "OKA"],
  ["BR119", "FUK", "KHH"], ["BR119", "FUK", "KHH"], ["BR120", "KHH", "FUK"],
  ["BR147", "KIX", "KHH"], ["BR177", "KIX", "TPE"], ["BR183", "NRT", "TPE"], ["BR196", "TPE", "NRT"],
  ["BR61", "TPE", "BKK"], ["BR858", "HKG", "TPE"], ["BR8811", "TSA", "KNH"], ["BR891", "TPE", "HKG"],
  ["CI138", "KHH", "FUK"], ["CI138", "KHH", "FUK"], ["CI936", "HKG", "KHH"],
  ["EH430", "FUK", "ITM"],
  ["EK384", "BKK", "HKG"],
  ["FW60", "FUK", "NGO"],
  ["GK12", "TPE", "NRT"],
  ["IT270", "KHH", "FUK"], ["IT271", "FUK", "KHH"], ["IT289", "OKA", "KHH"], ["IT700", "TPE", "NRT"],
  ["IT720", "TPE", "FUK"], ["IT762", "KHH", "ISG"],
  ["JL107", "HND", "ITM"], ["JL130", "ITM", "HND"], ["JL2174", "AXT", "ITM"],
  ["KE792", "FUK", "ICN"],
  ["MM32", "KHH", "KIX"], ["MM32", "KHH", "KIX"], ["MM859", "HND", "TPE"],
  ["NH289", "FUK", "CTS"], ["NH407", "HND", "AKJ"], ["NH462", "OKA", "HND"],
  ["OZ102", "ICN", "NRT"],
  ["TR899", "NRT", "TPE"],
  ["UA2498", "SFO", "IAH"], ["UA837", "NRT", "KHH"], ["UA871", "SFO", "TPE"], ["UA872", "TPE", "SFO"],
  ["VJ946", "HAN", "KHH"], ["VJ947", "KHH", "HAN"],
];

export interface Airport {
  name: string; // 中文顯示名稱
  country: string;
  lat: number;
  lon: number;
}

export const AIRPORTS: Record<string, Airport> = {
  KHH: { name: "高雄", country: "台灣", lat: 22.577, lon: 120.35 },
  TPE: { name: "桃園", country: "台灣", lat: 25.078, lon: 121.233 },
  TSA: { name: "台北松山", country: "台灣", lat: 25.069, lon: 121.552 },
  TNN: { name: "台南", country: "台灣", lat: 22.95, lon: 120.206 },
  MZG: { name: "澎湖", country: "台灣", lat: 23.569, lon: 119.628 },
  KNH: { name: "金門", country: "台灣", lat: 24.428, lon: 118.359 },
  FUK: { name: "福岡", country: "日本", lat: 33.586, lon: 130.451 },
  NRT: { name: "東京成田", country: "日本", lat: 35.765, lon: 140.386 },
  HND: { name: "東京羽田", country: "日本", lat: 35.553, lon: 139.781 },
  KIX: { name: "大阪關西", country: "日本", lat: 34.427, lon: 135.244 },
  ITM: { name: "大阪伊丹", country: "日本", lat: 34.785, lon: 135.438 },
  NGO: { name: "名古屋中部", country: "日本", lat: 34.858, lon: 136.805 },
  OKA: { name: "沖繩那霸", country: "日本", lat: 26.196, lon: 127.646 },
  ISG: { name: "石垣", country: "日本", lat: 24.396, lon: 124.245 },
  CTS: { name: "札幌新千歲", country: "日本", lat: 42.775, lon: 141.692 },
  AKJ: { name: "旭川", country: "日本", lat: 43.671, lon: 142.448 },
  AXT: { name: "秋田", country: "日本", lat: 39.616, lon: 140.219 },
  ICN: { name: "首爾仁川", country: "韓國", lat: 37.46, lon: 126.441 },
  HKG: { name: "香港", country: "香港", lat: 22.308, lon: 113.918 },
  HAN: { name: "河內", country: "越南", lat: 21.221, lon: 105.807 },
  BKK: { name: "曼谷素萬那普", country: "泰國", lat: 13.69, lon: 100.75 },
  SFO: { name: "舊金山", country: "美國", lat: 37.619, lon: -122.375 },
  IAH: { name: "休士頓", country: "美國", lat: 29.984, lon: -95.341 },
};

// 航班代碼前兩碼 → 航空公司
export const AIRLINES: Record<string, string> = {
  "6J": "亞洲天空航空 Solaseed Air",
  B7: "立榮航空 UNI Air",
  BR: "長榮航空 EVA Air",
  CI: "中華航空 China Airlines",
  EH: "ANA Wings",
  EK: "阿聯酋航空 Emirates",
  FW: "富士夢幻航空 FDA",
  GK: "捷星日本 Jetstar Japan",
  IT: "台灣虎航 Tigerair Taiwan",
  JL: "日本航空 JAL",
  KE: "大韓航空 Korean Air",
  MM: "樂桃航空 Peach",
  NH: "全日空 ANA",
  OZ: "韓亞航空 Asiana",
  TR: "酷航 Scoot",
  UA: "聯合航空 United",
  VJ: "越捷航空 VietJet",
};

export const airlineOf = (code: string) => code.slice(0, 2);

/** 兩機場之間的大圓距離（公里，球面近似） */
export function distanceKm(a: string, b: string): number {
  const p = AIRPORTS[a], q = AIRPORTS[b];
  const rad = Math.PI / 180;
  const dLat = (q.lat - p.lat) * rad, dLon = (q.lon - p.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * rad) * Math.cos(q.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface Route {
  a: string; // 兩端機場依代碼排序，A→B 跟 B→A 算同一條
  b: string;
  count: number;
  codes: string[];
  km: number;
}

/** 航線（不分方向）＋次數，次數多的在前 */
export function routes(): Route[] {
  const map = new Map<string, Route>();
  for (const [code, from, to] of FLIGHTS) {
    const [a, b] = [from, to].sort();
    const key = `${a}-${b}`;
    const r = map.get(key) ?? { a, b, count: 0, codes: [], km: Math.round(distanceKm(a, b)) };
    r.count++;
    if (!r.codes.includes(code)) r.codes.push(code);
    map.set(key, r);
  }
  return [...map.values()].sort((x, y) => y.count - x.count || y.km - x.km);
}

export function flightStats() {
  const airports = new Set(FLIGHTS.flatMap(([, f, t]) => [f, t]));
  const airlines = new Map<string, number>();
  for (const [code] of FLIGHTS) airlines.set(airlineOf(code), (airlines.get(airlineOf(code)) ?? 0) + 1);
  const km = FLIGHTS.reduce((sum, [, f, t]) => sum + distanceKm(f, t), 0);
  return {
    flights: FLIGHTS.length,
    airports: airports.size,
    countries: new Set([...airports].map((c) => AIRPORTS[c].country)).size,
    airlines: [...airlines.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])),
    km: Math.round(km),
    earthLaps: km / 40075,
  };
}

/** 機場依國家分組（台灣在前，其餘照機場數多寡） */
export function airportsByCountry(): [country: string, codes: string[]][] {
  const used = new Set(FLIGHTS.flatMap(([, f, t]) => [f, t]));
  const groups = new Map<string, string[]>();
  for (const code of Object.keys(AIRPORTS)) {
    if (!used.has(code)) continue;
    const c = AIRPORTS[code].country;
    groups.set(c, [...(groups.get(c) ?? []), code]);
  }
  return [...groups.entries()].sort((x, y) => (x[0] === "台灣" ? -1 : y[0] === "台灣" ? 1 : y[1].length - x[1].length));
}
