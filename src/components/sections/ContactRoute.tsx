"use client";

import { PlaneIcon } from "@/components/ui/icons";
import { useTwoCityTimes } from "@/components/sections/HeroTwoCities";

// 連絡先最底下的一條航線（TODO M16，2026-11-26）：● 高雄 HH:MM ─ ─ ✈ ─ ─ 福岡 HH:MM ●
// 接住全站的飛機主題，當頁尾前的收尾。虛線畫出來、小飛機從高雄滑到福岡都是 CSS 捲動動畫（globals.css .contact-route-*），
// 這個元件只負責兩地時刻（跟手機封面同一個 hook）。減少動態效果、不支援的瀏覽器：直接顯示畫好的線、飛機停在終點
export default function ContactRoute() {
  const [kh, fk] = useTwoCityTimes();
  return (
    <div className="flex items-center gap-3 sm:gap-5 text-xs text-(--muted) font-mono tracking-[0.15em]">
      <span className="flex items-center gap-2 shrink-0">
        <span aria-hidden className="size-1.5 rounded-full bg-(--accent)" />
        高雄 <time className="text-(--text)">{kh}</time>
      </span>
      <span aria-hidden className="contact-route relative flex-1 h-4 flex items-center">
        <span className="contact-route-line absolute inset-x-0 top-1/2 h-px" />
        <PlaneIcon size={16} className="contact-route-plane absolute top-0 left-0 text-(--accent)" />
      </span>
      <span className="flex items-center gap-2 shrink-0">
        福岡 <time className="text-(--text)">{fk}</time>
        <span aria-hidden className="size-1.5 rounded-full bg-(--accent)" />
      </span>
    </div>
  );
}
