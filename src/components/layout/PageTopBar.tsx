"use client";
import type { ReactNode } from "react";
import { useScrolledPast } from "@/lib/client/hooks";

// 子頁面的頁首（TODO F2，2026-11-26）：跟首頁 NavBar 一樣固定在上方，捲動後才出現半透明底＋細線。
// sticky 放在滿版的外層（-mx-6 px-6 抵銷 PageShell 的左右留白），裡面再用跟內文一樣的寬度。
// sticky＝false（站長後台，自己有黏頂的分頁列）時不固定。
// 2026-11-27（TODO Q9）：底色／模糊／細線改成跟首頁 NavBar 同一套 .nav-fade（globals.css）：畫在 ::before，
// 支援 animation-timeline: scroll() 的瀏覽器純 CSS 跟著捲動 0～60px 慢慢出現；不支援的退回這裡的 useScrolledPast（.is-solid）。
export default function PageTopBar({ children, width, sticky = true }: { children: ReactNode; width: string; sticky?: boolean }) {
  const solid = useScrolledPast(24);
  return (
    <div
      className={`${sticky ? `nav-fade sticky top-0 z-40 ${solid ? "is-solid" : ""}` : ""} -mx-6 px-6 print:hidden`}
    >
      <div className={`relative flex items-center justify-between gap-4 h-14 ${width} mx-auto`}>{children}</div>
    </div>
  );
}
