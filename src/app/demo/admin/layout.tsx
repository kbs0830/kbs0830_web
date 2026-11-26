import type { Metadata } from "next";
import type { ReactNode } from "react";

// 站長後台的訪客參觀（TODO G4，2026-11-26）：公開、不用登入，資料全是 lib/admin/demo-data.ts 的範例。
// 範例資料不需要被搜尋到：noindex、不進 sitemap（入口在 Cloudflare 登入頁下方、/colophon）
export const metadata: Metadata = {
  title: { template: "%s · 後台參觀", default: "後台參觀" },
  robots: { index: false, follow: true },
};

export default function DemoAdminLayout({ children }: { children: ReactNode }) {
  return children;
}
