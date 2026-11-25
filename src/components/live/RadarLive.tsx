"use client";

import { useEffect, useState } from "react";
import { nf } from "@/lib/format";

// /radar 頁首：大數字「現在幾架」＋ 裝飾用的雷達圓盤（每 30 秒跟 /api/radar 更新；伺服器先給第一份數字，不會閃）。
// 圓盤只是裝飾：同心圓＋慢慢轉的掃描線，**不畫光點**——沒有座標（隱私，見 scripts/lib/radar.js），也不放假的位置。
// 掃描線是 CSS 動畫（globals.css .radar-sweep），reduced-motion 不轉；雷達離線時不畫掃描線。

interface Live {
  online: boolean;
  aircraftNow: number;
}


function RadarScope({ active }: { active: boolean }) {
  const C = 100;
  // 掃描線後面拖一段漸淡的扇形：每 6° 一片，越後面越淡
  const wedges = Array.from({ length: 10 }, (_, i) => {
    const a0 = (-90 - i * 6) * (Math.PI / 180);
    const a1 = (-90 - (i + 1) * 6) * (Math.PI / 180);
    const r = 92;
    return {
      d: `M${C},${C} L${C + r * Math.cos(a0)},${C + r * Math.sin(a0)} A${r},${r} 0 0,0 ${C + r * Math.cos(a1)},${C + r * Math.sin(a1)} Z`,
      o: 0.22 * (1 - i / 10),
    };
  });
  return (
    <svg viewBox="0 0 200 200" className="w-40 sm:w-48 h-auto mx-auto" aria-hidden>
      {[30, 60, 92].map((r) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" style={{ stroke: "var(--border)" }} strokeWidth={1} />
      ))}
      <line x1={C} y1={8} x2={C} y2={192} style={{ stroke: "var(--border)" }} strokeWidth={1} />
      <line x1={8} y1={C} x2={192} y2={C} style={{ stroke: "var(--border)" }} strokeWidth={1} />
      {active && (
        <g className="radar-sweep">
          {wedges.map((w, i) => (
            <path key={i} d={w.d} style={{ fill: "var(--accent)" }} opacity={w.o} />
          ))}
          <line x1={C} y1={C} x2={C} y2={C - 92} style={{ stroke: "var(--accent)" }} strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}
      <circle cx={C} cy={C} r={3} style={{ fill: active ? "var(--accent)" : "var(--border)" }} />
    </svg>
  );
}

export default function RadarLive({ initial }: { initial: Live }) {
  const [live, setLive] = useState<Live>(initial);

  useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/radar", { signal: ac.signal });
        const d = (await res.json()) as Partial<Live> & { configured?: boolean };
        if (d.configured) setLive({ online: Boolean(d.online), aircraftNow: d.aircraftNow ?? 0 });
      } catch {
        // abort 或網路錯誤：維持原本顯示
      }
    };
    const id = setInterval(load, 30_000);
    document.addEventListener("visibilitychange", load, { signal: ac.signal });
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, []);

  return (
    <div className="grid sm:grid-cols-[1fr_auto] items-center gap-8 mb-12">
      <div>
        <p className="flex items-center gap-2 text-xs font-mono text-(--muted) mb-4">
          <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full ${live.online ? "bg-(--accent)" : "bg-(--border)"}`} />
          {live.online ? "收訊中 · Live" : "暫時離線 · Offline"}
        </p>
        <p className="font-mono font-light text-(--text) leading-none" aria-live="polite">
          <span className="text-7xl sm:text-8xl">{live.online ? nf.format(live.aircraftNow) : "–"}</span>
          <span className="text-base text-(--muted) ml-2">架</span>
        </p>
        <p className="text-xs text-(--muted) font-mono mt-4">現在收到的飛機 · Aircraft in range now</p>
        <p className="text-[11px] text-(--muted) font-mono mt-1">每 30 秒更新 · Updates every 30 s</p>
      </div>
      <RadarScope active={live.online} />
    </div>
  );
}
