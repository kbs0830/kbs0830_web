import { cached, fetchJson } from "./live-cache";

// 頁尾高雄／福岡天氣（TODO D3，2026-11-22）。Open-Meteo：免費、不用金鑰，一次請求抓兩個城市，30 分鐘抓一次。
// 顯示漢字（晴／多雲／雨…），跟網站的日式漢字點綴同一個語言，Windows 上也不會有 emoji 顯示不出來的問題。

export const WEATHER_CITIES = [
  { id: "kh", name: "高雄", lat: 22.63, lon: 120.3 },
  { id: "fk", name: "福岡", lat: 33.59, lon: 130.4 },
] as const;

export interface CityWeather {
  id: string;
  name: string;
  temp: number; // °C，四捨五入到整數
  label: string; // 晴、多雲、陰、霧、雨、雪、雷雨
  code: number; // WMO weather code
}

/** WMO 天氣代碼 → 漢字（https://open-meteo.com/en/docs 的 Weather variable documentation） */
export function weatherLabel(code: number): string {
  if (code <= 1) return "晴";
  if (code === 2) return "多雲";
  if (code === 3) return "陰";
  if (code === 45 || code === 48) return "霧";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "雨";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "雪";
  if (code >= 95) return "雷雨";
  return "–";
}

type OpenMeteoCurrent = { current?: { temperature_2m?: number; weather_code?: number } };

export function parseWeather(raw: OpenMeteoCurrent | OpenMeteoCurrent[]): CityWeather[] {
  const list = Array.isArray(raw) ? raw : [raw];
  return WEATHER_CITIES.flatMap((c, i) => {
    const cur = list[i]?.current;
    if (typeof cur?.temperature_2m !== "number" || typeof cur.weather_code !== "number") return [];
    return [{ id: c.id, name: c.name, temp: Math.round(cur.temperature_2m), label: weatherLabel(cur.weather_code), code: cur.weather_code }];
  });
}

export function getWeather() {
  return cached("weather", 30 * 60_000, async () => {
    const lat = WEATHER_CITIES.map((c) => c.lat).join(",");
    const lon = WEATHER_CITIES.map((c) => c.lon).join(",");
    const raw = await fetchJson<OpenMeteoCurrent[]>(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
    );
    const cities = parseWeather(raw);
    if (cities.length !== WEATHER_CITIES.length) throw new Error("Open-Meteo 回傳的城市數不對");
    return cities;
  });
}
