"use client";

import { useEffect, useState } from "react";
import { nf } from "@/lib/format";

// /radar 頁首：大數字「現在幾架」＋ 裝飾用的雷達圓盤（每 30 秒跟 /api/radar 更新；伺服器先給第一份數字，不會閃）。
// 圓盤只是裝飾：同心圓＋慢慢轉的掃描線＋殘影（TODO L3，2026-11-26）。
// 光點的「數量」＝現在收到的架數（上限 24），掃描線掃過去的瞬間亮起再慢慢淡掉；**位置不是真的**——沒有座標（隱私，見 scripts/lib/radar.js），
// 點是照黃金角平均撒在圓盤上的（blipPositions），所以每次看到的排列都一樣，也不會被誤認成飛機的方位。
// 掃描線跟光點都是 CSS 動畫（globals.css .radar-sweep／.radar-blip，同一個 8 秒週期），reduced-motion 不轉、光點固定半亮；雷達離線時都不畫。

interface Live {
  online: boolean;
  aircraftNow: number;
  /** 最後一次收到飛機的時間（ms），0 架時顯示「上一架 HH:MM 經過」 */
  lastAircraftAt?: number | null;
}

// 固定台灣時區：server、client 算出來一樣，不會 hydration 不一致
const hhmm = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });


const MAX_BLIPS = 24;
const SWEEP_SECONDS = 8; // 要跟 globals.css 的 radar-sweep 週期一樣

/** 照黃金角平均撒點：角度（從 12 點鐘順時針）、半徑 18～86。跟實際飛機位置無關 */
export function blipPositions(count: number, C = 100) {
  return Array.from({ length: Math.min(Math.max(0, count), MAX_BLIPS) }, (_, i) => {
    const deg = (i * 137.508) % 360;
    const r = 18 + ((i * 53) % 69);
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad), delay: -(SWEEP_SECONDS - (deg / 360) * SWEEP_SECONDS) };
  });
}

function RadarScope({ active, count }: { active: boolean; count: number }) {
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
      {active &&
        blipPositions(count, C).map((b, i) => (
          <circle key={i} className="radar-blip" cx={b.x} cy={b.y} r={2.4} style={{ fill: "var(--accent)", animationDelay: `${b.delay}s` }} />
        ))}
      <circle cx={C} cy={C} r={3} style={{ fill: active ? "var(--accent)" : "var(--border)" }} />
    </svg>
  );
}

export default function RadarLive({ initial }: { initial: Live }) {
  const [live, setLive] = useState<Live>(initial);
  const empty = live.online && live.aircraftNow === 0;

  useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/radar", { signal: ac.signal });
        const d = (await res.json()) as Partial<Live> & { configured?: boolean };
        if (d.configured) setLive({ online: Boolean(d.online), aircraftNow: d.aircraftNow ?? 0, lastAircraftAt: d.lastAircraftAt ?? null });
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
        {/* 0 架（2026-11-26，TODO M11）：深夜常常 0 架，一個超大的黑色「0」加空圓盤很像壞掉——
            數字改淡色，旁邊說明上一架幾點經過；「收訊中」燈號照舊，看得出接收器是正常的 */}
        <p className={`font-mono font-light leading-none ${empty ? "text-(--muted)" : "text-(--text)"}`} aria-live="polite">
          <span className="text-7xl sm:text-8xl">{live.online ? nf.format(live.aircraftNow) : "–"}</span>
          <span className="text-base text-(--muted) ml-2">架</span>
        </p>
        {empty ? (
          <p className="text-sm font-light text-(--text) mt-4">
            目前上空沒有飛機
            {live.lastAircraftAt ? <span className="text-(--muted)"> · 上一架 {hhmm.format(live.lastAircraftAt)} 經過</span> : null}
            <span className="block text-xs text-(--muted) mt-1">深夜跟清晨航班比較少，白天再來看看。</span>
          </p>
        ) : null}
        <p className="text-xs text-(--muted) font-mono mt-4">現在收到的飛機 · Aircraft in range now</p>
        <p className="text-[11px] text-(--muted) font-mono mt-1">每 30 秒更新 · Updates every 30 s</p>
      </div>
      <RadarScope active={live.online} count={live.aircraftNow} />
    </div>
  );
}
