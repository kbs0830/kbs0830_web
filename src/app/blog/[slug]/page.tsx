import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

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
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

const mdxComponents = {
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="text-xl font-light text-(--text) mt-10 mb-4"
      style={{ fontFamily: "var(--font-serif)" }}
      {...props}
    />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-base font-normal text-(--text) mt-8 mb-3" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="text-sm font-light text-(--text) leading-relaxed mb-4" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="space-y-2 mb-4 pl-1" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => (
    <li className="flex items-start gap-3 text-sm font-light text-(--text)">
      <span className="text-(--accent) mt-0.5 shrink-0">▸</span>
      <span {...props} />
    </li>
  ),
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code
      className="text-[13px] px-1.5 py-0.5 rounded-sm bg-(--surface) border border-(--border)"
      style={{ fontFamily: "var(--font-mono)" }}
      {...props}
    />
  ),
  pre: (props: React.ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="text-[13px] p-4 rounded-sm bg-(--surface) border border-(--border) overflow-x-auto mb-5 [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0"
      style={{ fontFamily: "var(--font-mono)" }}
      {...props}
    />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-medium text-(--accent)" {...props} />
  ),
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a
      className="text-(--accent) underline decoration-(--border) underline-offset-2 hover:decoration-(--accent) transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-(--bg) px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← 返回部落格
        </Link>

        <p
          className="text-xs text-(--muted) tracking-[0.15em] mt-10 mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {post.date}
        </p>
        <h1
          className="text-2xl sm:text-3xl font-light text-(--text) mb-4 leading-snug"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {post.title}
        </h1>
        <p className="text-sm font-light text-(--muted) mb-6">{post.titleEn}</p>

        <div className="flex flex-wrap gap-1.5 mb-12">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[11px] font-light text-(--muted) bg-(--surface) border border-(--border) rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <article>
          <MDXRemote source={post.content} components={mdxComponents} />
        </article>
      </div>
    </div>
  );
}
