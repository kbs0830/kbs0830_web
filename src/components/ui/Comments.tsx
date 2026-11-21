"use client";

import { useEffect, useRef, useState } from "react";
import { GISCUS } from "@/lib/giscus";
import { useAccentColor } from "@/lib/hooks";

// 文章留言（giscus：留言存在 GitHub Discussions，訪客用 GitHub 登入；TODO A6，2026-11-21）。
// - lib/giscus.ts 的設定是 null（還沒在 GitHub 開 Discussions、裝 giscus app）時整塊不出現
// - 按「載入留言」才載入 giscus 官方的 client.js：只是打開文章，不會連到第三方
//   （不自己組 iframe：登入後導回來的 session、自動高度都是 client.js 在處理）
// - 主題跟著網站的淺色／深色（切換時用 postMessage 通知 iframe）
// next.config.ts 的 CSP 只有 GISCUS 有設定時才放行 giscus.app
export default function Comments({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const accent = useAccentColor(); // data-theme 改變時會變，拿來觸發主題同步

  useEffect(() => {
    if (!open || !GISCUS || !box.current || box.current.childElementCount) return;
    const s = document.createElement("script");
    const attrs: Record<string, string> = {
      src: "https://giscus.app/client.js",
      "data-repo": GISCUS.repo,
      "data-repo-id": GISCUS.repoId,
      "data-category": GISCUS.category,
      "data-category-id": GISCUS.categoryId,
      "data-mapping": "specific",
      "data-term": `blog/${slug}`,
      "data-strict": "1",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-theme": currentTheme(),
      "data-lang": "zh-TW",
      "data-loading": "lazy",
      crossorigin: "anonymous",
    };
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    s.async = true;
    box.current.appendChild(s);
  }, [open, slug]);

  useEffect(() => {
    const iframe = box.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    iframe?.contentWindow?.postMessage({ giscus: { setConfig: { theme: currentTheme() } } }, "https://giscus.app");
  }, [accent]);

  if (!GISCUS) return null;
  return (
    <div className="mt-16 pt-8 border-t border-(--border)">
      {!open && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-mono text-(--accent) border border-(--border) rounded-sm px-4 py-2 hover:border-(--accent) transition-colors"
          >
            載入留言 · Comments
          </button>
          <p className="text-[11px] text-(--muted) font-light mt-2">留言存在 GitHub Discussions，按了才會連到 giscus／GitHub</p>
        </div>
      )}
      <div ref={box} />
    </div>
  );
}

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
