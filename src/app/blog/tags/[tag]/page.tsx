import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withShare } from "@/lib/site/share-meta";
import { getAllTags, getPostsByTagSlug } from "@/lib/content/blog";
import TagBadge from "@/components/ui/TagBadge";
import PageShell from "@/components/layout/PageShell";

// 依 tag 列文章（TODO「Tag 頁」，2026-11-09）。網址用 tagSlug()：`Next.js` → /blog/tags/next-js
type TagPageProps = { params: Promise<{ tag: string }> };


// 整頁一定要是靜態（Next 16.4，TODO C13）：清單外的網址會等整頁產生完才回應，notFound() 才會是真的 404（不加的話先串流外殼、狀態碼變 200）；
// 以後有人在這頁加了即時資料，build 會直接失敗
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const found = getPostsByTagSlug(tag);
  if (!found) return {};
  return withShare({
    title: `${found.tag} · 技術部落格 — PINGWEI LI`,
    description: `標記「${found.tag}」的 ${found.posts.length} 篇文章：踩過的坑跟解法。`,
    alternates: { canonical: `/blog/tags/${tag}`, types: { "text/markdown": `/blog/tags/${tag}.md` } },
    // 不建立索引、但連結照跟（2026-11-12 看 Search Console）：tag 頁只是文章清單的子集，內容跟 /blog 重複，
    // 「已檢索 - 尚未建立索引」27 頁裡有一大塊是這種。讓 Google 把力氣花在文章本身；sitemap 也不列
    robots: { index: false, follow: true },
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const found = getPostsByTagSlug(tag);
  if (!found) notFound();

  return (
    <PageShell
      backHref="/blog"
      backLabel="返回部落格"
      eyebrow="Blog · Tag"
      title={found.tag}
      intro={`${found.posts.length} 篇文章`}
    >
      <div className="space-y-10">
        {found.posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <p className="text-xs text-(--muted) tracking-[0.15em] mb-1.5 font-mono">{post.date}</p>
            <h2 className="text-lg font-light text-(--text) group-hover:text-(--accent) transition-colors mb-2">{post.title}</h2>
            <p className="text-sm font-light text-(--muted) leading-relaxed mb-3">{post.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <TagBadge key={t}>{t}</TagBadge>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
