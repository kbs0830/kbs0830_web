"use client";
import { useDeferredValue, useMemo, useState } from "react";
import MiniMarkdown from "@/components/admin/MiniMarkdown";

// 完成紀錄（原本的 DONE.md，2026-11-26 搬進資料庫）：依月份分組、可搜尋（標題＋全文）、點標題展開全文。
// 資料由 server 端從 done_log 讀好傳進來；沒有日期的舊分類段落歸在最後一組。
export type DoneItem = { id: number; day: string | null; title: string; body: string };

const monthOf = (d: DoneItem) => (d.day ? d.day.slice(0, 7) : "更早、沒有日期的分類");

export default function DoneList({ items }: { items: DoneItem[] }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLowerCase());
  const visible = useMemo(
    () => (query ? items.filter((i) => `${i.title}\n${i.body}`.toLowerCase().includes(query)) : items),
    [items, query],
  );
  const groups = useMemo(() => {
    const m = new Map<string, DoneItem[]>();
    for (const i of visible) m.set(monthOf(i), [...(m.get(monthOf(i)) ?? []), i]);
    return [...m];
  }, [visible]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋標題或內容…"
          aria-label="搜尋完成紀錄"
          className="h-9 w-full max-w-sm rounded-sm border border-(--border) bg-(--bg) px-3 text-sm text-(--text) placeholder:text-(--muted)"
        />
        <span className="shrink-0 font-mono text-xs text-(--muted)">
          {query ? `${visible.length}／${items.length}` : items.length} 筆
        </span>
      </div>
      {visible.length === 0 && <p className="py-8 text-center text-sm font-light text-(--muted)">沒有符合的紀錄。</p>}
      <div className="space-y-3">
        {groups.map(([month, list]) => (
          <details key={month} open={!!query || month === groups[0][0]} className="group/sec rounded-sm border border-(--border) bg-(--bg)">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 px-3 py-2.5 bg-(--surface) rounded-sm group-open/sec:rounded-b-none">
              <span aria-hidden className="text-(--muted) text-xs transition-transform group-open/sec:rotate-90">▸</span>
              <span className="text-sm text-(--text)">{month}</span>
              <span className="ml-auto font-mono text-[11px] text-(--muted)">{list.length}</span>
            </summary>
            <ul className="divide-y divide-(--border)">
              {list.map((i) => (
                <li key={i.id}>
                  <details open={!!query && visible.length <= 5} className="group/item">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-baseline gap-2 px-3 py-2.5">
                      <span aria-hidden className="text-(--muted) text-[10px] transition-transform group-open/item:rotate-90">▸</span>
                      {i.day && <span className="shrink-0 font-mono text-[11px] text-(--muted)">{i.day.slice(5)}</span>}
                      <span className="text-sm text-(--text) font-light">{i.title}</span>
                    </summary>
                    <div className="mx-3 mb-3 rounded-sm bg-(--surface) px-3 py-2.5">
                      {i.body ? <MiniMarkdown text={i.body} /> : <p className="text-xs text-(--muted)">（沒有內文）</p>}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
