import type { Metadata } from "next";
import { Suspense } from "react";
import AdminShell, { Placeholder } from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";

// 站長後台 · Reports（TODO A1，2026-11-25 先做空殼）
export const metadata: Metadata = { title: "報表" };

const intro = "日報、週報、月報。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="報表" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminReportsContent />
    </Suspense>
  );
}

async function AdminReportsContent() {
  return (
    <AdminShell title="報表" intro={intro}>
      <Placeholder items={["現在的 /reports 搬進來，舊網址 308 轉過來", "Search Console 搜尋字詞（目前只在週報信裡）"]} />
    </AdminShell>
  );
}
