"use client";

import Link from "next/link";
import { useJson } from "@/lib/client/hooks";

type Data = { status: { downMinutes: number } | null; rare: string[] };

// 首頁頁尾的「● 正常運作」＋「今日は珍しい機体：…」（TODO F11、B16；Q2 起改成瀏覽器載入後才抓，讓首頁維持純靜態）。
// 抓不到或沒資料就什麼都不顯示，頁尾不會跳版（兩個都在 flex-wrap 的最後面）。
export default function FooterLive({ className = "" }: { className?: string }) {
  const data = useJson<Data>("/api/footer-live");
  if (!data || data === "error") return null;
  const { status, rare } = data;
  const ok = status?.downMinutes === 0;
  return (
    <>
      {status && (
        <Link href="/status" className={`${className} inline-flex items-center gap-1.5 py-1 -my-1 transition-colors hover:text-(--accent) enter-fade`} title="維運狀態 · Status">
          <span aria-hidden className={`size-1.5 rounded-full ${ok ? "bg-(--ok)" : "bg-(--warn)"}`} />
          <span className={ok ? "" : "text-(--warn)"}>{ok ? "正常運作" : `今天有約 ${status.downMinutes} 分鐘中斷`}</span>
        </Link>
      )}
      {/* 稀有機那行手機不顯示（2026-11-28 使用者要求拿掉） */}
      {rare.length > 0 && (
        <Link href="/radar/zukan" className={`${className} hidden sm:block transition-colors hover:text-(--accent) enter-fade`} title="機體図鑑 · Zukan">
          今日は珍しい機体：{rare.join("、")}
        </Link>
      )}
    </>
  );
}
