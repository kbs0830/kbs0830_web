"use client";
import { useState } from "react";
import type { Choice, Decision } from "@/lib/admin/db";
import type { TodoItem } from "@/lib/admin/todo";

// 後台的決策表（TODO G1）：TODO.md 每一項選「先做／之後／不做」＋備註，存進 data/admin.db。
// 再按一次同一個選項＝取消。備註離開輸入框或按 Enter 才存。存失敗退回原本的值並顯示錯誤。
const LABEL: Record<Choice, string> = { now: "先做", later: "之後", skip: "不做" };
const SIZE_LABEL = { L: "大", M: "中", S: "小" } as const;
type Filter = "all" | "none" | Choice;
type State = Record<string, { choice: Choice | null; note: string }>;
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
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const ids = new Set(items.map((i) => i.id));
  const orphans = Object.entries(state).filter(([id]) => !ids.has(id));
  const choiceOf = (id: string) => state[id]?.choice ?? null;
  const count = (f: Filter) => items.filter((i) => match(f, choiceOf(i.id))).length;

  async function save(id: string, next: { choice: Choice | null; note: string }) {
    const prev = state[id];
    setState((s) => ({ ...s, [id]: next }));
    setError(null);
    try {
      await post(id, next.choice, next.note);
      if (!next.choice && !next.note.trim()) setState((s) => without(s, id));
      setSavedId(id);
    } catch (e) {
      setState((s) => (prev ? { ...s, [id]: prev } : without(s, id)));
      setError(`沒存到（${e instanceof Error ? e.message : "連線失敗"}），已經退回原本的選擇。`);
    }
  }

  const visible = items.filter((i) => match(filter, choiceOf(i.id)));
  const groups = Map.groupBy(visible, (i) => (i.group ? `${i.section} · ${i.group}` : i.section));

  return (
    <div>
      <div role="group" aria-label="篩選" className="filter-scroll flex gap-2 overflow-x-auto -mx-6 px-6 pb-1 sm:flex-wrap sm:mx-0 sm:px-0 mb-8">
        {(["all", "none", "now", "later", "skip"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`shrink-0 px-3 py-1.5 text-xs font-light rounded-sm border transition-colors ${
              filter === f
                ? "text-(--accent) border-(--accent) bg-(--accent-lt)"
                : "text-(--muted) border-(--border) bg-(--surface) hover:border-(--accent) hover:text-(--accent)"
            }`}
          >
            {f === "all" ? "全部" : f === "none" ? "還沒決定" : LABEL[f]}
            <span className="ml-1.5 font-mono tabular-nums">{count(f)}</span>
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className={`min-h-5 mb-4 text-sm font-light ${error ? "text-(--warn)" : "text-(--muted)"}`}>
        {error ?? (savedId ? "已存。" : "")}
      </p>

      {visible.length === 0 && <p className="text-sm font-light text-(--muted)">這個分類沒有項目。</p>}

      {[...groups].map(([name, list]) => (
        <section key={name} className="mb-12">
          <h2 className="font-serif text-base mb-3 text-(--text)">{name}</h2>
          <ul className="border-y border-(--border) divide-y divide-(--border)">
            {list.map((item) => (
              <Row key={item.id} item={item} value={state[item.id]} justSaved={savedId === item.id} onSave={(v) => save(item.id, v)} />
            ))}
          </ul>
        </section>
      ))}

      {orphans.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-base mb-1 text-(--text)">TODO.md 裡已經找不到的</h2>
          <p className="text-xs font-light text-(--muted) mb-3">做完搬到 DONE.md、或改了標題的項目。確認不需要就清掉。</p>
          <ul className="border-y border-(--border) divide-y divide-(--border)">
            {orphans.map(([id, v]) => (
              <li key={id} className="py-3 flex items-center justify-between gap-4 text-sm font-light">
                <span>
                  <span className="font-mono text-xs text-(--muted) mr-2">{id.replace(/^t:/, "")}</span>
                  {v.choice ? LABEL[v.choice] : "—"}
                  {v.note && <span className="text-(--muted)"> · {v.note}</span>}
                </span>
                <button type="button" onClick={() => save(id, { choice: null, note: "" })} className="shrink-0 text-xs text-(--muted) hover:text-(--accent) underline underline-offset-4">
                  清掉
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function match(f: Filter, c: Choice | null) {
  return f === "all" || (f === "none" ? c === null : c === f);
}

function Row({
  item,
  value,
  justSaved,
  onSave,
}: {
  item: TodoItem;
  value: { choice: Choice | null; note: string } | undefined;
  justSaved: boolean;
  onSave: (v: { choice: Choice | null; note: string }) => void;
}) {
  const choice = value?.choice ?? null;
  const note = value?.note ?? "";
  const [draft, setDraft] = useState(note);
  const commitNote = () => {
    if (draft.trim() !== note.trim()) onSave({ choice, note: draft });
  };
  const titleId = `todo-${item.id.replace(/[^\w-]/g, "_")}`;

  return (
    <li className="py-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:gap-6">
      <div className="min-w-0">
        <p id={titleId} className="text-sm text-(--text)">
          {item.code && <span className="font-mono text-xs text-(--muted) mr-2">{item.code}</span>}
          {item.title}
          {item.size && <span className="ml-2 font-mono text-[10px] text-(--muted)">{SIZE_LABEL[item.size]}</span>}
          {item.needsYou && <span className="ml-1.5 text-[10px] text-(--muted)" title="要你動手或提供東西">要你</span>}
          {item.recommended && <span className="ml-1.5 text-[10px] text-(--accent)" title="Claude 推薦">推薦</span>}
        </p>
        {item.summary && <p className="mt-1 text-xs font-light text-(--muted) line-clamp-2">{item.summary}</p>}
        <input
          type="text"
          value={draft}
          maxLength={1000}
          placeholder="備註"
          aria-label={`${item.title} 的備註`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          className="mt-2 w-full bg-transparent border-b border-(--border) focus:border-(--accent) outline-none py-1 text-xs font-light text-(--text) placeholder:text-(--muted)"
        />
      </div>
      <div role="group" aria-labelledby={titleId} className="flex self-start justify-self-start rounded-sm border border-(--border) overflow-hidden">
        {(["now", "later", "skip"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={choice === c}
            onClick={() => onSave({ choice: choice === c ? null : c, note: draft })}
            className={`px-3.5 py-2 sm:py-1.5 text-xs transition-colors border-l first:border-l-0 border-(--border) ${
              choice === c ? "bg-(--accent) text-(--bg)" : "text-(--muted) hover:text-(--accent) bg-(--surface)"
            }`}
          >
            {LABEL[c]}
          </button>
        ))}
        <span className="sr-only">{justSaved ? "已存" : ""}</span>
      </div>
    </li>
  );
}
