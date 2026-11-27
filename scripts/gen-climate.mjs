// 福岡、高雄的月平均氣候（TODO V2，2026-11-27）：從 Open-Meteo 的歷史天氣 API（免費、不用金鑰，資料來自 ERA5 再分析）
// 抓 2015～2024 十年的逐日最高／最低溫、降水量，算出每個月的平均最高溫、平均最低溫、平均降雨天數（日降水 ≥ 1 mm）。
// 結果寫 src/lib/travel/climate-data.json（會進 git）；/tools/fukuoka-weather/<月份> 的數字全部來自這份，不手寫。
// 手動跑（要更新十年區間時）：node scripts/gen-climate.mjs
// 注意：ERA5 是約 25 公里格點的再分析，跟氣象站實測會差一兩度（尤其是沿海、都市）。頁面上要寫「Open-Meteo 歷史資料、近 10 年平均」，不寫成氣象局的官方統計。
import fs from "node:fs";
import path from "node:path";

const YEARS = [2015, 2024];
const PLACES = {
  fukuoka: { lat: 33.59, lon: 130.4, name: "福岡" },
  kaohsiung: { lat: 22.63, lon: 120.3, name: "高雄" },
};

async function fetchDaily({ lat, lon }) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${YEARS[0]}-01-01&end_date=${YEARS[1]}-12-31` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FTokyo`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return (await res.json()).daily;
}

const round1 = (n) => Math.round(n * 10) / 10;

function monthly(d) {
  const acc = Array.from({ length: 12 }, () => ({ hi: 0, lo: 0, n: 0, rainy: 0 }));
  d.time.forEach((day, i) => {
    const hi = d.temperature_2m_max[i];
    const lo = d.temperature_2m_min[i];
    if (hi == null || lo == null) return;
    const m = Number(day.slice(5, 7)) - 1;
    acc[m].hi += hi;
    acc[m].lo += lo;
    acc[m].n++;
    if ((d.precipitation_sum[i] ?? 0) >= 1) acc[m].rainy++;
  });
  const years = YEARS[1] - YEARS[0] + 1;
  return acc.map((a) => ({ high: round1(a.hi / a.n), low: round1(a.lo / a.n), rainyDays: round1(a.rainy / years) }));
}

const out = { source: "Open-Meteo Historical Weather API（ERA5 再分析）", years: YEARS, generatedAt: new Date().toISOString().slice(0, 10) };
for (const [key, place] of Object.entries(PLACES)) out[key] = monthly(await fetchDaily(place));
const file = path.join(import.meta.dirname, "..", "src", "lib", "travel", "climate-data.json");
fs.writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
console.log("寫入", file);
for (let m = 0; m < 12; m++) console.log(`${m + 1} 月 福岡 ${out.fukuoka[m].low}～${out.fukuoka[m].high}°C 雨 ${out.fukuoka[m].rainyDays} 天｜高雄 ${out.kaohsiung[m].low}～${out.kaohsiung[m].high}°C`);
