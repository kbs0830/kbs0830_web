import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import PageShell from "@/components/layout/PageShell";
import AdminNav from "@/components/admin/AdminNav";
import { whoIsAdmin, type AdminIdentity } from "@/lib/admin/auth";
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
      <LoginBar who={who} />
      <AdminNav />
      {children}
    </PageShell>
  );
}

/**
 * 現在是怎麼登入的＋登出（2026-11-26，使用者：「我沒辦法登出呀」）。
 * Cloudflare 登入：/cdn-cgi/access/logout（Cloudflare 自己的網址，會撤銷整個 Access 登入，所有 app 一起；Cloudflare 文件
 * session-management「Log out as a user」）。用 <a> 不用 <Link>：要整頁跳到 Cloudflare，不是站內換頁。
 * 家裡網路、桌機本機本來就沒登入這回事，只顯示是哪一種。
 */
function LoginBar({ who }: { who: AdminIdentity }) {
  return (
    <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--muted)">
      <span aria-hidden className={`size-1.5 rounded-full ${who.via === "access" ? "bg-(--ok)" : "bg-(--accent)"}`} />
      {who.via === "access" ? (
        <>
          <span>已登入 {who.email}</span>
          <a
            href="/cdn-cgi/access/logout"
            className="ml-auto inline-flex items-center h-8 px-3 rounded-full border border-(--border) text-(--text) hover:border-(--warn) hover:text-(--warn) transition-colors"
          >
            登出
          </a>
        </>
      ) : (
        <span>{who.via === "ip" ? "家裡網路（免登入）" : "桌機本機（免登入）"}，不用登出</span>
      )}
    </p>
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
