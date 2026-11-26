import type { ReactNode } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import AdminNav from "@/components/admin/AdminNav";

// 站長後台的「訪客參觀」外框（TODO G4，2026-11-26，使用者：「多一個訪客參觀按鈕，裡面只有參考的 DATA」）。
// 跟 AdminShell 長一樣，但不驗身分、分頁連到 /demo/admin/*，上面一條提示「這是範例資料」。
// 資料全部來自 lib/admin/demo-data.ts，不讀 data/、不碰資料庫。
export default function DemoShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <PageShell compact backHref="/" backLabel="回網站" eyebrow="站長後台 · 訪客參觀" title={title} intro={intro}>
      <p className="mb-4 rounded-sm border border-(--later) bg-(--later-lt) px-3 py-2 text-xs leading-relaxed text-(--text)">
        <span className="font-medium text-(--later)">訪客參觀模式</span>　這裡的數字跟待辦都是<strong className="font-medium">範例資料</strong>，
        按鈕可以按，但不會存。真正的後台要站長登入才看得到。
        <Link href="/colophon" className="ml-1 text-(--accent) underline underline-offset-2">這個網站怎麼做的 →</Link>
      </p>
      <AdminNav base="/demo/admin" />
      {children}
    </PageShell>
  );
}
