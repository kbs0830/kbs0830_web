import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import { TOOL_PAGES as tools } from "@/lib/site/site-map";

// 小工具總覽（2026-11-24，決策表 J 系列）。清單跟 Ctrl+K 共用 lib/site/site-map.ts 的 TOOL_PAGES（頁尾只放一個「小工具」入口）
export const metadata: Metadata = withShare({
  title: "小工具 · Tools — PINGWEI LI",
  description: "日幣換匯比價、台灣⇄福岡直飛班機、福岡穿搭、機場距離、日本消費稅換算、AI 爬蟲檢查、User-Agent 判斷。免費、不用登入、不存你輸入的東西。",
  alternates: { canonical: "/tools" },
});

export default function ToolsPage() {
  return (
    <PageShell
      eyebrow="Tools"
      title={<>道具 &nbsp;·&nbsp; 小工具</>}
      intro="旅行跟寫程式時自己會用的小工具。"
    >
      <ul className="divide-y divide-(--border) border-y border-(--border)">
        {tools.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="group flex flex-col gap-1 py-5">
              <span className="flex items-baseline gap-3">
                <span className="text-base font-light text-(--text) group-hover:text-(--accent) transition-colors">{t.zh}</span>
                <span className="text-[11px] text-(--muted) font-mono tracking-wider">{t.en}</span>
              </span>
              <span className="text-sm font-light text-(--muted) leading-relaxed">{t.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
