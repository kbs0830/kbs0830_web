import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import JapanTax from "@/components/tools/JapanTax";
import ToolNote from "@/components/tools/ToolNote";

// 日本消費稅換算（TODO J6，2026-11-24）
export const metadata: Metadata = withShare({
  title: "日本消費稅計算：税抜・税込換算、8% 和 10%、換台幣 · Japan Tax — PINGWEI LI",
  description: "日本標價寫「税抜」到底要付多少？輸入價格，馬上算出含稅、未稅、消費稅（10% 或外帶食品 8%），順便用今天的匯率換成台幣。",
  alternates: { canonical: "/tools/japan-tax" },
});

export default function JapanTaxPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · Japan Tax"
      title={<>日本消費稅換算</>}
      intro="日本標價常常寫「税抜」（未稅），結帳才加 10%。輸入標價，算出實際要付多少，順便換成台幣。"
    >
      <Suspense fallback={<div className="min-h-[360px]" />}>
        <JapanTax />
      </Suspense>
      <ToolNote>
        <p>
          日本消費稅一般 10%；外帶的食品、飲料（不含酒）是 8%（軽減税率），同一家店內用就是 10%。稅額的小數這裡一律捨去，店家的算法可能差 1 日圓。
          外國旅客免稅的規則另外看店家跟現行制度，這裡不算。
        </p>
        <p>
          台幣用今天台銀、玉山日幣現金賣出比較低的那家換算，詳細比價在{" "}
          <Link href="/tools/jpy" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            日幣換匯比價
          </Link>
          。
        </p>
      </ToolNote>
    </PageShell>
  );
}
