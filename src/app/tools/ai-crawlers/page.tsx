import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import AiCrawlers from "@/components/tools/AiCrawlers";
import ToolNote from "@/components/tools/ToolNote";
import ToolJsonLd from "@/components/tools/ToolJsonLd";

// AI 爬蟲檢查（TODO J12，2026-11-24）。API：/api/tools/robots（防 SSRF 的做法在 lib/tools/safe-fetch.ts）
export const metadata: Metadata = withShare({
  title: "AI 爬蟲檢查：你的網站有沒有擋 GPTBot、ClaudeBot？ · robots.txt — PINGWEI LI",
  description: "輸入網域，讀它的 robots.txt，看 GPTBot、ClaudeBot、Google-Extended、PerplexityBot 等 AI 爬蟲跟搜尋引擎能不能抓你的網站，順便檢查有沒有 llms.txt。",
  alternates: { canonical: "/tools/ai-crawlers" },
});

export default function AiCrawlersPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · AI Crawlers"
      title={<>AI 爬蟲檢查</>}
      intro="ChatGPT、Claude、Gemini 搜不搜得到你的網站，第一關是 robots.txt。輸入網域，看各家 AI 爬蟲跟搜尋引擎有沒有被擋。"
    >
      <ToolJsonLd href="/tools/ai-crawlers" />
      <Suspense fallback={<div className="min-h-[420px]" />}>
        <AiCrawlers />
      </Suspense>
      <ToolNote href="/tools/ai-crawlers">
        <p>
          判斷照 robots.txt 的標準（RFC 9309）：有寫爬蟲名字的規則優先，沒有才套用 *；這裡只看「首頁能不能抓」，有擋其他路徑就標「部分擋」。
          robots.txt 是君子協定，擋了也只有守規矩的爬蟲會照做；Cloudflare 之類的防火牆另外擋的話，這裡看不出來。
        </p>
        <p>
          由這個網站的伺服器去讀你輸入網域的 robots.txt（不收 IP、不連內網），同一個網域 10 分鐘內只抓一次；不記錄誰查了什麼。
          這個網站自己被哪些 AI 爬蟲讀過，看{" "}
          <Link href="/stats" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            訪客分析
          </Link>
          。
        </p>
      </ToolNote>
    </PageShell>
  );
}
