"use client";

import { useEffect, type RefObject } from "react";

// 手機選單打開時的共同行為（首頁 NavBar 抽屜、子頁面 PageMenu）：
// 焦點移到選單第一個連結；Esc 收起（焦點回選單按鈕）、點選單外面收起、捲動超過 40px 收起
export function useMenuDismiss(
  open: boolean,
  close: () => void,
  { container, button, panel }: { container: RefObject<HTMLElement | null>; button: RefObject<HTMLElement | null>; panel: RefObject<HTMLElement | null> },
) {
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const startY = window.scrollY;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) close();
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 40) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, close, container, button, panel]);
}
