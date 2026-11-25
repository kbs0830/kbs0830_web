"use client";

import { useJson } from "@/lib/hooks";

// 空氣品質作品頁的「高雄現在」（TODO D5，2026-11-22）：/api/air-quality，用環境部 114 年版公式從六項污染物算出的即時 AQI。
// 資料是 Open-Meteo（歐洲 CAMS 模型推估），不是測站實測——下面的說明照實寫。讀不到整塊不顯示。

type Pollutant = { key: string; name: string; value: number; unit: string; basis: string; index: number | null };
type Data = { place: string; time: string; aqi: number | null; status: string; main: string | null; pollutants: Pollutant[] };

export default function AirQualityLive() {
  const raw = useJson<Data>("/api/air-quality");
  const data = raw && raw !== "error" && raw.aqi == null ? "error" : raw;

  if (data === "error") return null;
  const max = data ? Math.max(100, ...data.pollutants.map((p) => p.index ?? 0)) : 100;

  return (
    <section className="mt-12 min-h-[360px]" aria-busy={data === null}>
      <p className="text-xs tracking-[0.2em] text-(--accent) uppercase font-mono mb-4">
        高雄現在 <span className="text-(--muted) normal-case tracking-normal">· Kaohsiung now</span>
      </p>

      {data === null ? (
        <p className="text-sm text-(--muted) font-light">讀取中…</p>
      ) : (
        <>
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-5xl font-extralight font-mono text-(--text)">{data.aqi}</span>
            <span className="text-lg font-light text-(--accent) font-serif">{data.status}</span>
            <span className="text-xs text-(--muted) font-mono">
              AQI{data.main && ` · 指標污染物 ${data.main}`} · {data.time.slice(5, 10).replace("-", "/")} {data.time.slice(11, 16)}
            </span>
          </div>

          <ul className="mt-6 border-y border-(--border) divide-y divide-(--border)">
            {data.pollutants.map((p) => (
              <li key={p.key} className="grid grid-cols-[4rem_1fr_3rem] sm:grid-cols-[4rem_10rem_1fr_3rem] items-center gap-3 py-2">
                <span className="text-sm font-light text-(--text) font-mono">{p.name}</span>
                <span className="hidden sm:block text-xs text-(--muted) font-mono">
                  {p.value} {p.unit}
                  <span className="block text-[11px]">{p.basis}</span>
                </span>
                <span className="h-1.5 bg-(--surface) rounded-full overflow-hidden" aria-hidden>
                  <span className="block h-full bg-(--accent) rounded-full" style={{ width: `${((p.index ?? 0) / max) * 100}%` }} />
                </span>
                <span className="text-xs text-(--muted) font-mono text-right">{p.index ?? "–"}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-xs text-(--muted) font-light mt-6 leading-relaxed">
        作品是用機器學習從這六項污染物「預測」等級；這裡用環境部的公式（114 年版即時 AQI）直接算——作品裡決策樹能 17 筆全對，正是因為等級本來就是這樣切門檻算出來的。
        資料是 Open-Meteo 的空品模型推估（歐洲 CAMS），不是環境部測站實測，數字會跟環境部的 App 不一樣；30 分鐘更新一次。
      </p>
    </section>
  );
}
