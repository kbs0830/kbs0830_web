"use client";
import { useEffect, useRef, useState } from "react";
import type { Choice, Decision } from "@/lib/admin/db";
import type { TodoItem } from "@/lib/admin/todo";

// 後台的決策表（TODO G1）：TODO.md 每一項選「先做／之後／不做」＋備註，存進 data/admin.db。
// 2026-11-26 改版（使用者：「手機版有一堆奇怪的空白」「可以用點不同顏色」「已存好醜」）：
// - 顏色：先做＝--ok（綠）、之後＝--later（藤紫）、不做＝灰；每列左邊一條目前選擇的顏色
// - 上面一條比例條＋篩選膠囊；分區可以收起來（原生 <details>）
// - 手機：三個選項按鈕撐滿一排、好按；備註平常收起來，按「備註」才出現輸入框
// - 存好／失敗用畫面下方的小提示（toast），不再佔一行空白
// 再按一次同一個選項＝取消。備註離開輸入框或按 Enter 才存。存失敗退回原本的值。
const LABEL: Record<Choice, string> = { now: "先做", later: "之後", skip: "不做" };
const SIZE_LABEL = { L: "大", M: "中", S: "小" } as const;
const FILLED: Record<Choice, string> = {
  now: "bg-(--ok) text-(--bg) border-(--ok)",
  later: "bg-(--later) text-(--bg) border-(--later)",
  skip: "bg-(--muted) text-(--bg) border-(--muted)",
};
const BAR: Record<Choice | "none", string> = { now: "bg-(--ok)", later: "bg-(--later)", skip: "bg-(--muted)", none: "bg-(--border)" };

type Filter = "all" | "none" | Choice;
type Value = { choice: Choice | null; note: string };
type State = Record<string, Value>;
type Toast = { kind: "ok" | "error"; text: string } | null;
const without = (s: State, id: string): State => Object.fromEntries(Object.entries(s).filter(([k]) => k !== id));

async function post(itemId: string, choice: Choice | null, note: string) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch("/api/admin/decisions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId, choice, note }),
      signal: ac.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

export default function DecisionTable({ items, decisions }: { items: TodoItem[]; decisions: Decision[] }) {
  const [state, setState] = useState<State>(() =>
    Object.fromEntries(decisions.map((d) => [d.itemId, { choice: d.choice, note: d.note }])),
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const showToast = (t: NonNullable<Toast>) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    if (t.kind === "ok") toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const ids = new Set(items.map((i) => i.id));
  const orphans = Object.entries(state).filter(([id]) => !ids.has(id));
  const choiceOf = (id: string) => state[id]?.choice ?? null;
  const counts = { all: items.length, none: 0, now: 0, later: 0, skip: 0 };
  for (const i of items) counts[choiceOf(i.id) ?? "none"]++;

  async function save(id: string, title: string, next: Value) {
    const prev = state[id];
    setState((s) => ({ ...s, [id]: next }));
    try {
      await post(id, next.choice, next.note);
      if (!next.choice && !next.note.trim()) setState((s) => without(s, id));
      const what = next.choice ? LABEL[next.choice] : next.note.trim() ? "備註" : "取消";
      showToast({ kind: "ok", text: `${title} → ${what}` });
    } catch (e) {
      setState((s) => (prev ? { ...s, [id]: prev } : without(s, id)));
      showToast({ kind: "error", text: `沒存到（${e instanceof Error ? e.message : "連線失敗"}），已退回` });
    }
  }

  const visible = items.filter((i) => match(filter, choiceOf(i.id)));
  const groups = Map.groupBy(visible, (i) => i.group ?? i.section);

  return (
    <div>
      {/* 比例條：一眼看出決定了多少 */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-(--border) mb-3" aria-hidden>
        {(["now", "later", "skip"] as const).map((c) => (
          <span key={c} className={BAR[c]} style={{ width: `${(counts[c] / Math.max(1, items.length)) * 100}%` }} />
        ))}
      </div>

      <div role="group" aria-label="篩選" className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 [scrollbar-width:none] sm:flex-wrap sm:mx-0 sm:px-0">
        {(["all", "none", "now", "later", "skip"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs border transition-colors ${
              filter === f ? "border-(--text) text-(--text) bg-(--surface)" : "border-(--border) text-(--muted) hover:text-(--text)"
            }`}
          >
            {f !== "all" && <span aria-hidden className={`size-2 rounded-full ${BAR[f]}`} />}
            {f === "all" ? "全部" : f === "none" ? "還沒決定" : LABEL[f]}
            <span className="font-mono tabular-nums">{counts[f]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="py-8 text-center text-sm font-light text-(--muted)">這個分類沒有項目。</p>}

      <div className="space-y-3">
        {[...groups].map(([name, list]) => {
          const decided = list.filter((i) => choiceOf(i.id)).length;
          return (
            <details key={name} open className="group/sec rounded-sm border border-(--border) bg-(--bg)">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 px-3 py-2.5 bg-(--surface) rounded-sm group-open/sec:rounded-b-none">
                <span aria-hidden className="text-(--muted) text-xs transition-transform group-open/sec:rotate-90">▸</span>
                <span className="text-sm text-(--text) truncate">{name}</span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-(--muted)">
                  {decided}/{list.length}
                </span>
              </summary>
              <ul className="divide-y divide-(--border)">
                {list.map((item) => (
                  <Row key={item.id} item={item} value={state[item.id]} onSave={(v) => save(item.id, item.title, v)} />
                ))}
              </ul>
            </details>
          );
        })}
      </div>

      {orphans.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm text-(--text) mb-1">TODO.md 裡已經找不到的</h2>
          <p className="text-xs font-light text-(--muted) mb-2">做完搬到 DONE.md、或改了標題的項目。確認不需要就清掉。</p>
          <ul className="border-y border-(--border) divide-y divide-(--border)">
            {orphans.map(([id, v]) => (
              <li key={id} className="py-2.5 flex items-center justify-between gap-4 text-sm font-light">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-xs text-(--muted) mr-2">{id.replace(/^t:/, "")}</span>
                  {v.choice ? LABEL[v.choice] : "—"}
                  {v.note && <span className="text-(--muted)"> · {v.note}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => save(id, id.replace(/^t:/, ""), { choice: null, note: "" })}
                  className="shrink-0 h-8 px-3 rounded-full border border-(--border) text-xs text-(--muted) hover:text-(--warn) hover:border-(--warn)"
                >
                  清掉
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 存檔提示：畫面下方置中，存好 1.8 秒自己消失；失敗會留著 */}
      <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-6 pointer-events-none">
        {toast && (
          <p
            className={`enter-up pointer-events-auto max-w-full truncate rounded-full px-4 py-2 text-xs shadow-sm border ${
              toast.kind === "ok" ? "bg-(--ok-lt) text-(--ok) border-(--ok)" : "bg-(--warn-lt) text-(--warn) border-(--warn)"
            }`}
          >
            {toast.kind === "ok" ? "✓ 已存　" : "✕ "}
            {toast.text}
          </p>
        )}
      </div>
    </div>
  );
}

function match(f: Filter, c: Choice | null) {
  return f === "all" || (f === "none" ? c === null : c === f);
}

function Row({ item, value, onSave }: { item: TodoItem; value: Value | undefined; onSave: (v: Value) => void }) {
  const choice = value?.choice ?? null;
  const note = value?.note ?? "";
  const [draft, setDraft] = useState(note);
  const [editing, setEditing] = useState(false);
  const titleId = `todo-${item.id.replace(/[^\w-]/g, "_")}`;
  const commitNote = () => {
    setEditing(false);
    if (draft.trim() !== note.trim()) onSave({ choice, note: draft });
  };

  return (
    <li className="relative pl-4 pr-3 py-3 sm:grid sm:grid-cols-[1fr_auto] sm:gap-x-5">
      <span aria-hidden className={`absolute left-0 inset-y-0 w-[3px] ${BAR[choice ?? "none"]}`} />
      <div className="min-w-0">
        <p id={titleId} className="text-sm leading-snug text-(--text)">
          {item.code && <span className="font-mono text-[11px] text-(--muted) mr-1.5">{item.code}</span>}
          {item.title}
          {item.size && <span className="ml-1.5 font-mono text-[10px] text-(--muted)">{SIZE_LABEL[item.size]}</span>}
          {item.needsYou && <span className="ml-1.5 align-[1px] rounded-full px-1.5 py-px text-[10px] bg-(--warn-lt) text-(--warn)">要你</span>}
          {item.recommended && <span className="ml-1.5 align-[1px] rounded-full px-1.5 py-px text-[10px] bg-(--accent-lt) text-(--accent)">推薦</span>}
        </p>
        {item.summary && <p className="mt-1 text-[11px] font-light text-(--muted) line-clamp-1 sm:line-clamp-2">{item.summary}</p>}
        {note && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="mt-1.5 text-left text-xs text-(--text) bg-(--surface) rounded-sm px-2 py-1">
            📝 {note}
          </button>
        )}
        {editing && (
          <input
            type="text"
            autoFocus
            value={draft}
            maxLength={1000}
            placeholder="寫點備註，按 Enter 存"
            aria-label={`${item.title} 的備註`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitNote}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") { setDraft(note); setEditing(false); }
            }}
            className="mt-2 w-full rounded-sm bg-(--surface) border border-(--border) focus:border-(--accent) outline-none px-2 py-1.5 text-sm font-light text-(--text) placeholder:text-(--muted)"
          />
        )}
      </div>
      <div role="group" aria-labelledby={titleId} className="mt-2.5 sm:mt-0 grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 sm:flex sm:self-start">
        {(["now", "later", "skip"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={choice === c}
            onClick={() => onSave({ choice: choice === c ? null : c, note: draft })}
            className={`h-9 sm:h-8 sm:px-3 rounded-sm border text-xs transition-colors ${
              choice === c ? FILLED[c] : "border-(--border) text-(--muted) hover:text-(--text) hover:border-(--text)"
            }`}
          >
            {LABEL[c]}
          </button>
        ))}
        <button
          type="button"
          aria-label={`${item.title}：${note ? "改" : "加"}備註`}
          aria-expanded={editing}
          onClick={() => setEditing((v) => !v)}
          className={`h-9 sm:h-8 px-2.5 rounded-sm border text-xs transition-colors ${
            editing || note ? "border-(--accent) text-(--accent)" : "border-(--border) text-(--muted) hover:text-(--text)"
          }`}
        >
          備註
        </button>
      </div>
    </li>
  );
}
