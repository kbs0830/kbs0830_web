"use client";
import type { ReactNode } from "react";
import { useScrolledPast } from "@/lib/client/hooks";

// 子頁面的頁首（TODO F2，2026-11-26）：跟首頁 NavBar 一樣固定在上方，捲動後才出現半透明底＋細線。
// sticky 放在滿版的外層（-mx-6 px-6 抵銷 PageShell 的左右留白），裡面再用跟內文一樣的寬度。
// sticky＝false（站長後台，自己有黏頂的分頁列）時不固定。
export default function PageTopBar({ children, width, sticky = true }: { children: ReactNode; width: string; sticky?: boolean }) {
  const solid = useScrolledPast(24);
  return (
    <div
      className={`${sticky ? "sticky top-0 z-40" : ""} -mx-6 px-6 border-b transition-colors duration-500 print:hidden ${
        sticky && solid ? "bg-(--nav-bg) backdrop-blur-md border-(--border)" : "border-transparent"
      }`}
    >
      <div className={`relative flex items-center justify-between gap-4 h-14 ${width} mx-auto`}>{children}</div>
    </div>
  );
}
