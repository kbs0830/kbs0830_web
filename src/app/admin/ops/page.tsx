import type { Metadata } from "next";
import { Suspense } from "react";
import AdminShell, { Placeholder } from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";

// 站長後台 · Ops（TODO A1，2026-11-25 先做空殼）
export const metadata: Metadata = { title: "維運" };

const intro = "部署、排程、告警。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="維運" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminOpsContent />
    </Suspense>
  );
}

async function AdminOpsContent() {
  return (
    <AdminShell title="維運" intro={intro}>
      <Placeholder items={["最近 20 次部署（成功／失敗／退回、花多久）", "排程工作狀態（NextJS、Cloudflared、Runner、Watchdog）", "watchdog 告警歷史", "備份最後時間"]} />
    </AdminShell>
  );
}
