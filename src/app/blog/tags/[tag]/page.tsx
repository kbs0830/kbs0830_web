import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withShare } from "@/lib/share-meta";
import { getAllTags, getPostsByTagSlug } from "@/lib/blog";
import TagBadge from "@/components/ui/TagBadge";
import PageShell from "@/components/ui/PageShell";

// 依 tag 列文章（TODO「Tag 頁」，2026-11-09）。網址用 tagSlug()：`Next.js` → /blog/tags/next-js
type TagPageProps = { params: Promise<{ tag: string }> };

export const dynamicParams = false;

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
