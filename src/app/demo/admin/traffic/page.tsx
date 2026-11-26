import type { Metadata } from "next";
import AdminView from "@/components/admin/AdminView";
import DemoShell from "@/components/admin/DemoShell";
import { demoTraffic } from "@/lib/admin/demo-data";

// 訪客參觀 · 流量（TODO G4）：跟 /admin 同一個畫面，資料是範例
export const metadata: Metadata = { title: "流量" };

export default function Page() {
  return (
    <DemoShell title="流量" intro="公開的 /stats 看不到的細節：未過濾流量、爬蟲、404。">
      <AdminView model={demoTraffic} />
    </DemoShell>
  );
}
