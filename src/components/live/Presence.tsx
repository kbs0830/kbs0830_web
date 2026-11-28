"use client";

import Hint from "@/components/ui/Hint";
import { useEffect, useSyncExternalStore } from "react";

// 「いま N 人」（TODO B4，2026-11-23）：現在正在看網站的人數。
//   - <Presence />（掛在 layout，每一頁都有）：分頁在前景時每 30 秒回報一次 /api/presence；
//     切到背景、關掉分頁時送「離開」（sendBeacon），回到前景馬上再報一次
//   - <PresenceCount />（首頁頁尾）：顯示最新的數字（兩個元件共用下面這個小 store，不多打一次 API）
// 分頁代碼存 sessionStorage（隨機字串、關掉分頁就沒了，重新整理還是同一個 → 不會重複算）；
// 伺服器只在記憶體記「代碼 → 最後回報時間」，不寫檔（lib/stats/presence.ts）。

let count: number | null = null;
const listeners = new Set<() => void>();
function setCount(n: number) {
  count = n;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let fallbackId: string | null = null;
function tabId(): string {
  try {
    let id = sessionStorage.getItem("kbs-tab");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("kbs-tab", id);
    }
    return id;
  } catch {
    fallbackId ??= crypto.randomUUID();
    return fallbackId;
  }
}

export default function Presence() {
  useEffect(() => {
    if (location.pathname.startsWith("/radar/live")) return; // 直播（OBS）畫面不算「現在有人在看」
    const id = tabId();
    let ctrl: AbortController | null = null;
    const report = async () => {
      if (document.hidden) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch("/api/presence", { method: "POST", body: JSON.stringify({ id }), signal: ctrl.signal });
        const d: { count?: number } = await res.json();
        if (typeof d.count === "number") setCount(d.count);
      } catch {
        // 回報失敗就維持上一個數字
      }
    };
    const bye = () => navigator.sendBeacon?.("/api/presence", JSON.stringify({ id, leave: true }));
    const onVisibility = () => (document.hidden ? bye() : report());

    report();
    const timer = setInterval(report, 30_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", bye);
    return () => {
      clearInterval(timer);
      ctrl?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", bye);
    };
  }, []);
  return null;
}

export function PresenceCount() {
  const n = useSyncExternalStore(
    subscribe,
    () => count,
    () => null,
  );
  return (
    <p className="text-xs text-(--muted) font-light tracking-wide sm:tracking-[0.15em] font-mono whitespace-nowrap">
      <span aria-hidden className="inline-block size-1.5 rounded-full bg-(--accent) mr-2 align-middle -translate-y-px" />
      いま {n ?? "–"} 人
      {/* 原本是 title（手機看不到），改 Hint：滑過去／長按／點一下都看得到（TODO Q7） */}
      <Hint id="presence" label="いま N 人">
        現在正在看這個網站的人數（含你），每 30 秒更新。
      </Hint>
    </p>
  );
}
