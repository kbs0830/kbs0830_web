import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import AdminView from "@/components/admin/AdminView";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { opsModel } from "@/lib/admin/views";

// 站長後台 · 維運（TODO A1）
// 資料在 lib/admin/views.ts、畫面在 AdminView（訪客參觀 /demo/admin 共用同一個畫面，TODO G4）
export const metadata: Metadata = { title: "維運" };

const intro = "部署、重啟、告警、備份。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="維運" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminOps />
    </Suspense>
  );
}

async function AdminOps() {
  await connection();
  return (
    <AdminShell title="維運" intro={intro}>
      <AdminView model={opsModel()} />
    </AdminShell>
  );
}
