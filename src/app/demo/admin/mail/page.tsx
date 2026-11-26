import type { Metadata } from "next";
import AdminView from "@/components/admin/AdminView";
import DemoShell from "@/components/admin/DemoShell";
import { demoMail } from "@/lib/admin/demo-data";

// 訪客參觀 · 寄信（TODO G4）：跟 /admin 同一個畫面，資料是範例
export const metadata: Metadata = { title: "寄信" };

export default function Page() {
  return (
    <DemoShell title="寄信" intro="週報、月報寄到通知信箱的紀錄。">
      <AdminView model={demoMail} />
    </DemoShell>
  );
}
