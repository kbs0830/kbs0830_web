// 旅行地球 /travel（TODO A5，2026-11-21）的資料：飛行紀錄（flights.ts）＋住宿紀錄（hotels.ts）合在一起。
// 隱私跟兩頁一樣：只有機場、城市跟次數，沒有日期；飯店只標到城市。
import { AIRPORTS, FLIGHTS, distanceKm, routes } from "./flights";
import { CITIES, hotelCountByCity } from "./hotels";

export interface Place {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  hotels: number; // 住過幾間
  flights: number; // 起降幾次（附近機場合計）
}

export interface Arc {
  from: [lat: number, lon: number];
  to: [lat: number, lon: number];
  count: number;
  label: string;
}

/** 機場離城市多近算同一個地方（成田到東京市中心約 60 km） */
const SAME_PLACE_KM = 80;

function kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** 城市（有住過）＋機場（附近沒有住過的城市才自己成一個點），起降次數算到最近的城市 */
export function travelPlaces(): Place[] {
  const hotelCount = hotelCountByCity();
  const places: Place[] = Object.entries(CITIES)
    .filter(([key]) => hotelCount[key])
    .map(([key, c]) => ({ id: key, name: c.name, country: c.country, lat: c.lat, lon: c.lon, hotels: hotelCount[key], flights: 0 }));

  const movements = new Map<string, number>();
  for (const [, from, to] of FLIGHTS) for (const code of [from, to]) movements.set(code, (movements.get(code) ?? 0) + 1);

  for (const [code, n] of movements) {
    const a = AIRPORTS[code];
    const near = places
      .map((p) => ({ p, km: kmBetween(p, a) }))
      .filter((x) => x.km < SAME_PLACE_KM)
      .sort((x, y) => x.km - y.km)[0];
    if (near) near.p.flights += n;
    else places.push({ id: code, name: a.name, country: a.country, lat: a.lat, lon: a.lon, hotels: 0, flights: n });
  }
  return places.sort((a, b) => b.hotels + b.flights - (a.hotels + a.flights));
}

export function travelArcs(): Arc[] {
  return routes().map((r) => ({
    from: [AIRPORTS[r.a].lat, AIRPORTS[r.a].lon],
    to: [AIRPORTS[r.b].lat, AIRPORTS[r.b].lon],
    count: r.count,
    label: `${AIRPORTS[r.a].name} ↔ ${AIRPORTS[r.b].name}：${r.count} 次`,
  }));
}

export function travelStats() {
  const places = travelPlaces();
  return {
    flights: FLIGHTS.length,
    km: Math.round(FLIGHTS.reduce((s, [, f, t]) => s + distanceKm(f, t), 0)),
    hotels: places.reduce((n, p) => n + p.hotels, 0),
    places: places.length,
    countries: new Set(places.map((p) => p.country)).size,
  };
}
