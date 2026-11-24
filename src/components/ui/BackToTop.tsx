"use client";

import { useSyncExternalStore } from "react";

// 右下角「↑ 回頂端」：捲超過一個螢幕才出現。首頁跟所有 PageShell 子頁面都有；減少動態開著時不用平滑捲動。
// 2026-11-24 加過一顆手機的「↓ 到頁尾」（去頁尾的頁面索引），同一天頁面索引收進右上角選單後就拿掉了
// ——手機上要找其他頁面開選單就好，不必捲到底，右下角也少一顆按鈕擋內容

const subscribe = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
};

/** 已經捲過第一個螢幕了嗎 */
const readScroll = () => window.scrollY > window.innerHeight;

const behavior = (): ScrollBehavior => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

const btn =
  "fixed right-6 z-40 w-10 h-10 flex items-center justify-center border border-(--border) bg-(--bg) text-(--muted) hover:border-(--accent) hover:text-(--accent) rounded-sm transition-[opacity,translate,visibility,color,border-color] duration-250";
const shown = (on: boolean) => (on ? "opacity-100 translate-y-0" : "invisible opacity-0 translate-y-2");

export default function BackToTop() {
  const visible = useSyncExternalStore(subscribe, readScroll, () => false);

  return (
    <>
      <button
        type="button"
        id="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: behavior() })}
        className={`${btn} bottom-8 ${shown(visible)}`}
        aria-label="返回頂端"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </>
  );
}
