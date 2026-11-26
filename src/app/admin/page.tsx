import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import AdminView from "@/components/admin/AdminView";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { overviewModel } from "@/lib/admin/views";

// 站長後台 · 總覽（TODO A1）
// 資料在 lib/admin/views.ts、畫面在 AdminView（訪客參觀 /demo/admin 共用同一個畫面，TODO G4）
export const metadata: Metadata = { title: "總覽" };

const intro = "網站現在的狀況一眼看完。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="總覽" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminOverview />
    </Suspense>
  );
}

async function AdminOverview() {
  await connection();
  return (
    <AdminShell title="總覽" intro={intro}>
      <AdminView model={overviewModel()} />
    </AdminShell>
  );
}
