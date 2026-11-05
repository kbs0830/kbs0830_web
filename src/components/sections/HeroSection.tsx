// Server Component：文字在 server 產生，進場淡入是純 CSS（globals.css .enter-up），
// HTML 一到就開始播、不必等 hydration。需要瀏覽器的只有 3D 背景、打字效果、磁吸按鈕。
import type { CSSProperties } from "react";
import Magnetic from "@/components/ui/Magnetic";
import Underline, { underlineLinkClass } from "@/components/ui/Underline";
import HeroBackground from "@/components/sections/HeroBackground";
import Typewriter from "@/components/sections/Typewriter";

const enter = (delay: number) => ({ "--enter-delay": `${delay}s` }) as CSSProperties;

const SUBTITLE_TEXT = "学生開発者  ·  Claude × Gemini";

export default function HeroSection() {
  return (
    <section id="top" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <p className="enter-up text-xs tracking-[0.2em] sm:tracking-[0.35em] text-(--muted) mb-6 uppercase font-mono" style={enter(0.1)}>
          高雄・福岡 &nbsp;/&nbsp; Kaohsiung · Fukuoka
        </p>

        <h1
          className="enter-up text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-[0.04em] text-(--text) mb-4"
          style={enter(0.25)}
        >
          PINGWEI LI
        </h1>

        <p
          className="enter-up text-sm sm:text-base font-light text-(--accent) tracking-[0.12em] sm:tracking-[0.25em] mb-8 min-h-[1.5em] font-mono"
          style={enter(0.35)}
          aria-label={SUBTITLE_TEXT}
        >
          <Typewriter text={SUBTITLE_TEXT} startDelay={950} />
        </p>

        <p className="enter-up text-lg sm:text-xl font-light text-(--muted) max-w-lg leading-relaxed mb-3" style={enter(0.45)}>
          在瀏覽器與模型層之間，構建有意義的系統。
        </p>

        <p className="enter-up text-base font-light text-(--muted) max-w-lg leading-relaxed mb-12 opacity-70" style={enter(0.5)}>
          Building thoughtful systems — from the browser to the model layer.
        </p>

        <div className="enter-up flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center" style={enter(0.6)}>
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
