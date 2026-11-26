import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/content/blog";
import TagBadge from "@/components/ui/TagBadge";
import PageShell from "@/components/layout/PageShell";
import BlogSearch from "@/components/content/BlogSearch";

export const metadata: Metadata = withShare({
  title: "記事 · 技術部落格 — PINGWEI LI",
  description: "踩過的坑都寫下來，下次就不用再踩一次。",
  alternates: { canonical: "/blog", types: { "text/markdown": "/blog.md", "application/rss+xml": "/feed.xml" } },
});

export default function BlogIndexPage() {
  const posts = getAllPosts();
  // 2026-11-26（TODO N6）：導覽列、首頁區塊、這頁統一叫「記事 · Notes」；<title> 留「技術部落格」給搜尋

  return (
    <PageShell eyebrow="Blog" title={<>記事 &nbsp;·&nbsp; Notes</>} intro="踩過的坑都寫下來，下次就不用再踩一次。">

      {/* 2026-11-25 拿掉「RSS 訂閱 · Feed」連結（使用者沒有要做訂閱功能）。/feed.xml 還在，只寫在 <head> 給搜尋引擎、AI 抓；
          原本這行 -mt-10＋mb-12 跟下面的 -mt-6 剛好抵銷，拿掉後下面改 mt-0，位置不變 */}
      <nav aria-label="依標籤瀏覽" className="flex flex-wrap gap-x-4 gap-y-2 mb-12 text-xs font-mono">
        {getAllTags().map((t) => (
          <Link key={t.slug} href={`/blog/tags/${t.slug}`} className="text-(--muted) hover:text-(--accent) transition-colors">
            #{t.tag} <span>{t.count}</span>
          </Link>
        ))}
      </nav>

      <BlogSearch />

      <div className="space-y-10">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <p className="text-xs text-(--muted) tracking-[0.15em] mb-1.5 font-mono">
              {post.date}
              {post.series && <span className="text-(--accent)"> · 系列「{post.series}」{post.seriesOrder}</span>}
            </p>
            <h2 className="text-lg font-light text-(--text) group-hover:text-(--accent) transition-colors mb-2">
              {post.title}
            </h2>
            <p className="text-sm font-light text-(--muted) leading-relaxed mb-3">
              {post.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <TagBadge key={tag}>{tag}</TagBadge>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
