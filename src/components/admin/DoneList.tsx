"use client";
import { useEffect, useMemo, useState } from "react";
import MiniMarkdown from "@/components/admin/MiniMarkdown";

// 完成紀錄（原本的 DONE.md，2026-11-26 搬進資料庫）：依月份分組、可搜尋（標題＋全文）、點標題展開全文。
// 2026-11-26 晚（使用者：「admin 後台開始卡了」→「也改完成頁」）：列表只帶日期＋標題，
// 全文點開才打 GET /api/admin/done?id=；搜尋交給伺服器（?q=，搜全文），結果 5 筆以內順便帶全文、直接展開。
// 沒有日期的舊分類段落歸在最後一組。
export type DoneItem = { id: number; day: string | null; title: string };

const monthOf = (d: DoneItem) => (d.day ? d.day.slice(0, 7) : "更早、沒有日期的分類");

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export default function DoneList({ items }: { items: DoneItem[] }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Set<number> | null>(null);
  const [searching, setSearching] = useState(false);
  const [bodies, setBodies] = useState<Record<number, string>>({});
  const query = q.trim();

  // 打字停 250ms 才問伺服器；換字就取消上一個請求
  useEffect(() => {
    if (!query) return;
    const ac = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await getJson<{ ids: number[]; bodies?: Record<string, string> }>(`/api/admin/done?q=${encodeURIComponent(query)}`, ac.signal);
        setHits(new Set(res.ids));
        if (res.bodies) setBodies((b) => ({ ...b, ...Object.fromEntries(Object.entries(res.bodies!).map(([k, v]) => [Number(k), v])) }));
      } catch {
        // 取消或失敗：維持上一次的結果
      } finally {
        if (!ac.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [query]);

  // 清空搜尋字時直接回到全部（不用另外把 hits 清掉）
  const active = query ? hits : null;
  const visible = useMemo(() => (active ? items.filter((i) => active.has(i.id)) : items), [items, active]);
  const groups = useMemo(() => {
    const m = new Map<string, DoneItem[]>();
    for (const i of visible) m.set(monthOf(i), [...(m.get(monthOf(i)) ?? []), i]);
    return [...m];
  }, [visible]);

  const loadBody = async (id: number) => {
    if (bodies[id] !== undefined) return;
    try {
      const res = await getJson<{ body: string }>(`/api/admin/done?id=${id}`);
      setBodies((b) => ({ ...b, [id]: res.body }));
    } catch {
      setBodies((b) => ({ ...b, [id]: "讀不到內容，重新整理再試一次。" }));
    }
  };

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
          {searching ? "搜尋中…" : active ? `${visible.length}／${items.length}` : items.length} {searching ? "" : "筆"}
        </span>
      </div>
      {active && visible.length === 0 && !searching && <p className="py-8 text-center text-sm font-light text-(--muted)">沒有符合的紀錄。</p>}
      <div className="space-y-3">
        {groups.map(([month, list]) => (
          <details key={month} open={!!active || month === groups[0][0]} className="group/sec rounded-sm border border-(--border) bg-(--bg)">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 px-3 py-2.5 bg-(--surface) rounded-sm group-open/sec:rounded-b-none">
              <span aria-hidden className="text-(--muted) text-xs transition-transform group-open/sec:rotate-90">▸</span>
              <span className="text-sm text-(--text)">{month}</span>
              <span className="ml-auto font-mono text-[11px] text-(--muted)">{list.length}</span>
            </summary>
            <ul className="divide-y divide-(--border)">
              {list.map((i) => (
                <li key={i.id}>
                  <details
                    open={!!active && visible.length <= 5}
                    className="group/item"
                    onToggle={(e) => {
                      if ((e.currentTarget as HTMLDetailsElement).open) void loadBody(i.id);
                    }}
                  >
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-baseline gap-2 px-3 py-2.5">
                      <span aria-hidden className="text-(--muted) text-[10px] transition-transform group-open/item:rotate-90">▸</span>
                      {i.day && <span className="shrink-0 font-mono text-[11px] text-(--muted)">{i.day.slice(5)}</span>}
                      <span className="text-sm text-(--text) font-light">{i.title}</span>
                    </summary>
                    <div className="mx-3 mb-3 rounded-sm bg-(--surface) px-3 py-2.5">
                      {bodies[i.id] === undefined ? (
                        <p className="text-xs text-(--muted)">讀取中…</p>
                      ) : bodies[i.id] ? (
                        <MiniMarkdown text={bodies[i.id]} />
                      ) : (
                        <p className="text-xs text-(--muted)">（沒有內文）</p>
                      )}
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
