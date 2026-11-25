import type { Metadata } from "next";
import type { ReactNode } from "react";

// 站長後台（TODO A1）：不進搜尋、不進 sitemap／llms.txt、公開頁面沒有連結
export const metadata: Metadata = {
  title: { template: "%s · 站長後台", default: "站長後台" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
