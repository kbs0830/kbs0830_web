"use client";

import { useSyncExternalStore } from "react";

// 手機封面「高雄 ⇄ 福岡」兩地即時時刻（2026-11-25，使用者選的創意 2）。只在手機顯示（HeroSection 包 sm:hidden）。
// 不打 API：時間在瀏覽器算，每 15 秒檢查一次（分鐘變了才重畫）；分頁在背景時不跑。
// server 端先輸出「--:--」，hydration 後才換成真的時間，不會有時區造成的 hydration mismatch。

const fmt = (tz: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(Date.now());

const subscribe = (onChange: () => void) => {
  const id = setInterval(() => {
    if (!document.hidden) onChange();
  }, 15_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onChange);
  };
};

// 回傳字串（不是物件）：snapshot 要穩定，分鐘沒變就不重畫
const read = () => `${fmt("Asia/Taipei")}|${fmt("Asia/Tokyo")}`;

export default function HeroTwoCities() {
  const [kh, fk] = useSyncExternalStore(subscribe, read, () => "--:--|--:--").split("|");
  return (
    <p className="flex items-baseline justify-center gap-3 text-xs text-(--muted) font-mono tracking-[0.15em]">
      <span>
        高雄 <time className="text-(--text)">{kh}</time>
      </span>
      <span aria-hidden className="text-(--accent)">
        ⇄
      </span>
      <span>
        福岡 <time className="text-(--text)">{fk}</time>
      </span>
    </p>
  );
}
