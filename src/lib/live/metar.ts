import "server-only";
import { cached, fetchText } from "@/lib/live/live-cache";
import { METAR_STATIONS } from "@/lib/tools/metar";

// 機場最新的 METAR 電報原文（2026-11-29）：美國 NOAA 航空氣象中心（aviationweather.gov）的公開資料，
// 伺服器 5 分鐘抓一次、記憶體快取（lib/live/live-cache.ts，抓不到給上次的）。解碼在瀏覽器／畫面端用 lib/tools/metar.ts 做，這裡只拿原文。
// 只替 METAR_STATIONS 裡的機場去問（不讓訪客用任意代碼打外部網站、也不讓快取無限長大）。
export async function getMetarRaw(icao: string) {
  if (!METAR_STATIONS.includes(icao)) return null;
  const r = await cached(
    `metar:${icao}`,
    5 * 60_000,
    async () => {
      const text = (await fetchText(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=raw`)).trim();
      // 失敗要丟例外（回 null 會被快取起來）；沒有這個機場的報告時整段是空的
      const line = text.split("\n").find((l) => new RegExp(`\\b${icao}\\b`).test(l));
      if (!line) throw new Error(`${icao} 沒有電報`);
      return line.trim();
    },
    { failRetryMs: 2 * 60_000 },
  );
  return r ? { raw: r.value, at: r.at, stale: r.stale } : null;
}
