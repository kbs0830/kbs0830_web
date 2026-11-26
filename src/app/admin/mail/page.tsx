import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import AdminView from "@/components/admin/AdminView";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { mailModel } from "@/lib/admin/views";

// 站長後台 · 寄信（TODO A1）。預覽、重寄是寫入類動作，第二步再加（要防 CSRF）
// 資料在 lib/admin/views.ts、畫面在 AdminView（訪客參觀 /demo/admin 共用同一個畫面，TODO G4）
export const metadata: Metadata = { title: "寄信" };

const intro = "週報、月報寄到通知信箱的紀錄。預覽、重寄之後再加。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="寄信" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminMail />
    </Suspense>
  );
}

async function AdminMail() {
  await connection();
  return (
    <AdminShell title="寄信" intro={intro}>
      <AdminView model={mailModel()} />
    </AdminShell>
  );
}
