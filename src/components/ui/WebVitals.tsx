"use client";

import { useReportWebVitals } from "next/web-vitals";

// 把真實訪客的 Core Web Vitals 回報給 /api/web-vitals（只送指標、數值、路徑）。
// sendBeacon 在關分頁時也送得出去，LCP／CLS／INP 很多是離開頁面那一刻才定案。
// 函式放在元件外面：useReportWebVitals 要求 callback 參考不變，不然會重複回報。
// 作品／文章頁統一記成 /projects/slug、/blog/slug，同一類頁面的樣本才會合在一起算。
function report({ name, value }: { name: string; value: number }) {
  const page = location.pathname.replace(/^\/(projects|blog)\/[^/]+$/, "/$1/slug");
  navigator.sendBeacon("/api/web-vitals", JSON.stringify({ name, value, page }));
}

export default function WebVitals() {
  useReportWebVitals(report);
  return null;
}
