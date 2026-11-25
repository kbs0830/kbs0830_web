"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// 讀瀏覽器狀態（matchMedia、scrollY）一律走 useSyncExternalStore：
// server 用 getServerSnapshot 的值完成首次 render、hydration 後自動切到真實值，
// 不會 hydration mismatch，也不用再寫「useEffect 裡同步 setState」那種要壓
// eslint-disable 的 pattern（原本 Hero/HeroScene/Magnetic/NavBar 各寫了一份）。

/**
 * 抓一次 JSON（2026-11-25 從 5 個元件各自抄的 fetch().then() 合併）：async/await＋元件卸載就 abort，HTTP 不是 2xx 也算失敗。
 * 回傳 null＝載入中、"error"＝失敗、其他＝資料。資料「合不合用」（例如 banks 是空的）由呼叫的元件自己判斷。
 */
export function useJson<T>(url: string): T | null | "error" {
  const [data, setData] = useState<{ url: string; value: T | "error" } | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData({ url, value: (await res.json()) as T });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setData({ url, value: "error" });
      }
    })();
    return () => ctrl.abort();
  }, [url]);
  // 換網址時舊的資料不算數（還沒抓到新的就是載入中）
  return data && data.url === url ? data.value : null;
}

/** CSS media query 是否成立；server 端回傳 `null`（還不知道）。 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)") ?? false;
}

/** 目前主題的強調色（globals.css 的 --accent），切換深淺色時跟著變；server 端回傳 fallback。 */
export function useAccentColor(fallback = "#2d5a8e"): string {
  return useSyncExternalStore(
    (onChange) => {
      const mo = new MutationObserver(onChange);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => mo.disconnect();
    },
    () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || fallback,
    () => fallback,
  );
}

/** 頁面是否已經捲過某個高度（px，或每次重新計算的函式，例如「一個視窗高」）。 */
export function useScrolledPast(threshold: number | (() => number)): boolean {
  const limit = () => (typeof threshold === "function" ? threshold() : threshold);
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("scroll", onChange, { passive: true });
      window.addEventListener("resize", onChange);
      return () => {
        window.removeEventListener("scroll", onChange);
        window.removeEventListener("resize", onChange);
      };
    },
    () => window.scrollY > limit(),
    () => false,
  );
}

/**
 * 元素第一次進入視窗時加上 `data-shown` 屬性（只觸發一次），動畫本身交給 CSS
 * （globals.css 的 `[data-reveal]`）。直接改 DOM 屬性、不經過 React state，
 * 捲動時不會造成任何 re-render。
 */
export function useRevealOnce<T extends Element>(margin = 80) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-shown", "");
        io.disconnect();
      },
      { rootMargin: `0px 0px -${margin}px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return ref;
}
