import { getAllPosts } from "@/lib/blog";
import { markdownToHtml } from "@/lib/md-html";
import { SITE_URL } from "@/lib/site";

// /feed.xml：部落格的 RSS 2.0（TODO「RSS feed」，2026-11-09）。build 時產生，新增文章會自動跟上。
// 2026-11-21 起附全文（TODO A6）：<content:encoded> 放 lib/md-html.ts 轉出來的 HTML，<description> 照舊是摘要。
// 原本只放摘要的理由是「讀者點進來才算得到瀏覽」——取捨後改成讓 RSS 讀者不用點進來也能讀完。
// 作者只寫 PINGWEI LI：RSS 閱讀器會直接顯示這個欄位給人看（CLAUDE.md Key Constraints 1）
export const dynamic = "force-static";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// CDATA 裡不能出現 "]]>"：拆成兩段
const cdata = (html: string) => `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

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
      <content:encoded>${cdata(markdownToHtml(p.content))}</content:encoded>
${p.tags.map((t) => `      <category>${escape(t)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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
