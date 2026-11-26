import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import AdminView from "@/components/admin/AdminView";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { piModel } from "@/lib/admin/pi-health";

// 站長後台 · 樹莓派（2026-11-26）：自家雷達樹莓派的健康。資料在 lib/admin/pi-health.ts、畫面在 AdminView（訪客參觀共用）
export const metadata: Metadata = { title: "樹莓派" };

const intro = "自家雷達樹莓派的溫度、CPU、記憶體、供電、記憶卡。每 5 分鐘更新，出問題會寄信。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="樹莓派" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminPi />
    </Suspense>
  );
}

async function AdminPi() {
  await connection();
  return (
    <AdminShell title="樹莓派" intro={intro}>
      <AdminView model={piModel()} />
    </AdminShell>
  );
}
