import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

// /feed.xml：部落格的 RSS 2.0（TODO「RSS feed」，2026-11-09）。build 時產生，新增文章會自動跟上。
// 只放標題＋摘要＋連結，不放全文：全文是 MDX，轉成乾淨的 HTML 要另外一套 render，
// 而且讀者點進來看才算得到瀏覽、也看得到正確的排版跟程式碼區塊。
// 作者只寫 PINGWEI LI：RSS 閱讀器會直接顯示這個欄位給人看（CLAUDE.md Key Constraints 1）
export const dynamic = "force-static";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// frontmatter 的 date 是 "YYYY-MM-DD"，RSS 要 RFC 822；當作台灣時間的當天早上
const rfc822 = (date: string) => new Date(`${date}T09:00:00+08:00`).toUTCString();

export function GET() {
  const posts = getAllPosts();
  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`;
      return `    <item>
      <title>${escape(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${escape(p.description)}</description>
${p.tags.map((t) => `      <category>${escape(t)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PINGWEI LI · 技術部落格</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>踩過的坑、學到的東西、對某個技術的想法。</description>
    <language>zh-TW</language>
    ${posts[0] ? `<lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
