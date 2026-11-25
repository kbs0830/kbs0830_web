import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ADMIN_PAGES } from "@/lib/admin/nav";
import AdminShell, { Placeholder } from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";

// 站長後台 · Overview（TODO A1，2026-11-25 先做空殼）
export const metadata: Metadata = { title: "總覽" };

const intro = "網站現在的狀況一眼看完。內容還在做，下面是每一區之後會放什麼。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="總覽" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminOverviewContent />
    </Suspense>
  );
}

async function AdminOverviewContent() {
  return (
    <AdminShell title="總覽" intro={intro}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {ADMIN_PAGES.filter((p) => p.href !== "/admin").map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="block h-full border border-(--border) rounded-sm p-5 hover:border-(--accent) transition-colors">
              <p className="text-base font-light text-(--text)">
                {p.label}
                <span className="ml-2 font-mono text-[11px] tracking-wide text-(--muted)">{p.en}</span>
              </p>
              <p className="mt-1.5 text-[13px] font-light text-(--muted) leading-relaxed">{p.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Placeholder items={["今天訪客／即時線上", "上次部署（成功或失敗＋時間）", "watchdog 最近告警", "雷達在不在線", "下一封週報／月報日期"]} />
      </div>
    </AdminShell>
  );
}
