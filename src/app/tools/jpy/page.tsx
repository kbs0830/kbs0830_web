import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import JpyExchange from "@/components/tools/JpyExchange";
import ToolNote from "@/components/tools/ToolNote";

// 日幣換匯比價（TODO J1，2026-11-24）。頁面本身靜態，牌價由 client 讀 /api/jpy-rate（10 分鐘快取）
export const metadata: Metadata = withShare({
  title: "日幣換匯比價：台銀、玉山今天哪家划算 · JPY — PINGWEI LI",
  description: "輸入要換的台幣，馬上算出台灣銀行、玉山銀行換現鈔或換到外幣帳戶各能拿到多少日圓，還有現在的匯率在近 90 天裡算便宜還是貴。",
  alternates: { canonical: "/tools/jpy" },
});

export default function JpyToolPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · JPY"
      title={<>日幣換匯比價</>}
      intro="輸入要換的台幣，比較台灣銀行、玉山銀行今天的日幣牌價。網址會記住金額，可以直接分享。"
    >
      <Suspense fallback={<div className="min-h-[480px]" />}>
        <JpyExchange />
      </Suspense>
      <ToolNote>
        <p>
          牌價是銀行公告的「本行賣出」（你跟銀行買日幣的價格），10 分鐘更新一次；走勢是 Yahoo Finance 的市場中價，用來看現在算便宜還是貴，不是銀行牌價。
          實際換匯以銀行櫃台、網銀當下的價格為準。
        </p>
        <p>
          這個工具是我的課程專題「
          <Link href="/projects/yen-rate-analyzer" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            日圓匯率分析系統
          </Link>
          」的線上版：原作品爬 6 家銀行，網站版只放抓得到的台銀（官方 CSV）跟玉山。
        </p>
      </ToolNote>
    </PageShell>
  );
}
