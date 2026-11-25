import type { ReactNode } from "react";
import FooterNavLink from "@/components/layout/FooterNavLink";
import BuildInfo from "@/components/live/BuildInfo";
import { SITE_GROUPS } from "@/lib/site/site-map";

const small = "text-xs text-(--muted) font-light font-mono";

// 版權年份（TODO F10）：網站 2026 年開站；之後用 build 時那個 commit 的年份，明年自動變「2026–2027」
const FIRST_YEAR = 2026;
const buildYear = new Date(process.env.BUILD_COMMIT_TIME || Date.now()).getFullYear();
const years = buildYear > FIRST_YEAR ? `${FIRST_YEAR}–${buildYear}` : String(FIRST_YEAR);

// 全站頁尾（2026-11-23）：上面是頁面索引（lib/site/site-map.ts），下面是版權＋最後更新（首頁多一塊即時資訊 extra）。
//
// 2026-11-24 手機重新設計（使用者：「頁尾排版要再想想，手機版 UI 設計很重要」）：
//   - 頁面索引只在 640px 以上顯示（三欄）；手機收進右上角選單（SiteIndex，使用者：「多利用右上角選單做收納」）
//   - 首頁即時資訊（時鐘／人數／造訪／Cloudflare）在手機自成一塊、放在版權上面，每一項各自一行，不擠成一團
//   - 版權＋最後更新永遠在最底下
// inset：首頁的區塊是「max-w-5xl 裡面 px-6」，子頁面（PageShell）是「外層 px-6、裡面 max-w-2xl」——
//   頁尾照各自的頁面走，左緣才會跟內文對齊（之前子頁面一律用首頁那種，頁尾比內文多縮 24px，TODO F3）
export default function SiteFooter({
  width = "max-w-2xl",
  inset = "outer",
  extra,
  className = "",
}: {
  width?: string;
  inset?: "inner" | "outer";
  extra?: ReactNode;
  className?: string;
}) {
  const box = inset === "inner" ? `${width} mx-auto px-6` : `${width} mx-auto`;
  return (
    <footer className={`border-t border-(--border) print:hidden ${inset === "outer" ? "px-6" : ""} ${className}`}>
      <nav aria-label="網站頁面" className={`${box} hidden sm:grid pt-12 pb-8 grid-cols-3 gap-x-6 gap-y-10`}>
        {SITE_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-4 text-[10px] tracking-[0.25em] uppercase text-(--muted) font-mono">{g.label}</p>
            <ul className="space-y-1">
              {g.pages.map((p) => (
                <li key={p.href}>
                  <FooterNavLink href={p.href}>
                    {p.zh}
                    <span className="text-[10px] tracking-wider text-(--muted) group-hover:text-(--accent) font-mono transition-colors">{p.en}</span>
                  </FooterNavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {/* 右下角固定的 ↑ 按鈕會壓到最後幾行——xl 以下右側多留按鈕的寬度，寬螢幕時按鈕在欄位外面 */}
      <div className={`${box} ${inset === "inner" ? "sm:pr-20 xl:pr-6" : "sm:pr-14 xl:pr-0"} pt-8 sm:pt-0 pb-8 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-x-4 gap-y-2`}>
        {extra && (
          <div className="flex flex-col gap-2 pb-5 mb-3 border-b border-(--border) sm:order-last sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 sm:p-0 sm:m-0 sm:border-0">
            {extra}
          </div>
        )}
        <div className="pr-12 sm:pr-0 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          <p className={`${small} tracking-[0.2em]`}>© {years} PINGWEI LI</p>
          <BuildInfo className={`${small} tracking-[0.1em] hover:text-(--accent) transition-colors`} />
        </div>
      </div>
    </footer>
  );
}
