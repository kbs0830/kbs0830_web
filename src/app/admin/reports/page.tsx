import type { Metadata } from "next";
import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ReportsView from "@/components/admin/ReportsView";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";

// 站長後台 · 報表（TODO G8，2026-11-26）：日報／週報／月報，從公開的 /reports 搬進來（舊網址回 404）。
// 內容在 components/admin/ReportsView.tsx；週報、月報另外寄信（scripts/report-mail.ps1），日報只在這裡看。
export const metadata: Metadata = { title: "報表" };

const intro = "日報、週報、月報：訪客、流量、維運、雷達、機場。週報、月報另外寄信。";

export default function Page(props: { searchParams: Promise<{ p?: string; d?: string }> }) {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="報表" intro={intro}><LoadingBlock label="產生報表中…" minHeight={1400} /></PageShell>}>
      <AdminReports {...props} />
    </Suspense>
  );
}

function AdminReports(props: { searchParams: Promise<{ p?: string; d?: string }> }) {
  return (
    <AdminShell title="報表" intro={intro}>
      <ReportsView {...props} />
    </AdminShell>
  );
}
