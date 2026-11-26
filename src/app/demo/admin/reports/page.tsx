import type { Metadata } from "next";
import { Placeholder } from "@/components/admin/AdminShell";
import DemoShell from "@/components/admin/DemoShell";

// 訪客參觀 · 報表（TODO G4）：真的後台這頁也還在做
export const metadata: Metadata = { title: "報表" };

export default function Page() {
  return (
    <DemoShell title="報表" intro="日報、週報、月報。">
      <Placeholder items={["日報／週報／月報的網頁版（準備中）", "Search Console 搜尋字詞（準備中）"]} />
    </DemoShell>
  );
}
