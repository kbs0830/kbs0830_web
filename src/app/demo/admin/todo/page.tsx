import type { Metadata } from "next";
import DecisionTable from "@/components/admin/DecisionTable";
import DemoShell from "@/components/admin/DemoShell";
import { demoDecisions, demoTodos } from "@/lib/admin/demo-data";

// 訪客參觀 · 待辦（TODO G4）：決策表可以按，但只在瀏覽器裡變（demo 模式不打 API）
export const metadata: Metadata = { title: "待辦" };

export default function Page() {
  return (
    <DemoShell title="待辦" intro="每一項選先做／之後／不做，點「完整說明」看細節。">
      <DecisionTable items={demoTodos} decisions={demoDecisions} demo />
    </DemoShell>
  );
}
