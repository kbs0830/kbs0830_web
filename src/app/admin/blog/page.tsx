import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import BlogReview from "@/components/admin/BlogReview";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { listDrafts } from "@/lib/admin/blog-drafts";

// 站長後台 · 部落格專區（2026-11-28，使用者：「部落格的審核不要在 todo 裡面，後台要有一個 blog 專區」）。
// Claude 寫好的草稿在 content/drafts/（不進 git、不上線）；這裡看全文、核准或退回、留備註。
// 核准後 Claude 用 `node scripts/admin-db.js blog` 讀到，搬進 content/blog/ 改日期、push。訪客參觀（/demo/admin）看不到。
export const metadata: Metadata = { title: "部落格" };

const intro = "Claude 寫好、還沒上線的文章草稿。看完按「核准」就會被發布，不想上線按「退回」，備註會被讀到。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="部落格" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminBlog />
    </Suspense>
  );
}

async function AdminBlog() {
  await connection();
  return (
    <AdminShell title="部落格" intro={intro}>
      <BlogReview drafts={listDrafts()} />
    </AdminShell>
  );
}
