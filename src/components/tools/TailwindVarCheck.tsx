"use client";

import { useState } from "react";

import { EXAMPLE, checkTailwindVars } from "@/lib/tools/tailwind-vars";

// Tailwind v4 變數寫法檢查（TODO J14，2026-11-25）。比對邏輯跟範例在 lib/tools/tailwind-vars.ts（那支 Tailwind 不掃，見那邊的說明）；
// 這支只有畫面，class 照常讓 Tailwind 產生。全部在瀏覽器裡比對，貼的內容不會送出去。

export default function TailwindVarCheck() {
  const [src, setSrc] = useState(EXAMPLE);
  const { hits, fixed } = checkTailwindVars(src);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fixed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="min-h-[420px]">
      <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
        貼上 class 或整段 JSX／HTML
        <textarea
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          rows={6}
          spellCheck={false}
          className="w-full rounded-sm border border-(--border) bg-(--bg) px-3 py-2 text-[13px] text-(--text) font-mono leading-relaxed focus:border-(--accent) outline-none"
        />
      </label>

      <div className="mt-8" aria-live="polite">
        {hits.length === 0 ? (
          <p className="text-sm font-light text-(--text)">
            {src.trim() ? "沒有找到「方括號＋裸變數」的寫法，這段在 v4 沒問題。" : "貼上一段程式碼看看。"}
          </p>
        ) : (
          <>
            <p className="text-sm font-light text-(--text) mb-4">
              找到 <span className="font-mono text-(--warn)">{hits.length}</span> 處在 v4 會失效的寫法：
            </p>
            <ul className="border-y border-(--border) divide-y divide-(--border) font-mono text-[13px]">
              {hits.map((h, i) => (
                <li key={i} className="py-2.5 grid grid-cols-[3.5rem_1fr] gap-3">
                  <span className="text-(--muted)">第 {h.line} 行</span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="text-(--warn) line-through decoration-(--warn)/40">{h.before}</span>
                    <span className="text-(--muted)"> → </span>
                    <span className="text-(--accent)">{h.after}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="relative mt-6">
              <p className="text-[11px] text-(--muted) font-mono tracking-wide mb-2">改好的版本</p>
              <pre className="text-[13px] leading-relaxed p-4 pr-20 rounded-sm border border-(--border) bg-(--surface) font-mono whitespace-pre-wrap [overflow-wrap:anywhere]">{fixed}</pre>
              <button
                type="button"
                onClick={copy}
                className="absolute top-8 right-2 px-2 py-1 text-[11px] font-mono rounded-sm border border-(--border) bg-(--bg) text-(--muted) hover:text-(--accent) hover:border-(--accent) transition-colors"
              >
                {copied ? "已複製" : "複製"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
