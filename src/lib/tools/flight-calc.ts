// 機場距離與飛行時間的計算（TODO J5／V3）：/tools/airport-distance 的互動工具（瀏覽器算）跟熱門航線頁（伺服器靜態產生）共用，數字只算一次。

const EARTH_KM = 6371;
const CRUISE_KMH = 800; // 噴射客機的平均地速，粗估用
const TAXI_H = 0.5; // 起降、滑行多出來的時間
const KM_PER_MILE = 1.609344;

/** 大圓距離（公里）：地球表面兩點最短的路線，球面近似 */
export function greatCircleKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** 粗估飛行時間（小時）：距離 ÷ 800 km/h ＋ 0.5 小時；不含風向（往東通常比較快） */
export const flightHours = (km: number) => km / CRUISE_KMH + TAXI_H;

/** 2.1667 小時 → 「2 小時 10 分」 */
export const hm = (h: number) => {
  const total = Math.round(h * 60);
  return `${Math.floor(total / 60)} 小時 ${total % 60} 分`;
};

export const kmToMiles = (km: number) => km / KM_PER_MILE;
