import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import AdminView from "@/components/admin/AdminView";
import NotMeToggle from "@/components/stats/NotMeToggle";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { trafficModel } from "@/lib/admin/views";

// 站長後台 · 流量（TODO A1）：公開的 /stats 看不到的細節（未過濾流量、爬蟲、404），資料跟週報同一份 buildReport
// 資料在 lib/admin/views.ts、畫面在 AdminView（訪客參觀 /demo/admin 共用同一個畫面，TODO G4）
export const metadata: Metadata = { title: "流量" };

const intro = "這週（週一起）公開的 /stats 看不到的細節：未過濾流量、爬蟲、404。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="流量" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminTraffic />
    </Suspense>
  );
}

async function AdminTraffic() {
  await connection();
  return (
    <AdminShell title="流量" intro={intro}>
      <AdminView model={trafficModel()} />
      <section className="mt-12 mb-4">
        <SectionHeading en="Exclude this browser">不計入自己</SectionHeading>
        <NotMeToggle />
      </section>
    </AdminShell>
  );
}
