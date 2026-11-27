"use client";

import { useReportWebVitals } from "next/web-vitals";

// 把真實訪客的 Core Web Vitals 回報給 /api/web-vitals（只送指標、數值、路徑）。
// sendBeacon 在關分頁時也送得出去，LCP／CLS／INP 很多是離開頁面那一刻才定案。
// 函式放在元件外面：useReportWebVitals 要求 callback 參考不變，不然會重複回報。
// 作品／文章頁統一記成 /projects/slug、/blog/slug，同一類頁面的樣本才會合在一起算。
// 2026-11-27（TODO R2）：①404 頁一律記成 /404（not-found 頁有 data-not-found 標記；原本訪客打錯網址停在 404 頁，
// 會用原始網址回報，/stats 的頁面清單越長越亂）②多帶 device（手機／桌機，跟 CSS 同一個斷點 768px），手機的 LCP 才分得出來
function report({ name, value }: { name: string; value: number }) {
  const notFound = document.querySelector("[data-not-found]") !== null;
  const page = notFound ? "/404" : location.pathname.replace(/^\/(projects|blog)\/[^/]+$/, "/$1/slug");
  const device = matchMedia("(width < 768px)").matches ? "mobile" : "desktop";
  navigator.sendBeacon("/api/web-vitals", JSON.stringify({ name, value, page, device }));
}

export default function WebVitals() {
  useReportWebVitals(report);
  return null;
}
