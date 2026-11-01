"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties } from "react";
import SceneErrorBoundary from "@/components/canvas/SceneErrorBoundary";
import Magnetic from "@/components/ui/Magnetic";
import Underline, { underlineLinkClass } from "@/components/ui/Underline";
import { useMediaQuery } from "@/lib/hooks";

const HeroScene = dynamic(() => import("@/components/canvas/HeroScene"), {
  ssr: false,
  loading: () => <HeroSceneSkeleton />,
});

const SceneFallback = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-(--bg) via-(--surface) to-(--bg)" />
);

// 稀疏細線骨架屏，呼應真正場景的視覺語言，避免載入期間是一片空白。
const HeroSceneSkeleton = () => (
  <div className="absolute inset-0 bg-(--bg) overflow-hidden">
    {Array.from({ length: 7 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-px bg-(--accent)"
        style={{
          width: `${18 + ((i * 11) % 34)}%`,
          left: `${(i * 19) % 70}%`,
          top: `${8 + ((i * 13) % 78)}%`,
          opacity: 0.12 + (i % 3) * 0.04,
          transform: `rotate(${(i * 41) % 180}deg)`,
          animation: `breathe ${2.6 + i * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

// 進場淡入改成純 CSS（globals.css .enter-up），HTML 一到就開始播、不必等 hydration
const enter = (delay: number) => ({ "--enter-delay": `${delay}s` }) as CSSProperties;

const SUBTITLE_TEXT = "学生開発者  ·  Claude × Gemini";

function useTypewriter(text: string, startDelay = 0, speed = 42) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // prefers-reduced-motion：不打字，下一個 tick 直接顯示全文
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setCount(text.length));
      return () => clearTimeout(t);
    }
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setCount(i);
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, startDelay, speed]);

  return text.slice(0, count);
}

export default function HeroSection() {
  // server 端還不知道是不是手機 → 先畫骨架屏；確定是桌機才載入 3D 場景。
  // 原本 isMobile 初始值是 false，手機也會在第一次 render 時觸發 three.js chunk 下載。
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const typedSubtitle = useTypewriter(SUBTITLE_TEXT, 950);
  const subtitleDone = typedSubtitle.length === SUBTITLE_TEXT.length;

  return (
    <section id="top" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {isDesktop === null ? (
        <HeroSceneSkeleton />
      ) : isDesktop ? (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <HeroScene />
        </SceneErrorBoundary>
      ) : (
        <SceneFallback />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <p
          className="enter-up text-xs tracking-[0.35em] text-(--muted) mb-6 uppercase"
          style={{ ...enter(0.1), fontFamily: "var(--font-mono)" }}
        >
          高雄・福岡 &nbsp;/&nbsp; Kaohsiung · Fukuoka
        </p>

        <h1
          className="enter-up text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-[0.04em] text-(--text) mb-4"
          style={enter(0.25)}
        >
          PINGWEI LI
        </h1>

        <p
          className="enter-up text-base font-light text-(--accent) tracking-[0.25em] mb-8 min-h-[1.5em]"
          style={{ ...enter(0.35), fontFamily: "var(--font-mono)" }}
          aria-label={SUBTITLE_TEXT}
        >
          <span aria-hidden>{typedSubtitle}</span>
          <span
            aria-hidden
            className={`inline-block w-[2px] h-[0.9em] bg-(--accent) ml-0.5 align-middle ${
              subtitleDone ? "opacity-0" : "animate-pulse"
            }`}
          />
        </p>

        <p
          className="enter-up text-lg sm:text-xl font-light text-(--muted) max-w-lg leading-relaxed mb-3"
          style={enter(0.45)}
        >
          在瀏覽器與模型層之間，構建有意義的系統。
        </p>

        <p
          className="enter-up text-base font-light text-(--muted) max-w-lg leading-relaxed mb-12 opacity-70"
          style={enter(0.5)}
        >
          Building thoughtful systems — from the browser to the model layer.
        </p>

        <div
          className="enter-up flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center"
          style={enter(0.6)}
        >
          <Magnetic>
            <a href="#portfolio" className={`${underlineLinkClass} text-(--text)`}>
              查看作品 · View Work
              <Underline />
            </a>
          </Magnetic>
          <Magnetic>
            <a href="#contact" className={`${underlineLinkClass} text-(--muted) hover:text-(--text)`}>
              聯絡我 · Contact
              <Underline />
            </a>
          </Magnetic>
        </div>
      </div>

      <div
        className="enter-fade absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-(--muted)"
        style={enter(1.2)}
      >
        <div className="w-[1px] h-12 bg-(--border) animate-pulse" />
      </div>
    </section>
  );
}
