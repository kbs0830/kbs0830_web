import type { Metadata } from "next";
import AdminView from "@/components/admin/AdminView";
import DemoShell from "@/components/admin/DemoShell";
import { demoPi } from "@/lib/admin/demo-data";

// 訪客參觀 · 樹莓派（TODO G4）：跟 /admin 同一個畫面，資料是範例
export const metadata: Metadata = { title: "樹莓派" };

export default function Page() {
  return (
    <DemoShell title="樹莓派" intro="自家雷達樹莓派的溫度、CPU、記憶體、供電、記憶卡。每 5 分鐘更新，出問題會寄信。">
      <AdminView model={demoPi} />
    </DemoShell>
  );
}
