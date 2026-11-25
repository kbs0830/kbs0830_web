"use client";

import { PHASE_NAMES, WEATHER_NAMES, useSky } from "@/lib/client/sky";

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
      </div>
      {sky && (
        <p
          className="enter-fade absolute z-10 left-6 top-20 sm:top-auto sm:bottom-10 sm:left-8 font-mono text-[11px] tracking-[0.2em] text-(--muted) select-none"
          title="首頁的背景跟高雄現在的天空同步：時段照日出日落、天氣每 30 分鐘更新"
        >
          <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-(--accent) mr-2 align-middle opacity-70" />
          高雄{sky.live && sky.temp !== null ? ` ${sky.temp}°` : ""}
          {sky.live ? ` · ${WEATHER_NAMES[sky.weather]}` : ""} · {PHASE_NAMES[sky.phase]}
          {sky.sakura ? " · 桜" : ""}
        </p>
      )}
    </>
  );
}
