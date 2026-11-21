"use client";

import { useEffect, useRef, useState } from "react";

// 文章程式碼區塊右上角的「複製」（TODO A6，2026-11-21）。程式碼本身是 server 產生的 <pre>，
// 這裡只是一顆按鈕：點了讀同一個容器裡 <pre> 的文字。沒有 JS 時按鈕不顯示（initial hidden，掛上才出現）。
export default function CopyCodeButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ref.current?.removeAttribute("hidden");
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    const pre = ref.current?.parentElement?.querySelector("pre");
    if (!pre) return;
    try {
      await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ""));
      setState("copied");
    } catch {
      setState("failed"); // 非 https、被瀏覽器擋
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1600);
  };

  return (
    <button
      ref={ref}
      type="button"
      hidden
      onClick={copy}
      aria-label="複製程式碼"
      className="absolute top-2 right-2 px-2 py-1 text-[11px] font-mono rounded-sm border border-(--border) bg-(--bg) text-(--muted) hover:text-(--accent) hover:border-(--accent) transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
    >
      <span aria-live="polite">{state === "copied" ? "已複製" : state === "failed" ? "複製失敗" : "複製"}</span>
    </button>
  );
}
