"use client";

import { useEffect } from "react";
import { brandIconSvgUrl, type IconStatus } from "@/lib/brand-icon";

// 把分頁圖示換成狀態色（2026-11-12）：頁面出錯時是紅色視窗（MaintenancePage／error.tsx 用）。
// 離開這個畫面（例如按「重試」恢復）時換回原本的圖示。
export default function StatusFavicon({ status }: { status: IconStatus }) {
  useEffect(() => {
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
    const original = links.map((l) => [l, l.href, l.type] as const);
    const href = brandIconSvgUrl(status);
    if (links.length === 0) {
      const l = document.createElement("link");
      l.rel = "icon";
      document.head.appendChild(l);
      links.push(l);
    }
    for (const l of links) {
      l.href = href;
      l.type = "image/svg+xml";
    }
    return () => {
      for (const [l, h, t] of original) {
        l.href = h;
        l.type = t;
      }
    };
  }, [status]);
  return null;
}
