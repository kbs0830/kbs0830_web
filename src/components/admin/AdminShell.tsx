import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import AdminNav from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/admin/auth";

// 後台每一頁的外框：PageShell＋分頁列。頁面裡再驗一次門禁（proxy.ts 是第一道）。
// 讀 headers() 是即時資料，所以呼叫端要包在 <Suspense> 裡（照 /radar 的寫法）。
export default async function AdminShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  if (!(await isAdmin(await headers()))) notFound();
  return (
    <PageShell backHref="/" backLabel="回網站" eyebrow="站長後台 · Admin" title={title} intro={intro}>
      <AdminNav />
      {children}
    </PageShell>
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
