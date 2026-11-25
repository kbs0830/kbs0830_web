import type { Metadata } from "next";
import { Suspense } from "react";
import AdminShell, { Placeholder } from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";

// 站長後台 · Mail（TODO A1，2026-11-25 先做空殼）
export const metadata: Metadata = { title: "寄信" };

const intro = "週報、月報的寄送紀錄。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="寄信" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminMailContent />
    </Suspense>
  );
}

async function AdminMailContent() {
  return (
    <AdminShell title="寄信" intro={intro}>
      <Placeholder items={["上次寄出、下次預定", "預覽這週的信（report-mail.ps1 -DryRun）", "重寄（第二步再做，要防 CSRF）"]} />
    </AdminShell>
  );
}
