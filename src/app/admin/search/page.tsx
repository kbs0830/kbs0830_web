import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { MARK_CLOSE, MARK_OPEN, SEARCH_LABEL, searchAdmin, type SearchHit } from "@/lib/admin/db";

// 站長後台 · 全文搜尋（TODO S4，2026-11-27）：待辦、完成紀錄、操作紀錄一次搜。SQLite FTS5 trigram，中文任意 3 字以上的片段都搜得到；
// 2 字以下退回 LIKE（沒有反白）。資料庫 migration 5 建的 search 表，用 trigger 跟原表同步。CLI：node scripts/admin-db.js search <字>
export const metadata: Metadata = { title: "搜尋" };

const intro = "待辦、完成紀錄、操作紀錄一次搜。中文打 3 個字以上最準，2 個字以下只比對有沒有出現。";

const HREF: Record<SearchHit["src"], Route> = {
  todo: "/admin/todo",
  "todo:done": "/admin/done",
  "todo:dropped": "/admin/todo",
  done: "/admin/done",
  log: "/admin/todo",
};

/** 把 ⟦命中⟧ 換成 <mark> */
function Marked({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${MARK_OPEN}[^${MARK_CLOSE}]*${MARK_CLOSE})`));
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith(MARK_OPEN) ? (
          <mark key={i} className="bg-(--accent-lt) text-(--accent) rounded-sm px-0.5">
            {p.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default function Page(props: { searchParams: Promise<{ q?: string }> }) {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="搜尋" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminSearch {...props} />
    </Suspense>
  );
}

async function AdminSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await connection();
  const q = ((await searchParams).q ?? "").slice(0, 100);
  let hits: SearchHit[] = [];
  try {
    hits = searchAdmin(q);
  } catch {}
  return (
    <AdminShell title="搜尋" intro={intro}>
      <form action="/admin/search" role="search" className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="搜尋待辦、完成紀錄、操作紀錄"
          placeholder="例：住宿紀錄、Search Console、雷達…"
          className="h-10 w-full max-w-md rounded-sm border border-(--border) bg-(--bg) px-3 text-sm text-(--text) placeholder:text-(--muted)"
        />
        <button type="submit" className="h-10 shrink-0 rounded-sm border border-(--border) px-4 text-sm text-(--text) hover:border-(--accent) hover:text-(--accent) transition-colors">
          搜尋
        </button>
      </form>
      {q.trim() === "" ? null : hits.length === 0 ? (
        <p className="text-sm font-light text-(--muted)">找不到「{q}」。</p>
      ) : (
        <>
          <p className="mb-3 font-mono text-xs text-(--muted)">{hits.length >= 40 ? "前 40 筆" : `${hits.length} 筆`}</p>
          <ul className="divide-y divide-(--border) border-y border-(--border)">
            {hits.map((h) => (
              <li key={`${h.src}:${h.ref}`} className="py-3">
                <p className="flex items-baseline gap-2">
                  <span className="shrink-0 rounded-full bg-(--surface) px-2 py-px text-[10px] text-(--muted)">{SEARCH_LABEL[h.src]}</span>
                  <Link href={HREF[h.src]} className="text-sm text-(--text) hover:text-(--accent) transition-colors">
                    <Marked text={h.title} />
                  </Link>
                </p>
                {h.snippet && (
                  <p className="mt-1 text-xs font-light leading-relaxed text-(--muted) [overflow-wrap:anywhere]">
                    <Marked text={h.snippet.replace(/\s+/g, " ")} />
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
