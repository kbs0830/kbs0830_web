"use client";

import { PHASE_NAMES, SYNODIC_DAYS, WEATHER_NAMES, moonNow, useSky } from "@/lib/client/sky";

/**
 * 桌機夜晚的月亮（2026-11-26，使用者：「我電腦版月亮不見了」——原本只有手機的 HeroSceneLite 畫月亮）。
 * 靜態 SVG，照實際月相畫亮面；手機版（< 768px）由 HeroSceneLite 自己畫，這裡用 CSS 藏起來。
 * 亮面＝右半圓＋明暗交界的半橢圓（k>0 眉月往右凸、k<0 凸月往左凸），虧月左右翻轉。
 */
function MoonSvg() {
  const { age, waxing } = moonNow();
  const k = Math.cos((age / SYNODIC_DAYS) * Math.PI * 2);
  const r = 20;
  const lit = `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${(r * Math.abs(k)).toFixed(2)} ${r} 0 0 ${k > 0 ? 0 : 1} 0 ${-r}Z`;
  return (
    <svg viewBox="-60 -60 120 120" className="hero-moon">
      <defs>
        <radialGradient id="hero-moon-glow">
          <stop offset="30%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={waxing ? undefined : "scale(-1 1)"}>
        <circle r="60" fill="url(#hero-moon-glow)" className="hero-moon-glow" style={{ opacity: `calc(var(--moon-glow) * ${((1 - k) / 2 * 0.8 + 0.2).toFixed(2)})` }} />
        <circle r={r} fill="currentColor" className="hero-moon-dark" />
        <path d={lit} fill="currentColor" className="hero-moon-lit" />
      </g>
    </svg>
  );
}

// 首頁背景的天空色層＋左下角一行「高雄 22° 雨 · 黃昏」（2026-11-25，lib/client/sky.ts）。
// 四個時段各一層漸層，只有現在的那層 opacity 1，換時段時 4 秒交叉淡入；多雲／雨／霧加雲層或霧氣。
// 顏色、動畫全在 globals.css 的 .hero-sky*。粒子的雨、櫻花在 HeroScene／HeroSceneLite 裡。
export default function HeroSky() {
  const sky = useSky();
  const phases = ["dawn", "day", "dusk", "night"] as const;
  return (
    <>
      <div aria-hidden className="hero-sky" data-weather={sky?.weather ?? "clear"}>
        {phases.map((p) => (
          <div key={p} className={`hero-sky-layer hero-sky-${p}`} data-on={sky?.phase === p ? "" : undefined} />
        ))}
        <div className="hero-sky-clouds">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-sky-haze" />
        {sky?.phase === "night" && <MoonSvg />}
      </div>
      {sky && (
        <p
          className="enter-fade absolute z-10 left-6 top-20 sm:top-auto sm:bottom-10 sm:left-8 font-mono text-[11px] tracking-[0.2em] text-(--muted) select-none"
          title="首頁的背景跟高雄現在的天空同步：時段照日出日落、天氣每 30 分鐘更新"
        >
          <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-(--accent) mr-2 align-middle opacity-70" />
          高雄{sky.live && sky.temp !== null ? ` ${sky.temp}°` : ""}
          {sky.live ? ` · ${WEATHER_NAMES[sky.weather]}` : ""} · {PHASE_NAMES[sky.phase]}
          {sky.phase === "night" && sky.moon ? ` · ${sky.moon}` : ""}
          {sky.sakura ? " · 桜" : ""}
        </p>
      )}
    </>
  );
}
