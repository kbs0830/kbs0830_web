"use client";

import { useScrolledPast } from "@/lib/hooks";

export default function BackToTop() {
  const visible = useScrolledPast(() => window.innerHeight);

  return (
    <button
      id="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-8 right-6 z-40 w-10 h-10 flex items-center justify-center border border-(--border) bg-(--bg) text-(--muted) hover:border-(--accent) hover:text-(--accent) rounded-sm transition-[opacity,translate,visibility,color,border-color] duration-250 ${
        visible ? "opacity-100 translate-y-0" : "invisible opacity-0 translate-y-2"
      }`}
      aria-label="返回頂端"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
