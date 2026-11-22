import type { ReactNode } from "react";
import Link from "next/link";
import BuildInfo from "@/components/ui/BuildInfo";
import { SITE_GROUPS } from "@/lib/site-map";

const small = "text-xs text-(--muted) font-light font-mono";

// 全站頁尾（2026-11-23）：上面是頁面索引（lib/site-map.ts），下面一行版權＋最後更新。
// 首頁跟每個 PageShell 頁都有——之前子頁面只有「← 返回首頁」，/now、/uses、/travel 這些頁沒有站內入口。
// width：首頁對齊 max-w-5xl，子頁對齊 PageShell 的 max-w-2xl。extra：首頁的時鐘／人數／訪客國家（子頁不放，少打幾支 API）。
export default function SiteFooter({ width = "max-w-2xl", extra, className = "" }: { width?: string; extra?: ReactNode; className?: string }) {
  return (
    <footer className={`border-t border-(--border) print:hidden ${className}`}>
      <nav aria-label="網站頁面" className={`${width} mx-auto px-6 pt-12 pb-8 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10`}>
        {SITE_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-4 text-[10px] tracking-[0.25em] uppercase text-(--muted) font-mono">{g.label}</p>
            <ul className="space-y-1">
              {g.pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="group inline-flex items-baseline gap-2 py-1 text-sm font-light text-(--text) hover:text-(--accent) transition-colors">
                    {p.zh}
                    <span className="hidden sm:inline text-[10px] tracking-wider text-(--muted) group-hover:text-(--accent) font-mono transition-colors">{p.en}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {/* 右下角固定的 BackToTop 按鈕（只有首頁有，跟 extra 一起）會壓到最後一行——寬螢幕時在欄位外面，xl 以下右側多留按鈕的寬度 */}
      <div className={`${width} mx-auto pl-6 ${extra ? "pr-20 xl:pr-6" : "pr-6"} pb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className={`${small} tracking-[0.2em]`}>© 2026 PINGWEI LI</p>
          <BuildInfo className={`${small} tracking-[0.1em] hover:text-(--accent) transition-colors`} />
        </div>
        {extra && <div className="flex flex-wrap items-center gap-x-4 gap-y-1">{extra}</div>}
      </div>
    </footer>
  );
}
