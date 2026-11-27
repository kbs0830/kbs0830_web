import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import { notFound } from "next/navigation";
import { EMAIL, HIRE_ENABLED } from "@/lib/site/site";

// 接案頁（TODO E1，2026-11-27；make-money.md 階段一第 1 項）。
// 只寫「這個網站上看得到證據」的服務，每一項都連到做過的東西。
// ⚠️ 沒有寫價位、每週時數、接不接日本的案子：使用者還沒給條件（待辦「接案條件」），價位寫「依需求報價」。
//    他給了條件之後，加在下面「怎麼合作」那一節，不要自己編。
export const metadata: Metadata = withShare({
  title: "接案 · Hire — 私有 AI 小助理、網站、影像辨識 — PINGWEI LI",
  description: "PINGWEI LI 接小型案子：資料不出你家的本地 AI 小助理（Ollama）、Next.js 網站、YOLOv8／ONNX 影像辨識、Python 後端。每一項都連到網站上做過的作品。",
  alternates: { canonical: "/hire" },
});

const link = "text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)";
const mail = `mailto:${EMAIL}?subject=${encodeURIComponent("接案詢問")}`;

function Service({ title, en, children, proof }: { title: string; en: string; children: React.ReactNode; proof: { href: string; label: string }[] }) {
  return (
    <section className="border-t border-(--border) pt-6">
      <h2 className="text-lg font-light text-(--text) font-serif">
        {title} <span className="text-xs text-(--muted) font-mono tracking-wide">· {en}</span>
      </h2>
      <div className="mt-3 space-y-3 text-[15px] sm:text-sm font-light leading-[1.9] sm:leading-relaxed text-(--text)">{children}</div>
      <p className="mt-4 text-xs text-(--muted) font-light">
        做過的：
        {proof.map((p, i) => (
          <span key={p.href}>
            {i > 0 && "、"}
            <Link href={p.href as Route} className={link}>
              {p.label}
            </Link>
          </span>
        ))}
      </p>
    </section>
  );
}

export default function HirePage() {
  if (!HIRE_ENABLED) notFound(); // 先隱藏，見 lib/site/site.ts
  return (
    <PageShell
      eyebrow="Hire"
      title={<>接案 &nbsp;·&nbsp; Hire</>}
      intro="小型、具體的案子：資料不出你家的 AI 小助理、網站、影像辨識。一個人做，所以案子小一點、說清楚一點。"
    >
      <div className="space-y-10">
        <Service
          title="私有 AI 小助理"
          en="Private AI assistant"
          proof={[
            { href: "/ask", label: "問我（現場可以試）" },
            { href: "/blog/local-ai-ollama-gemma-chat-api", label: "在自己的 RTX 3070 上跑 AI" },
            { href: "/blog/local-ai-ask-small-model-knowledge-base", label: "小模型讀網站內容的四個坑" },
          ]}
        >
          <p>
            幫店家、工作室架一個只回答「你們自己的資料」的 AI：商品說明、常見問題、內部文件。模型跑在你自己的電腦上，問題和資料不會送去雲端，也不用付每則訊息的 API 費。
          </p>
          <p>
            做法跟這個網站的 <Link href="/ask" className={link}>/ask</Link> 一樣：先依問題找出相關的內容，再讓模型根據它回答，並附上來源連結。
          </p>
          <p className="text-(--muted)">
            要先說清楚的限制：能在一般顯卡上跑的小模型偶爾會答錯，所以每個答案都附來源，你要不要讓它直接面對客人，我們可以一起評估；系統要跑在你那邊的機器上，需要一張夠用的顯卡。
          </p>
        </Service>

        <Service
          title="網站"
          en="Websites"
          proof={[
            { href: "/projects/kbs0830-web", label: "這個網站" },
            { href: "/colophon", label: "本站構造" },
            { href: "/status", label: "可用率與部署紀錄" },
          ]}
        >
          <p>
            Next.js、React、TypeScript 的網站：作品集、活動頁、小型店家網站。做到會被搜尋引擎讀懂（metadata、sitemap、結構化資料）、手機版好用、載入快。
          </p>
          <p>這個網站自己就是例子：自己架、自己部署、自己監控，出過的事故也寫成了文章。</p>
        </Service>

        <Service
          title="影像辨識與機器學習"
          en="Computer vision & ML"
          proof={[{ href: "/projects/auto-following-robot", label: "自動跟隨機器人（YOLOv8）" }]}
        >
          <p>YOLOv8 物件偵測、ONNX 推論（可以直接在瀏覽器裡跑，不用後端）、資料整理與簡單的分類模型。適合「想先知道這件事做不做得到」的小驗證。</p>
        </Service>

        <Service
          title="Python 後端與 API"
          en="Python backends"
          proof={[{ href: "/developers", label: "這個網站的公開 API 與 MCP" }]}
        >
          <p>FastAPI、Flask 的小型服務、資料處理腳本、把既有流程串起來（排程、寄信、報表）。</p>
        </Service>
      </div>

      <section className="mt-14 border-t border-(--border) pt-8">
        <SectionHeading en="How it works">怎麼合作</SectionHeading>
        <BulletList
          items={[
            "先寫信說你想做什麼、現在怎麼做、希望誰來用",
            "我回覆做不做得到、大概會做到哪裡；價位依需求報價，不先給一個漂亮但不準的數字",
            "先做一個小的、看得到的版本，確認方向對了再往下",
            "交付原始碼跟使用說明，之後你自己也維護得動",
          ]}
        />
        <p className="mt-4 text-xs text-(--muted) font-light">我是學生，時間有限，所以會先確認案子的大小再答應。</p>
      </section>

      <section className="mt-14 border-t border-(--border) pt-8">
        <SectionHeading en="Contact">聯絡</SectionHeading>
        <p className="text-[15px] sm:text-sm font-light leading-[1.9] sm:leading-relaxed text-(--text)">
          寫信到{" "}
          <a href={mail} className={link}>
            {EMAIL}
          </a>
          ，簡單說一下想做什麼就好。也可以先
          <Link href="/ask" className={link}>
            問問小助理
          </Link>
          他做過什麼，或看{" "}
          <Link href="/blog" className={link}>
            技術文章
          </Link>
          。
        </p>
      </section>
    </PageShell>
  );
}
