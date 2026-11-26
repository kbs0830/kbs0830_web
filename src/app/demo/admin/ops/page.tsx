import type { Metadata } from "next";
import AdminView from "@/components/admin/AdminView";
import DemoShell from "@/components/admin/DemoShell";
import { demoOps } from "@/lib/admin/demo-data";

// 訪客參觀 · 維運（TODO G4）：跟 /admin 同一個畫面，資料是範例
export const metadata: Metadata = { title: "維運" };

export default function Page() {
  return (
    <DemoShell title="維運" intro="部署、重啟、告警、備份。">
      <AdminView model={demoOps} />
    </DemoShell>
  );
}
