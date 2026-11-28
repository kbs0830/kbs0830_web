"use client";

import { useEffect, useRef, type ReactNode } from "react";

// 橫向捲動的容器，載入時先捲到最右邊（TODO P4，2026-11-28）：GitHub 熱力圖手機放不下，
// 預設要看到「最近」的月份而不是一年前。左右淡出提示沿用 .filter-scroll（globals.css，只在 <640px 生效）。
export default function ScrollEnd({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // 放在分頁面板裡時，載入當下是隱藏的（寬度 0），圖片也還在載入：每次尺寸變動都捲到最右，
  // 直到使用者自己碰過（滑、點）就不再動它
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let touched = false;
    const stop = () => (touched = true);
    const ro = new ResizeObserver(() => {
      if (touched || el.clientWidth === 0) return;
      el.scrollLeft = 1e6; // 超過最大值會自動停在最右邊
      setTimeout(() => !touched && (el.scrollLeft = 1e6), 400); // 版面算完後的最大值有時會再多一點（實測差 16px＝padding）
    });
    ro.observe(el);
    for (const c of Array.from(el.children)) ro.observe(c);
    el.addEventListener("pointerdown", stop, { once: true });
    el.addEventListener("wheel", stop, { once: true, passive: true });
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={`filter-scroll ${className}`}>
      {children}
    </div>
  );
}
