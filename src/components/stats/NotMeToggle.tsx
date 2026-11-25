"use client";

import { useSyncExternalStore } from "react";
import { NOT_ME_EVENT, NOT_ME_KEY, isNotMe, setNotMe } from "@/lib/client/not-me";

const subscribe = (onChange: () => void) => {
  const onStorage = (e: StorageEvent) => e.key === NOT_ME_KEY && onChange();
  window.addEventListener(NOT_ME_EVENT, onChange);
  window.addEventListener("storage", onStorage); // 別的分頁切換時也跟著變
  return () => {
    window.removeEventListener(NOT_ME_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
};

// /stats 最下面：「這個瀏覽器不計入真人訪客」開關（lib/client/not-me.ts）。誰都可以按，只影響自己的瀏覽器。
// server 端還不知道 localStorage → 先不畫（null），hydration 後才出現，不會閃錯的狀態。
export default function NotMeToggle() {
  const on = useSyncExternalStore(subscribe, isNotMe, () => null);
  if (on === null) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 border-y border-(--border)">
      <p className="text-[15px] sm:text-sm font-light text-(--text)">
        這個瀏覽器{on ? "目前不計入" : "目前會計入"}真人訪客
        <span className="block mt-1 text-xs text-(--muted)">
          只記在這個瀏覽器裡（換瀏覽器、無痕視窗、手機要各自設定）。不影響「いま N 人」。
        </span>
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="這個瀏覽器不計入統計"
        onClick={() => setNotMe(!on)}
        className={`shrink-0 relative w-11 h-6 rounded-full border transition-colors ${
          on ? "bg-(--accent) border-(--accent)" : "bg-(--surface) border-(--border)"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-1/2 -translate-y-1/2 size-4 rounded-full transition-[left,background-color] duration-200 ease-(--ease-ma) ${
            on ? "left-[22px] bg-(--bg)" : "left-[3px] bg-(--muted)"
          }`}
        />
      </button>
    </div>
  );
}
