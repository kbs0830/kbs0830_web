"use client";

import { useState } from "react";
import { toJapaneseKanji } from "@/lib/tools/kanji-jp";

// 繁體字 → 日文漢字對照（TODO J7）。全部在瀏覽器算
export default function KanjiJp() {
  const [text, setText] = useState("學習發展・國際機場・鐵道");
  const chars = toJapaneseKanji(text.slice(0, 500));
  const changed = chars.filter((c) => c.changed);
  const unique = [...new Map(changed.map((c) => [c.ch, c.jp])).entries()];

  return (
    <div className="space-y-8">
      <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
        輸入繁體中文（最多 500 字）
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="bg-transparent border border-(--border) rounded-sm px-3 py-2 text-base text-(--text) font-sans focus:outline-none focus:border-(--accent)"
        />
      </label>
      <div>
        <p className="text-[11px] text-(--muted) font-mono tracking-wide mb-2">日文寫法（標色的是不一樣的字）</p>
        <p lang="ja" className="text-2xl font-serif leading-relaxed break-all">
          {chars.map((c, i) =>
            c.changed ? (
              <mark key={i} className="bg-(--accent-lt) text-(--accent) rounded-sm px-0.5">
                {c.jp}
              </mark>
            ) : (
              <span key={i}>{c.jp}</span>
            ),
          )}
        </p>
      </div>
      {unique.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {unique.map(([tw, jp]) => (
            <li key={tw} className="border border-(--border) rounded-sm px-3 py-2 text-lg font-serif">
              {tw} <span className="text-(--muted) text-sm">→</span> <span lang="ja" className="text-(--accent)">{jp}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
