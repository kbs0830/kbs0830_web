"use client";

import { useState, useSyncExternalStore } from "react";
import { classify } from "../../../scripts/lib/bot-patterns.js";

// 這個 User-Agent 是爬蟲嗎？（TODO J13，2026-11-24）。分類規則跟網站自己的「未過濾流量」統計同一份
// （scripts/lib/bot-patterns.js），在瀏覽器裡判斷，貼上的字串不會送出去。預設帶入訪客自己瀏覽器的 UA。

const KIND: Record<string, { zh: string; desc: string }> = {
  ai: { zh: "AI 爬蟲", desc: "AI 公司的爬蟲或 AI 助理代替使用者來讀網頁（訓練資料、AI 搜尋、聊天時即時查資料）。" },
  search: { zh: "搜尋引擎", desc: "Google、Bing 這類搜尋引擎的爬蟲，抓網頁去建索引。" },
  bot: { zh: "其他機器人", desc: "不是一般瀏覽器：掃描器、監控、程式（curl、Python）、預覽連結的機器人，或是 UA 格式不對。" },
  browser: { zh: "一般瀏覽器", desc: "看起來是真人在用的瀏覽器。注意：UA 可以自己亂填，假裝成瀏覽器的爬蟲這裡分不出來。" },
};

const noop = () => () => {};

export default function UserAgentCheck() {
  const own = useSyncExternalStore(noop, () => navigator.userAgent, () => "");
  const [input, setInput] = useState<string | null>(null);
  const ua = input ?? own;
  const result = ua.trim() ? classify(ua.trim()) : null;
  const info = result ? KIND[result.kind] : null;

  return (
    <div className="min-h-[320px]">
      <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
        User-Agent
        <textarea
          value={ua}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          spellCheck={false}
          className="w-full bg-transparent border border-(--border) rounded-sm px-3 py-2 text-sm text-(--text) font-mono leading-relaxed focus:outline-none focus:border-(--accent)"
        />
      </label>
      {input !== null && own && (
        <button type="button" onClick={() => setInput(null)} className="mt-2 text-xs text-(--muted) hover:text-(--accent) font-mono transition-colors">
          換回我自己的瀏覽器
        </button>
      )}

      <div className="mt-8" aria-live="polite">
        {result && info ? (
          <>
            <p className="text-lg font-light text-(--text)">
              判斷：<span className="text-(--accent)">{info.zh}</span>
              {result.name && <span className="ml-2 font-mono text-base">（{result.name}）</span>}
            </p>
            <p className="mt-2 text-sm font-light text-(--muted) leading-relaxed">{info.desc}</p>
          </>
        ) : (
          <p className="text-sm text-(--muted) font-light">貼上一串 User-Agent</p>
        )}
      </div>
    </div>
  );
}
