"use client";

import { useState } from "react";
import { decodeMetar, METAR_EXAMPLE, METAR_STATIONS, stationName, type FlightCategory } from "@/lib/tools/metar";

// METAR 翻譯機（2026-11-29，使用者：「做一個 METAR 翻譯機，放在小工具，本地分析」）。解碼在 lib/tools/metar.ts，
// 這支只有畫面。貼上的電報**只在你的瀏覽器裡解碼**，不會送出去；只有按「載入」才會跟本站要一份原文（再在本機解碼）。
// 顏色只用站上既有的：警示（--warn）＝天氣差的分類、強調色＝VFR。

const CAT_TONE: Record<FlightCategory, string> = {
  VFR: "text-(--accent) border-(--accent)",
  MVFR: "text-(--text) border-(--border)",
  IFR: "text-(--warn) border-(--warn)/60",
  LIFR: "text-(--warn) border-(--warn)",
};

export default function MetarDecoder() {
  const [src, setSrc] = useState(METAR_EXAMPLE);
  const [icao, setIcao] = useState("RCKH");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const r = decodeMetar(src);

  async function load() {
    setLoading(true);
    setNote("");
    try {
      const res = await fetch(`/api/metar?icao=${icao}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const d: { raw: string; at: number } = await res.json();
      setSrc(d.raw);
      setNote(`已載入 ${icao} 最新電報（${new Date(d.at).toLocaleTimeString("zh-TW", { hour12: false })} 抓到）`);
    } catch {
      setNote("抓不到最新電報，晚點再試，或直接貼上電報");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[520px]">
      <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
        貼上 METAR 電報（可以連「METAR」「=」一起貼）
        <textarea
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          rows={3}
          spellCheck={false}
          className="w-full rounded-sm border border-(--border) bg-(--bg) px-3 py-2 text-[13px] text-(--text) font-mono leading-relaxed focus:border-(--accent) outline-none"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-light">
        <label className="flex items-center gap-2 text-(--muted)">
          載入最新：
          <select value={icao} onChange={(e) => setIcao(e.target.value)} className="rounded-sm border border-(--border) bg-(--bg) px-2 py-1 text-(--text) font-mono text-[13px]">
            {METAR_STATIONS.map((c) => (
              <option key={c} value={c}>
                {c} {stationName(c)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={load} disabled={loading} className="rounded-sm border border-(--border) px-3 py-1 hover:border-(--accent) hover:text-(--accent) transition-colors disabled:opacity-50">
          {loading ? "載入中…" : "載入"}
        </button>
        <span className="text-(--muted) text-xs" aria-live="polite">{note}</span>
      </div>

      <div className="mt-8" aria-live="polite">
        {r.empty ? (
          <p className="text-sm font-light text-(--text)">貼上一份 METAR 看看。</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">白話摘要 · Summary</h2>
              {r.category && <span className={`rounded-sm border px-2 py-0.5 text-xs font-mono ${CAT_TONE[r.category]}`}>{r.category}</span>}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm font-light text-(--text) leading-relaxed">
              {r.summary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            <h2 className="mt-10 mb-3 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">逐欄對照 · Token by token</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-light border-collapse">
                <thead>
                  <tr className="text-left text-[11px] text-(--muted) font-mono tracking-wide">
                    <th className="py-1.5 pr-4 font-normal">原文</th>
                    <th className="py-1.5 pr-4 font-normal">欄位</th>
                    <th className="py-1.5 font-normal">白話</th>
                  </tr>
                </thead>
                <tbody>
                  {r.tokens.map((t, i) => (
                    <tr key={i} className="border-t border-(--border) align-top">
                      <td className="py-1.5 pr-4 font-mono whitespace-nowrap">{t.raw}</td>
                      <td className="py-1.5 pr-4 text-(--muted) whitespace-nowrap">{t.field}</td>
                      <td className={`py-1.5 ${t.field === "不認得" ? "text-(--warn)" : ""}`}>{t.zh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.unknown.length > 0 && <p className="mt-3 text-xs text-(--muted)">有 {r.unknown.length} 個欄位看不懂（{r.unknown.join("、")}），可能是該國自己的寫法，原樣保留。</p>}
          </>
        )}
      </div>
    </div>
  );
}
