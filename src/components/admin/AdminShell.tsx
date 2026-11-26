import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import PageShell from "@/components/layout/PageShell";
import AdminNav from "@/components/admin/AdminNav";
import { whoIsAdmin } from "@/lib/admin/auth";
import { logAdminVisit } from "@/lib/admin/login-log";

// 後台每一頁的外框：PageShell（compact：手機一打開就看到內容）＋分頁列。頁面裡再驗一次門禁（proxy.ts 是第一道）。
// 讀 headers() 是即時資料，所以呼叫端要包在 <Suspense> 裡（照 /radar 的寫法）；fallback 用 <PageShell compact …>。
export default async function AdminShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  const h = await headers();
  const who = await whoIsAdmin(h);
  if (!who) notFound();
  // 登入紀錄（TODO G3）：回應送出去之後才寫資料庫
  after(() => logAdminVisit(who, h));
  return (
    <PageShell compact backHref="/" backLabel="回網站" eyebrow="站長後台 · Admin" title={title} intro={intro}>
      <AdminNav />
      {children}
    </PageShell>
  );
}

/** 後台的狀態色（globals.css 的 --ok／--warn／--later，只在後台用） */
export type Tone = "ok" | "warn" | "info" | "muted";
export const TONE_TEXT: Record<Tone, string> = {
  ok: "text-(--ok)",
  warn: "text-(--warn)",
  info: "text-(--accent)",
  muted: "text-(--text)",
};
const TONE_BAR: Record<Tone, string> = {
  ok: "before:bg-(--ok)",
  warn: "before:bg-(--warn)",
  info: "before:bg-(--accent)",
  muted: "before:bg-(--border)",
};

/** 後台的數字格：比公開頁的 Tiles 緊湊，左邊一條狀態色。手機 2 欄、桌機 4 欄 */
export function AdminTiles({ items }: { items: { label: string; value: ReactNode; tone?: Tone; sub?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
      {items.map(({ label, value, tone = "muted", sub }) => (
        <div
          key={label}
          className={`relative bg-(--surface) rounded-sm pl-4 pr-3 py-3 flex flex-col-reverse overflow-hidden before:absolute before:left-0 before:inset-y-0 before:w-[3px] ${TONE_BAR[tone]}`}
        >
          <dt className="text-[11px] text-(--muted) tracking-wide">{label}</dt>
          <dd className={`font-mono text-base sm:text-lg leading-tight mb-1 ${TONE_TEXT[tone]}`}>
            {value}
            {sub && <span className="block text-[11px] text-(--muted) mt-0.5">{sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** 後台的區塊標題：小、帶數量，不用公開頁那種大的雙語標題 */
export function AdminSection({ title, en, count, children }: { title: string; en?: string; count?: number; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="flex items-baseline gap-2 mb-2 text-sm text-(--text)">
        {title}
        {en && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-(--muted)">{en}</span>}
        {count !== undefined && <span className="ml-auto font-mono text-[11px] text-(--muted)">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

/** 還沒做的區塊：虛線框＋說明這裡之後放什麼 */
export function Placeholder({ items }: { items: string[] }) {
  return (
    <div className="border border-dashed border-(--border) rounded-sm p-6">
      <p className="font-mono text-[11px] tracking-[0.2em] text-(--muted) mb-3">準備中 · Coming soon</p>
      <ul className="space-y-1.5 text-sm font-light text-(--muted)">
        {items.map((t) => (
          <li key={t}>▸ {t}</li>
        ))}
      </ul>
    </div>
  );
}
