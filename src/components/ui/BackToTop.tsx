"use client";

import { useSyncExternalStore } from "react";

// 右下角的捲動按鈕。
//   ↑ 回頂端：捲超過一個螢幕才出現（原本就有）
//   ↓ 到頁尾：2026-11-24 加（使用者：「手機每次要滑到最底下都很久」）。只在手機寬度、頁面超過 2.5 個螢幕、
//     還沒捲到最後一個半螢幕時出現；按了直接到頁尾的頁面索引。桌機有 End 鍵，不放
// 兩顆各有固定位置（↓ 在 ↑ 上面），出現／消失只淡入淡出、不會把另一顆推來推去。
// 首頁跟所有 PageShell 子頁面都有。減少動態開著時不用平滑捲動。

const subscribe = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
};

/** 回傳位元：1＝已經捲過第一個螢幕（顯示 ↑）；2＝長頁面、離底部還超過一個半螢幕（顯示 ↓）。回傳數字，snapshot 才穩定 */
function readScroll(): number {
  const H = document.documentElement.scrollHeight;
  const vh = window.innerHeight;
  const y = window.scrollY;
  return (y > vh ? 1 : 0) | (H > vh * 2.5 && y < H - vh * 2.5 ? 2 : 0);
}

const behavior = (): ScrollBehavior => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

const btn =
  "fixed right-6 z-40 w-10 h-10 flex items-center justify-center border border-(--border) bg-(--bg) text-(--muted) hover:border-(--accent) hover:text-(--accent) rounded-sm transition-[opacity,translate,visibility,color,border-color] duration-250";
const shown = (on: boolean) => (on ? "opacity-100 translate-y-0" : "invisible opacity-0 translate-y-2");

export default function BackToTop() {
  const state = useSyncExternalStore(subscribe, readScroll, () => 0);

  const toBottom = () => {
    const target = document.querySelector("footer") ?? document.body;
    target.scrollIntoView({ behavior: behavior(), block: "start" });
  };

  return (
    <>
      <button
        type="button"
        onClick={toBottom}
        className={`${btn} sm:hidden bottom-20 ${shown((state & 2) !== 0)}`}
        aria-label="捲到頁尾（頁面索引）"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        id="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: behavior() })}
        className={`${btn} bottom-8 ${shown((state & 1) !== 0)}`}
        aria-label="返回頂端"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </>
  );
}
