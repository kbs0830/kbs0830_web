import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  getAdjacentPosts,
  getAllPosts,
  getHeadings,
  getPostBySlug,
  getRelatedPosts,
  getSeriesPosts,
  headingId,
  readingMinutes,
  tagSlug,
  type BlogPost,
} from "@/lib/blog";
import SectionHeading from "@/components/ui/SectionHeading";
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

// h2 的純文字（目錄的 id 要跟它一樣）
const textOf = (node: ReactNode): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(textOf).join("")
      : node && typeof node === "object" && "props" in node
        ? textOf((node.props as { children?: ReactNode }).children)
        : "";

const mdxComponents = {
  // id 給目錄跳過來；scroll-mt 留固定導覽列的高度
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2
      id={headingId(textOf(props.children))}
      className="text-xl font-light text-(--text) mt-10 mb-4 font-serif scroll-mt-24"
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
  // Markdown 表格（remark-gfm，2026-11-09）：窄螢幕可以左右滑，不會把整頁撐寬
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto mb-5 -mx-6 sm:mx-0 px-6 sm:px-0">
      <table className="w-full text-[13px] border-collapse" {...props} />
    </div>
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th className="text-left font-normal text-(--muted) border-b border-(--border) py-2 pr-4 whitespace-nowrap" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="font-light text-(--text) border-b border-(--border) py-2 pr-4 align-top" {...props} />
  ),
};

// GFM：表格、刪除線、任務清單、自動連結
const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } };

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const { older, newer } = getAdjacentPosts(post.slug);
  const related = getRelatedPosts(post);
  const series = post.series ? getSeriesPosts(post.series) : [];
  const headings = getHeadings(post.content);

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
          <Link key={tag} href={`/blog/tags/${tagSlug(tag)}`} className="hover:opacity-70 transition-opacity">
            <TagBadge>{tag}</TagBadge>
          </Link>
        ))}
      </div>

      {series.length > 1 && <SeriesBox post={post} posts={series} />}
      {headings.length >= 4 && <Toc headings={headings} />}

      <article>
        <MDXRemote source={post.content} components={mdxComponents} options={mdxOptions} />
      </article>

      <nav aria-label="上一篇／下一篇" className="grid sm:grid-cols-2 gap-4 mt-16 pt-8 border-t border-(--border)">
        {older ? <PostLink post={older} label="← 上一篇" /> : <span />}
        {newer && <PostLink post={newer} label="下一篇 →" className="sm:text-right" />}
      </nav>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading en="Related">相關文章</SectionHeading>
          <ul className="space-y-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <span className="text-[15px] sm:text-sm font-light text-(--text) group-hover:text-(--accent) transition-colors">
                    {p.title}
                  </span>
                  <span className="block text-xs text-(--muted) font-mono mt-0.5">{p.tags.join(" · ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}

function PostLink({ post, label, className = "" }: { post: BlogPost; label: string; className?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`group block ${className}`}>
      <span className="block text-xs text-(--muted) font-mono tracking-wide mb-1">{label}</span>
      <span className="text-[15px] sm:text-sm font-light text-(--text) group-hover:text-(--accent) transition-colors leading-relaxed">
        {post.title}
      </span>
    </Link>
  );
}

// 系列文導覽：放在內文前面，看得出這篇是第幾篇、還有哪幾篇
function SeriesBox({ post, posts }: { post: BlogPost; posts: BlogPost[] }) {
  const n = posts.findIndex((p) => p.slug === post.slug) + 1;
  return (
    <aside className="mb-10 border border-(--border) rounded-sm bg-(--surface) px-5 py-4">
      <p className="text-xs text-(--accent) font-mono tracking-wide mb-3">
        系列「{post.series}」第 {n} 篇，共 {posts.length} 篇
      </p>
      <ol className="space-y-1.5">
        {posts.map((p, i) => (
          <li key={p.slug} className="flex gap-3 text-[13px] leading-relaxed">
            <span className="text-(--muted) font-mono shrink-0">{i + 1}.</span>
            {p.slug === post.slug ? (
              <span className="text-(--text)">{p.title}</span>
            ) : (
              <Link href={`/blog/${p.slug}`} className="text-(--muted) hover:text-(--accent) transition-colors">
                {p.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </aside>
  );
}

// 長文目錄（4 個小標以上才出現）。原生 <details>，零 JS；預設收起來，不擋開頭
function Toc({ headings }: { headings: { text: string; id: string }[] }) {
  return (
    <details className="mb-10 border-l-2 border-(--border) pl-4 group">
      <summary className="cursor-pointer text-xs text-(--muted) font-mono tracking-wide hover:text-(--accent) transition-colors list-none">
        <span className="group-open:hidden">▸</span>
        <span className="hidden group-open:inline">▾</span> 目錄 · Contents（{headings.length}）
      </summary>
      <ol className="mt-3 space-y-1.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="text-[13px] text-(--muted) hover:text-(--accent) transition-colors">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
