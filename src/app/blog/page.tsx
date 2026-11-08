import type { Metadata } from "next";
import { withShare } from "@/lib/share-meta";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import TagBadge from "@/components/ui/TagBadge";
import PageShell from "@/components/ui/PageShell";

export const metadata: Metadata = withShare({
  title: "技術部落格 · Blog — PINGWEI LI",
  description: "踩過的坑、學到的東西、對某個技術的想法。",
  alternates: { canonical: "/blog", types: { "text/markdown": "/blog.md", "application/rss+xml": "/feed.xml" } },
});

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PageShell eyebrow="Blog" title={<>技術部落格 &nbsp;·&nbsp; 筆記</>} intro="踩過的坑、學到的東西、對某個技術的想法。">

      <p className="-mt-10 mb-12 text-xs text-(--muted) font-mono tracking-wide">
        {/* 一般 <a>：/feed.xml 是 route handler 回的 XML，不是頁面，不要讓 Link 去 prefetch／client 換頁 */}
        <a href="/feed.xml" className="hover:text-(--accent) transition-colors">RSS 訂閱 · Feed</a>
      </p>

      <div className="space-y-10">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <p className="text-xs text-(--muted) tracking-[0.15em] mb-1.5 font-mono">
              {post.date}
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
