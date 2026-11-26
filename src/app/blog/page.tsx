import type { Metadata } from "next";
import { ViewTransition } from "react";
import { withShare } from "@/lib/site/share-meta";
import Link from "next/link";
import { getAllPosts, getAllTags, getSeriesPosts, type BlogPost } from "@/lib/content/blog";
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
  // 列表項目：一般文章一筆；系列文在「系列裡最新的那篇」出現的位置變成一張系列卡，其他篇不再單獨列
  const seen = new Set<string>();
  const entries = posts.flatMap((post): ({ kind: "post"; post: BlogPost } | { kind: "series"; name: string; posts: BlogPost[] })[] => {
    if (!post.series) return [{ kind: "post", post }];
    if (seen.has(post.series)) return [];
    seen.add(post.series);
    return [{ kind: "series", name: post.series, posts: getSeriesPosts(post.series) }];
  });
  // 2026-11-26（TODO N6）：導覽列、首頁區塊、這頁統一叫「記事 · Notes」；<title> 留「技術部落格」給搜尋

  return (
    <PageShell eyebrow="Blog" title={<>記事 &nbsp;·&nbsp; Notes</>} intro="踩過的坑都寫下來，下次就不用再踩一次。">

      {/* 2026-11-25 拿掉「RSS 訂閱 · Feed」連結（使用者沒有要做訂閱功能）。/feed.xml 還在，只寫在 <head> 給搜尋引擎、AI 抓；
          原本這行 -mt-10＋mb-12 跟下面的 -mt-6 剛好抵銷，拿掉後下面改 mt-0，位置不變 */}
      {/* 標籤連結 py-1 -my-1：點擊範圍 16→24px（TODO M12），行距不變 */}
      <nav aria-label="依標籤瀏覽" className="flex flex-wrap gap-x-4 gap-y-2 mb-12 text-xs font-mono">
        {getAllTags().map((t) => (
          <Link key={t.slug} href={`/blog/tags/${t.slug}`} className="inline-block py-1 -my-1 text-(--muted) hover:text-(--accent) transition-colors">
            #{t.tag} <span>{t.count}</span>
          </Link>
        ))}
      </nav>

      <BlogSearch />

      {/* 2026-11-26（TODO M10，使用者選 B）：系列文合成一張「系列卡」，放在系列最新一篇的位置，點開才列篇目（照 1、2、3… 的順序）。
          之前 5 篇散在列表裡，同一天的順序還亂掉（2、5、3、4），看不出要從哪篇讀起 */}
      <div className="space-y-10">
        {entries.map((e) =>
          e.kind === "series" ? (
            <SeriesCard key={`series-${e.name}`} name={e.name} posts={e.posts} />
          ) : (
            <PostItem key={e.post.slug} post={e.post} />
          ),
        )}
      </div>
    </PageShell>
  );
}

function PostItem({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <p className="text-xs text-(--muted) tracking-[0.15em] mb-1.5 font-mono">
        {post.date}
      </p>
      {/* O3（2026-11-26）：點進文章時標題 morph 到文章頁的 <h1>，跟作品卡→作品頁同一套 */}
      <ViewTransition name={`post-title-${post.slug}`} share="morph" default="none">
        <h2 className="text-lg font-light text-(--text) group-hover:text-(--accent) transition-colors mb-2">{post.title}</h2>
      </ViewTransition>
      <p className="text-sm font-light text-(--muted) leading-relaxed mb-3">
        {post.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <TagBadge key={tag}>{tag}</TagBadge>
        ))}
      </div>
    </Link>
  );
}

function SeriesCard({ name, posts }: { name: string; posts: BlogPost[] }) {
  const first = posts[0];
  const last = posts.at(-1)!;
  return (
    <details className="group border border-(--border) rounded-sm bg-(--surface) px-5 py-5">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <p className="text-xs text-(--muted) tracking-[0.15em] mb-1.5 font-mono">
          {first.date === last.date ? last.date : `${first.date} – ${last.date}`}
          <span className="text-(--accent)"> · 系列 · Series</span>
        </p>
        <h2 className="text-lg font-light text-(--text) group-hover:text-(--accent) transition-colors mb-2">
          「{name}」系列，共 {posts.length} 篇
        </h2>
        <p className="text-sm font-light text-(--muted) leading-relaxed">
          從第 1 篇「{first.title}」開始照順序讀最完整。
          <span className="ml-2 text-xs text-(--accent) font-mono whitespace-nowrap">
            <span className="group-open:hidden">展開篇目 ▾</span>
            <span className="hidden group-open:inline">收合 ▴</span>
          </span>
        </p>
      </summary>
      <ol className="mt-5 pt-4 border-t border-(--border) space-y-3">
        {posts.map((p, i) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group/item flex gap-3 py-1 -my-1">
              <span className="text-xs text-(--muted) font-mono shrink-0 w-5 pt-0.5">{i + 1}.</span>
              <span className="min-w-0">
                <ViewTransition name={`post-title-${p.slug}`} share="morph" default="none">
                  <span className="block text-[15px] font-light text-(--text) group-hover/item:text-(--accent) transition-colors leading-relaxed">{p.title}</span>
                </ViewTransition>
                <span className="block text-xs text-(--muted) font-mono mt-0.5">{p.date}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </details>
  );
}
