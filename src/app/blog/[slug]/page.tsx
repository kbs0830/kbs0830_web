import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug, readingMinutes } from "@/lib/blog";
import { PERSON_ID, SITE_URL } from "@/lib/site";
import TagBadge from "@/components/ui/TagBadge";
import JsonLd from "@/components/ui/JsonLd";
import PageShell from "@/components/ui/PageShell";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — PINGWEI LI`,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
      types: { "text/markdown": `/blog/${post.slug}.md`, "application/rss+xml": "/feed.xml" },
    },
    // 沒寫的話會整個繼承 layout 的 openGraph，分享出去標題是「PINGWEI LI — Portfolio」。
    // 圖片不用寫：同資料夾的 opengraph-image.tsx 會自動掛上（twitter 卡片也沿用它）
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["PINGWEI LI"],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

const mdxComponents = {
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="text-xl font-light text-(--text) mt-10 mb-4 font-serif"
      {...props}
    />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-base font-normal text-(--text) mt-8 mb-3" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="text-[15px] sm:text-sm font-light text-(--text) leading-[1.9] sm:leading-relaxed mb-5 sm:mb-4" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="space-y-2 mb-4 pl-1" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => (
    <li className="flex items-start gap-3 text-[15px] sm:text-sm leading-[1.8] sm:leading-normal font-light text-(--text)">
      <span className="text-(--accent) mt-0.5 shrink-0" aria-hidden>▸</span>
      <span {...props} />
    </li>
  ),
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code
      className="text-[13px] px-1.5 py-0.5 rounded-sm bg-(--surface) border border-(--border) font-mono"
      {...props}
    />
  ),
  pre: (props: React.ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="text-[12.5px] sm:text-[13px] leading-relaxed p-4 -mx-6 sm:mx-0 rounded-none sm:rounded-sm border-y sm:border-x bg-(--surface) border-(--border) overflow-x-auto mb-5 [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 font-mono"
      {...props}
    />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-medium text-(--accent)" {...props} />
  ),
  // 站外連結開新分頁；站內（/blog/… 互相引用）照常在同一頁換過去
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a
      className="text-(--accent) underline decoration-(--border) underline-offset-2 hover:decoration-(--accent) transition-colors"
      {...(props.href?.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      {...props}
    />
  ),
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <PageShell backHref="/blog" backLabel="返回部落格">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          url: `${SITE_URL}/blog/${post.slug}`,
          author: { "@type": "Person", "@id": PERSON_ID, name: "PINGWEI LI", url: SITE_URL },
        }}
      />

      <p className="text-xs text-(--muted) tracking-[0.15em] mt-10 mb-4 font-mono">
        {post.date} · 約 {readingMinutes(post.content)} 分鐘
      </p>
      <h1 className="text-2xl sm:text-3xl font-light text-(--text) mb-4 leading-snug font-serif">
        {post.title}
      </h1>
      <p className="text-sm font-light text-(--muted) mb-6">{post.titleEn}</p>

      <div className="flex flex-wrap gap-1.5 mb-12">
        {post.tags.map((tag) => (
          <TagBadge key={tag}>{tag}</TagBadge>
        ))}
      </div>

      <article>
        <MDXRemote source={post.content} components={mdxComponents} />
      </article>
    </PageShell>
  );
}
