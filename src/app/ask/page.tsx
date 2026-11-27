import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import AskChat from "@/components/ask/AskChat";

// 「問我」AI 助理（TODO H1，2026-11-27）。後端 /api/chat、知識庫 lib/ai/（細節在 kbs-integrations 技能）
export const metadata: Metadata = withShare({
  title: "問我 · Ask — 用站上的作品與文章回答的 AI 小助理 — PINGWEI LI",
  description: "跑在站長自己桌機 RTX 3070 上的本地 AI 小助理（Gemma 3 4B）：問他做過哪些專案、會什麼技術，根據網站的作品與文章回答，並附上來源連結。",
  alternates: { canonical: "/ask" },
});

const link = "text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)";

export default function AskPage() {
  return (
    <PageShell
      eyebrow="Ask"
      title={<>問我 &nbsp;·&nbsp; Ask</>}
      intro="想知道他做過什麼、會什麼，直接問。小助理只根據這個網站公開的作品與文章回答，並附上來源。"
    >
      <AskChat />
      <div className="mt-16 space-y-2 text-xs text-(--muted) font-light leading-relaxed">
        <p>
          這個小助理是 Google 的 Gemma 3（4B）模型，跑在站長自己的桌機上（RTX 3070），問題不會送去雲端；對話只留在這個畫面，不會儲存。
          小模型偶爾會答錯，以來源連結裡的內容為準。
        </p>
        <p>
          想聯絡或合作，請看{" "}
          <Link href="/#contact" className={link}>
            Contact
          </Link>
          。怎麼做的：
          <Link href="/blog/local-ai-ollama-gemma-chat-api" className={link}>
            在自己的 RTX 3070 上跑網站 AI 小助理
          </Link>
          。
        </p>
      </div>
    </PageShell>
  );
}
