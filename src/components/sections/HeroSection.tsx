// Server Component：文字在 server 產生，進場淡入是純 CSS（globals.css .enter-up），
// HTML 一到就開始播、不必等 hydration。需要瀏覽器的只有 3D 背景、打字效果、磁吸按鈕。
import type { CSSProperties } from "react";
import Magnetic from "@/components/ui/Magnetic";
import Underline, { underlineLinkClass } from "@/components/ui/Underline";
import HeroBackground from "@/components/sections/HeroBackground";
import HeroSky from "@/components/sections/HeroSky";
import Typewriter from "@/components/sections/Typewriter";
import HeroNameScramble from "@/components/sections/HeroNameScramble";
import HeroTwoCities from "@/components/sections/HeroTwoCities";

const enter = (delay: number) => ({ "--enter-delay": `${delay}s` }) as CSSProperties;

const SUBTITLE_TEXT = "学生開発者  ·  Claude × Gemini";

// 2026-11-24 手機版封面（使用者：「封面專門為手機版改良，畢竟第一印象」）——640px 以下才套用，桌機不動：
//   - 名字一行、字級跟著螢幕寬度（14vw，最大 4rem）：剛好撐滿版面寬度又不換行
//     （同一天先做過「PINGWEI / LI」兩行，使用者不喜歡斷行）
//   - 片假名讀音「リー ビンウェイ」（使用者要的；不是漢字本名，不違反「頁面不顯示中文本名」）：
//     2026-11-25 改成直書，貼在右側邊緣（像日本海報、書背），使用者選的創意 1
//   - 按鈕上方一行「高雄 ⇄ 福岡」兩地即時時刻（HeroTwoCities，創意 2）
//   ⚠️ 使用者：「桌機版不用改，只要手機版特調」——這裡的改動全部只在 640px 以下，sm: 以上維持原樣
//   - 文字區塊在導覽列跟按鈕之間垂直置中；按鈕移到螢幕下方（拇指好按），兩顆並排的實心按鈕
//   - 手機不放「SCROLL」提示：底部的按鈕就是下一步
export default function HeroSection() {
  return (
    <section id="top" className="relative min-h-svh flex flex-col justify-center overflow-hidden">
      <HeroSky />
      <HeroBackground />
      <HeroNameScramble />

      {/* hero-parallax：往下捲時文字往上飄、慢慢淡出（globals.css，CSS scroll-driven，只有桌機） */}
      <div className="hero-parallax relative z-10 w-full max-w-5xl mx-auto px-6 flex-1 flex flex-col pt-24 pb-8 sm:flex-none sm:block sm:py-32">
        <div className="relative flex-1 flex flex-col justify-center sm:block">
        {/* 手機：直書片假名，貼在右側邊緣、跟文字區塊垂直置中（名字最寬到 14vw×約 5.7 ≈ 80% 螢幕寬，不會疊到） */}
        <span
          lang="ja"
          className="enter-fade sm:hidden absolute -right-2 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] text-xs tracking-[0.6em] text-(--muted) font-serif"
          style={enter(0.9)}
        >
          リー ビンウェイ
        </span>
        <p className="enter-up text-xs tracking-[0.2em] sm:tracking-[0.35em] text-(--muted) mb-6 uppercase font-mono" style={enter(0.1)}>
          高雄・福岡 &nbsp;/&nbsp; Kaohsiung · Fukuoka
        </p>

        {/* data-scramble="hover"：桌機滑鼠移上去時解碼一次（HeroNameScramble）。不在載入時播——這是 LCP 元素 */}
        <h1
          data-scramble="hover"
          className="enter-up whitespace-nowrap text-[min(14vw,4rem)] leading-[1.05] sm:text-6xl sm:leading-[1.1] lg:text-7xl font-light tracking-[0.04em] text-(--text) mb-5 sm:mb-4"
          style={enter(0.25)}
        >
          PINGWEI LI
        </h1>


        <p
          className="enter-up text-sm sm:text-base font-light text-(--accent) tracking-[0.12em] sm:tracking-[0.25em] mb-6 sm:mb-8 min-h-[1.5em] font-mono"
          style={enter(0.35)}
        >
          {/* 螢幕閱讀器讀完整文字、不逐字念。<p> 不能放 aria-label（axe：aria-prohibited-attr），改用隱藏文字 */}
          <span className="sr-only">{SUBTITLE_TEXT}</span>
          <span aria-hidden>
            <Typewriter text={SUBTITLE_TEXT} startDelay={950} />
          </span>
        </p>

        {/* 手機：一條短的強調色細線隔開名字跟標語（日式的「間」） */}
        <span aria-hidden className="enter-up sm:hidden block w-8 h-px bg-(--accent) mb-6" style={enter(0.4)} />

        <p className="enter-up text-lg sm:text-xl font-light text-(--text) sm:text-(--muted) max-w-lg leading-relaxed text-balance mb-2 sm:mb-3" style={enter(0.45)}>
          在瀏覽器與模型層之間，構建有意義的系統。
        </p>

        <p className="enter-up text-sm sm:text-base font-light text-(--muted) max-w-lg leading-relaxed text-balance sm:mb-12" style={enter(0.5)}>
          Building thoughtful systems — from the browser to the model layer.
        </p>
        </div>

        {/* 手機：螢幕下方兩顆並排的按鈕（拇指範圍、高 48px） */}
        <div className="enter-up sm:hidden mt-10" style={enter(0.6)}>
          <HeroTwoCities />
          <div className="grid grid-cols-2 gap-3 mt-4">
          <a href="#portfolio" className="flex items-center justify-center h-12 rounded-sm bg-(--accent) text-(--bg) text-[15px] font-light tracking-wide">
            查看作品
          </a>
          <a href="#contact" className="flex items-center justify-center h-12 rounded-sm border border-(--border) bg-(--bg) text-(--text) text-[15px] font-light tracking-wide">
            聯絡我
          </a>
          </div>
        </div>

        <div className="enter-up hidden sm:flex flex-row gap-10 items-center" style={enter(0.6)}>
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
        className="enter-fade absolute bottom-10 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 text-(--muted)"
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
