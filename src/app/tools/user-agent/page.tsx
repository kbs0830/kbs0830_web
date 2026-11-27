import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import UserAgentCheck from "@/components/tools/UserAgentCheck";
import ToolNote from "@/components/tools/ToolNote";
import { AI_BOTS, SEARCH_BOTS } from "../../../../scripts/lib/bot-patterns.js";
import ToolJsonLd from "@/components/tools/ToolJsonLd";

// 這個 User-Agent 是爬蟲嗎？（TODO J13，2026-11-24）
export const metadata: Metadata = withShare({
  title: "User-Agent 判斷：這是 AI 爬蟲、搜尋引擎還是真人？ · UA Check — PINGWEI LI",
  description: "貼上一串 User-Agent，判斷是一般瀏覽器、Google／Bing 搜尋引擎、GPTBot／ClaudeBot 這類 AI 爬蟲，還是其他機器人。在瀏覽器裡判斷，不會送出你貼的內容。",
  alternates: { canonical: "/tools/user-agent" },
});

export default function UserAgentPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · User-Agent"
      title={<>這個 User-Agent 是爬蟲嗎</>}
      intro="伺服器 log 裡看到一串看不懂的 User-Agent？貼進來判斷是誰。預設帶入你現在這個瀏覽器的。"
    >
      <ToolJsonLd href="/tools/user-agent" />
      <UserAgentCheck />
      <ToolNote href="/tools/user-agent">
        <p>
          規則跟這個網站自己的流量統計是同一套（在{" "}
          <Link href="/stats" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            訪客分析
          </Link>
          {" "}的「未過濾流量」看得到每種爬蟲來了幾次）：先比 AI 爬蟲名單，再比搜尋引擎，最後看是不是正常瀏覽器的格式。
        </p>
        <p>
          認得的 AI 爬蟲（{AI_BOTS.length} 個）：<span className="font-mono">{AI_BOTS.join("、")}</span>
        </p>
        <p>
          認得的搜尋引擎（{SEARCH_BOTS.length} 個）：<span className="font-mono">{SEARCH_BOTS.join("、")}</span>
        </p>
      </ToolNote>
    </PageShell>
  );
}
