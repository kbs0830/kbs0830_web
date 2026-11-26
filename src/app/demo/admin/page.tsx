import type { Metadata } from "next";
import AdminView from "@/components/admin/AdminView";
import DemoShell from "@/components/admin/DemoShell";
import { demoOverview } from "@/lib/admin/demo-data";

// 訪客參觀 · 總覽（TODO G4）：跟 /admin 同一個畫面，資料是範例
export const metadata: Metadata = { title: "總覽" };

export default function Page() {
  return (
    <DemoShell title="總覽" intro="網站現在的狀況一眼看完。">
      <AdminView model={demoOverview} />
    </DemoShell>
  );
}
