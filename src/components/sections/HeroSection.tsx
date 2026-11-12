// Server Component：文字在 server 產生，進場淡入是純 CSS（globals.css .enter-up），
// HTML 一到就開始播、不必等 hydration。需要瀏覽器的只有 3D 背景、打字效果、磁吸按鈕。
import type { CSSProperties } from "react";
import Magnetic from "@/components/ui/Magnetic";
import Underline, { underlineLinkClass } from "@/components/ui/Underline";
import HeroBackground from "@/components/sections/HeroBackground";
import Typewriter from "@/components/sections/Typewriter";
import HeroNameScramble from "@/components/sections/HeroNameScramble";

const enter = (delay: number) => ({ "--enter-delay": `${delay}s` }) as CSSProperties;

const SUBTITLE_TEXT = "学生開発者  ·  Claude × Gemini";

export default function HeroSection() {
  return (
    <section id="top" className="relative min-h-svh flex flex-col justify-center overflow-hidden">
      <HeroBackground />
      <HeroNameScramble />

      {/* hero-parallax：往下捲時文字往上飄、慢慢淡出（globals.css，CSS scroll-driven，只有桌機） */}
      <div className="hero-parallax relative z-10 max-w-5xl mx-auto px-6 py-32">
        <p className="enter-up text-xs tracking-[0.2em] sm:tracking-[0.35em] text-(--muted) mb-6 uppercase font-mono" style={enter(0.1)}>
          高雄・福岡 &nbsp;/&nbsp; Kaohsiung · Fukuoka
        </p>

        {/* data-scramble="hover"：桌機滑鼠移上去時解碼一次（HeroNameScramble）。不在載入時播——這是 LCP 元素 */}
        <h1
          data-scramble="hover"
          className="enter-up text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-[0.04em] text-(--text) mb-4"
          style={enter(0.25)}
        >
          PINGWEI LI
        </h1>

        <p
          className="enter-up text-sm sm:text-base font-light text-(--accent) tracking-[0.12em] sm:tracking-[0.25em] mb-8 min-h-[1.5em] font-mono"
          style={enter(0.35)}
        >
          {/* 螢幕閱讀器讀完整文字、不逐字念。<p> 不能放 aria-label（axe：aria-prohibited-attr），改用隱藏文字 */}
          <span className="sr-only">{SUBTITLE_TEXT}</span>
          <span aria-hidden>
            <Typewriter text={SUBTITLE_TEXT} startDelay={950} />
          </span>
        </p>

        <p className="enter-up text-lg sm:text-xl font-light text-(--muted) max-w-lg leading-relaxed mb-3" style={enter(0.45)}>
          在瀏覽器與模型層之間，構建有意義的系統。
        </p>

        <p className="enter-up text-base font-light text-(--muted) max-w-lg leading-relaxed mb-12" style={enter(0.5)}>
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
        aria-hidden
      >
        <span className="text-[10px] tracking-[0.4em] uppercase font-mono opacity-60">Scroll</span>
        {/* 一顆小光點沿著細線往下滑（globals.css .scroll-cue） */}
        <div className="relative w-[1px] h-12 bg-(--border) overflow-hidden">
          <span className="scroll-cue absolute left-0 top-0 w-[1px] h-4 bg-(--accent)" />
        </div>
      </div>
    </section>
  );
}
