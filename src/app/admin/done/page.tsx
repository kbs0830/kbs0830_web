import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import DoneList from "@/components/admin/DoneList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { listDone } from "@/lib/admin/db";

// 站長後台 · 完成紀錄（原本的 DONE.md，2026-11-26 搬進 data/admin.db 的 done_log 表）。
// Claude 新增用 `node scripts/admin-db.js done add …`，查用 `done search <關鍵字>`。
export const metadata: Metadata = { title: "完成" };

const intro = "做完的事，新的在上面，可以搜尋、點開看全文。Claude 做完東西直接寫進這裡（不再改 DONE.md）。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="完成" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminDone />
    </Suspense>
  );
}

async function AdminDone() {
  await connection();
  // 只帶日期＋標題；全文點開才抓（/api/admin/done，2026-11-26 使用者：「admin 後台開始卡了」）
  let items: { id: number; day: string | null; title: string }[] = [];
  try {
    items = listDone().map(({ id, day, title }) => ({ id, day, title }));
  } catch {}
  return (
    <AdminShell title="完成" intro={intro}>
      {items.length === 0 ? (
        <p className="text-sm font-light text-(--warn) mb-12">還沒有完成紀錄（done_log 表是空的）。</p>
      ) : (
        <DoneList items={items} />
      )}
    </AdminShell>
  );
}
