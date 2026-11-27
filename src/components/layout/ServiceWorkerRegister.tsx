"use client";

import { useEffect } from "react";

// 註冊 Service Worker（TODO B10，2026-11-27）：讓讀過的文章沒網路也打得開。邏輯在 public/sw.js（network-first，有網路一律拿最新的）。
// 只在正式環境註冊：dev 模式每次存檔都重編、再被 SW 快取會很難除錯，CI 的 E2E 也跑 dev，不該被它影響。
// 頁面載入完、瀏覽器閒下來才註冊，不跟首頁的 LCP 搶頻寬。註冊失敗（不支援、無痕模式擋掉）靜默略過。
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    if (document.readyState === "complete") {
      (window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000)))(register);
      return;
    }
    const onLoad = () => (window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000)))(register);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
