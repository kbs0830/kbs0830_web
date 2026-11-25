import Link from "next/link";
import { SITE_GROUPS } from "@/lib/site/site-map";

// 全站頁面目錄（手機選單用）：每組「小標＋連結橫排換行」，點擊高度約 40px。
// 2026-11-24 使用者：「手機版多利用右上角選單做收納，重點顯示，剩下收起來」——
// 手機上頁尾不再列頁面，全部收進右上角選單（首頁 NavBar 的抽屜、子頁面的 PageMenu 共用這一份）
export default function SiteIndex({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-4">
      {SITE_GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-0.5 text-[10px] tracking-[0.25em] uppercase text-(--muted) font-mono">{g.label}</p>
          <ul className="flex flex-wrap gap-x-5">
            {g.pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} onClick={onNavigate} className="inline-block py-2 text-[15px] font-light text-(--text) hover:text-(--accent) transition-colors">
                  {p.zh}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
