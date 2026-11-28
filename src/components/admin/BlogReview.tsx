"use client";

import { useState } from "react";
import MiniMarkdown from "@/components/admin/MiniMarkdown";
import type { Draft, ReviewStatus } from "@/lib/admin/blog-drafts";

// 部落格草稿審批清單（/admin/blog）：標題＋摘要，點「看全文」展開；核准／退回／改回待審＋備註，存在 data/admin.db。
const LABEL: Record<ReviewStatus, string> = { pending: "待審", approved: "已核准", rejected: "已退回" };
const TONE: Record<ReviewStatus, string> = { pending: "text-(--muted)", approved: "text-(--accent)", rejected: "text-(--warn)" };
const twDate = (t: number) => new Date(t + 8 * 3600_000).toISOString().slice(5, 16).replace("T", " ").replace("-", "/");

async function save(slug: string, status: ReviewStatus, note: string) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch("/api/admin/blog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, status, note }), signal: ac.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

export default function BlogReview({ drafts }: { drafts: Draft[] }) {
  if (drafts.length === 0) return <p className="text-sm text-(--muted) font-light">目前沒有草稿。Claude 解決完有意思的事會寫在這裡等你審。</p>;
  return (
    <ul className="divide-y divide-(--border) border-y border-(--border)">
      {drafts.map((d) => (
        <Item key={d.slug} d={d} />
      ))}
    </ul>
  );
}

function Item({ d }: { d: Draft }) {
  const [status, setStatus] = useState(d.status);
  const [note, setNote] = useState(d.note);
  const [saved, setSaved] = useState(d.note);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply(next: ReviewStatus) {
    setBusy(true);
    setMsg(null);
    try {
      await save(d.slug, next, note);
      setStatus(next);
      setSaved(note);
      setMsg("已存");
    } catch {
      setMsg("沒存到，再按一次");
    } finally {
      setBusy(false);
    }
  }

  const btn = "px-3 py-1.5 text-xs border rounded-full transition-colors disabled:opacity-50";
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`text-xs font-mono ${TONE[status]}`}>{LABEL[status]}</span>
        <h2 className="text-base font-light text-(--text) font-serif wrap-anywhere min-w-0 flex-1">{d.title}</h2>
        <span className="text-[11px] font-mono text-(--muted)">
          {d.slug} · {twDate(d.modifiedAt)} · {[...d.body].length} 字
        </span>
      </div>
      {d.description && <p className="mt-2 text-sm font-light text-(--muted) leading-relaxed">{d.description}</p>}
      {d.tags.length > 0 && <p className="mt-1 text-[11px] font-mono text-(--muted)">{d.tags.join(" · ")}</p>}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-(--accent)">看全文</summary>
        <div className="mt-3 p-4 bg-(--surface) rounded-sm text-sm font-light leading-relaxed">
          <MiniMarkdown text={d.body} />
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy || status === "approved"} onClick={() => apply("approved")} className={`${btn} border-(--accent) text-(--accent) hover:bg-(--accent-light)`}>
          核准發布
        </button>
        <button type="button" disabled={busy || status === "rejected"} onClick={() => apply("rejected")} className={`${btn} border-(--border) text-(--text) hover:border-(--warn)`}>
          退回
        </button>
        {status !== "pending" && (
          <button type="button" disabled={busy} onClick={() => apply("pending")} className={`${btn} border-(--border) text-(--muted)`}>
            改回待審
          </button>
        )}
        {msg && (
          <span className="text-xs text-(--muted)" role="status">
            {msg}
          </span>
        )}
      </div>
      <label className="mt-3 block">
        <span className="sr-only">給 Claude 的備註</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== saved && apply(status)}
          maxLength={1000}
          placeholder="備註（要改哪裡、哪段不要放…），離開欄位自動存"
          className="w-full px-3 py-2 text-sm font-light bg-transparent border border-(--border) rounded-sm text-(--text) placeholder:text-(--muted) focus:border-(--accent) outline-none"
        />
      </label>
    </li>
  );
}
