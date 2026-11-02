import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import Eyebrow from "@/components/ui/Eyebrow";
import TagBadge from "@/components/ui/TagBadge";
import PageShell from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "技術部落格 · Blog — PINGWEI LI",
  description: "踩過的坑、學到的東西、對某個技術的想法。",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PageShell>
      <Eyebrow className="mt-10 mb-4">Blog</Eyebrow>
      <h1 className="text-3xl sm:text-4xl font-light text-(--text) mb-4 font-serif">
        技術部落格 &nbsp;·&nbsp; 筆記
      </h1>
      <p className="text-sm font-light text-(--muted) mb-14 leading-relaxed">
        踩過的坑、學到的東西、對某個技術的想法。
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
