import type { Metadata } from "next";
import { Suspense } from "react";
import AdminShell, { Placeholder } from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";

// 站長後台 · Traffic（TODO A1，2026-11-25 先做空殼）
export const metadata: Metadata = { title: "流量" };

const intro = "公開的 /stats 看不到的細節。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="流量" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminTrafficContent />
    </Suspense>
  );
}

async function AdminTrafficContent() {
  return (
    <AdminShell title="流量" intro={intro}>
      <Placeholder items={["未過濾流量：瀏覽器／AI 爬蟲／搜尋引擎／其他機器人", "404 清單（哪些網址被打、從哪來）", "來源細節、熱門頁面"]} />
    </AdminShell>
  );
}
