"use client";

import { useEffect } from "react";
import { brandIconSvgUrl, type IconStatus } from "@/lib/brand-icon";

/**
 * 把分頁圖示換成狀態色（2026-11-12），回傳「換回原本」的函式。
 * 用的地方：頁面出錯（紅，MaintenancePage）、新功能上線 12 小時內（指示燈亮櫻花粉，VisitBeacon）。
 * 出錯優先：已經是紅色時，其他狀態不會把它蓋掉。
 */
export function setFavicon(status: IconStatus): () => void {
  const root = document.documentElement;
  if (root.dataset.favicon === "error" && status !== "error") return () => {};
  const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
  const original = links.map((l) => [l, l.href, l.type] as const);
  const prevStatus = root.dataset.favicon;
  if (links.length === 0) {
    const l = document.createElement("link");
    l.rel = "icon";
    document.head.appendChild(l);
    links.push(l);
  }
  const href = brandIconSvgUrl(status);
  for (const l of links) {
    l.href = href;
    l.type = "image/svg+xml";
  }
  root.dataset.favicon = status;
  return () => {
    for (const [l, h, t] of original) {
      l.href = h;
      l.type = t;
    }
    if (prevStatus) root.dataset.favicon = prevStatus;
    else delete root.dataset.favicon;
  };
}

// 元件版：掛著的時候是這個狀態色，離開（例如按「重試」恢復）時換回原本的
export default function StatusFavicon({ status }: { status: IconStatus }) {
  useEffect(() => setFavicon(status), [status]);
  return null;
}
