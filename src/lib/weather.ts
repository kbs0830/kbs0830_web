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

// ── 福岡這幾天（TODO J4「現在去福岡要穿什麼」，2026-11-24）────────────────
export interface DayForecast {
  date: string; // YYYY-MM-DD（日本日期）
  max: number;
  min: number;
  label: string;
}

type OpenMeteoDaily = { daily?: { time?: string[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; weather_code?: number[] } };

export function parseDaily(raw: OpenMeteoDaily): DayForecast[] {
  const d = raw.daily;
  return (d?.time ?? []).flatMap((date, i) => {
    const max = d?.temperature_2m_max?.[i];
    const min = d?.temperature_2m_min?.[i];
    const code = d?.weather_code?.[i];
    if (typeof max !== "number" || typeof min !== "number" || typeof code !== "number") return [];
    return [{ date, max: Math.round(max), min: Math.round(min), label: weatherLabel(code) }];
  });
}

/** 福岡今天起 4 天的最高／最低溫，3 小時抓一次 */
export function getFukuokaForecast() {
  const fk = WEATHER_CITIES.find((c) => c.id === "fk")!;
  return cached("weather:fuk-daily", 3 * 3600_000, async () => {
    const days = parseDaily(
      await fetchJson<OpenMeteoDaily>(
        `https://api.open-meteo.com/v1/forecast?latitude=${fk.lat}&longitude=${fk.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia%2FTokyo&forecast_days=4`,
      ),
    );
    if (!days.length) throw new Error("Open-Meteo 沒有福岡的每日預報");
    return days;
  });
}

/** 依氣溫給穿著建議（以台灣人的體感寫的，偏怕冷） */
export function clothingAdvice(temp: number): string {
  if (temp >= 28) return "短袖、透氣的衣服，注意防曬";
  if (temp >= 23) return "短袖或薄長袖";
  if (temp >= 18) return "長袖，帶一件薄外套";
  if (temp >= 13) return "薄外套或針織衫";
  if (temp >= 8) return "外套＋長褲，可以帶圍巾";
  if (temp >= 3) return "厚外套（大衣或羽絨）";
  return "羽絨衣＋保暖內衣、手套";
}
