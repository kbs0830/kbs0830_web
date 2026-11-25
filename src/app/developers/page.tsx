import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { API_BASE, API_ENDPOINTS } from "@/lib/api/public-api";
import { TOOLS } from "@/lib/api/mcp";
import { SITE_URL } from "@/lib/site/site";

// 開發者頁（TODO A9＋A10，2026-11-21）：公開 JSON API（/api/v1）跟 MCP 伺服器（/mcp）的說明。靜態頁，有 Markdown 版。
export const metadata: Metadata = withShare({
  title: "開發者 · API & MCP — PINGWEI LI",
  description: "這個網站的公開唯讀 JSON API（OpenAPI 3.1）跟 MCP 伺服器：作品、文章、現況、飛行紀錄，AI 助理可以直接查。",
  alternates: { canonical: "/developers", types: { "text/markdown": "/developers.md" } },
}, { ownImage: true });


const code = "block text-[12.5px] leading-relaxed p-4 rounded-sm border border-(--border) bg-(--surface) overflow-x-auto font-mono whitespace-pre";
const link = "text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)";

export default function DevelopersPage() {
  return (
    <PageShell
      eyebrow="Developers"
      title={<>開發者 &nbsp;·&nbsp; API &amp; MCP</>}
      intro="網站上的作品、文章、現況，也可以用程式讀：一組公開的 JSON API，跟一個給 AI 助理用的 MCP 伺服器。全部唯讀、不用金鑰，內容就是網站上公開的那些。"
    >
      <section className="mb-14">
        <SectionHeading en="JSON API">公開 API</SectionHeading>
        <p className="text-sm font-light text-(--text) leading-relaxed mb-4">
          基礎網址 <code className="font-mono text-[13px]">{API_BASE}</code>。回傳 JSON、允許任何網域讀（CORS）、快取一小時。
          跟網頁同一份資料，網站更新它就更新。
        </p>
        <ul className="divide-y divide-(--border) border-y border-(--border) mb-5">
          {API_ENDPOINTS.map(([path, desc]) => (
            <li key={path} className="py-2.5 grid sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-0.5">
              {path.includes("{") ? (
                <code className="font-mono text-[13px] text-(--text)">{path}</code>
              ) : (
                <a href={`${API_BASE}${path}`} className={`font-mono text-[13px] ${link}`}>
                  {path}
                </a>
              )}
              <span className="text-[13px] font-light text-(--muted)">{desc}</span>
            </li>
          ))}
        </ul>
        <code className={code}>{`curl ${API_BASE}/projects/foodlens-advisor`}</code>
        <p className="text-xs text-(--muted) font-light mt-3">
          欄位定義看{" "}
          <a href={`${API_BASE}/openapi.json`} className={link}>
            openapi.json
          </a>
          ；丟進 Swagger UI、Postman 之類的工具就能直接試。
        </p>
      </section>

      <section className="mb-14">
        <SectionHeading en="MCP server">給 AI 助理：MCP 伺服器</SectionHeading>
        <p className="text-sm font-light text-(--text) leading-relaxed mb-4">
          MCP（Model Context Protocol）讓 Claude、ChatGPT 這類 AI 助理可以直接呼叫工具查資料。把這個網址加進去，就可以直接問它「PINGWEI LI 做過哪些
          Python 的作品？」「最新一篇文章在講什麼？」。
        </p>
        <code className={code}>{`${SITE_URL}/mcp`}</code>
        <p className="text-xs text-(--muted) font-light mt-3 mb-4">Streamable HTTP，不用登入、不用金鑰。</p>
        <p className="text-[13px] font-light text-(--text) mb-2">Claude Code：</p>
        <code className={code}>{`claude mcp add --transport http kbs0830 ${SITE_URL}/mcp`}</code>
        <p className="text-[13px] font-light text-(--text) mt-4 mb-6">
          Claude（網頁版／桌面版）：設定 → 連接器 → 新增自訂連接器，貼上上面的網址。
        </p>
        <p className="text-[13px] font-light text-(--text) mb-2">工具：</p>
        <ul className="divide-y divide-(--border) border-y border-(--border)">
          {TOOLS.map((t) => (
            <li key={t.name} className="py-2.5 grid sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-0.5">
              <code className="font-mono text-[13px] text-(--text)">{t.name}</code>
              <span className="text-[13px] font-light text-(--muted)">{t.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading en="Notes">說明</SectionHeading>
        <ul className="space-y-2 text-[13px] font-light text-(--text) leading-relaxed">
          <li>▸ 只有網站上本來就公開的內容：不會有聯絡資料以外的個人資訊、日期細節或統計原始資料。</li>
          <li>▸ 這是自家桌機架的個人網站，沒有 SLA；網站本身的狀態看 <Link href="/status" className={link}>維運狀態</Link>。</li>
          <li>▸ 給 AI 讀的其他格式：<a href="/llms.txt" className={link}>/llms.txt</a>、每一頁網址後面加 <code className="font-mono">.md</code> 就是 Markdown 版。</li>
        </ul>
      </section>
    </PageShell>
  );
}
