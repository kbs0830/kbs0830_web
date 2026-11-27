import type { Route } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/content/blog";
import { postsForTool, toolsForPost } from "@/lib/site/related";
import { TOOL_PAGES } from "@/lib/site/site-map";

// 文章 ↔ 工具互相連結的那一塊（TODO V8，2026-11-27）。對應表在 lib/site/related.ts。沒有對應就什麼都不顯示。
// 樣式沿用文章頁「下一篇」那種細框卡片，不新增設計。列印不印。

function Block({ label, items }: { label: string; items: { href: Route; title: string; sub?: string }[] }) {
  if (items.length === 0) return null;
  return (
    <aside className="mt-12 print:hidden">
      <p className="mb-3 text-[10px] tracking-[0.25em] uppercase text-(--muted) font-mono">{label}</p>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="group block border border-(--border) rounded-sm bg-(--surface) px-4 py-3 hover:border-(--accent) transition-colors"
            >
              <span className="text-[15px] sm:text-sm font-light text-(--text) group-hover:text-(--accent) transition-colors">{it.title}</span>
              {it.sub && <span className="block mt-0.5 text-xs font-light text-(--muted) leading-relaxed">{it.sub}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** 文章頁：這篇相關的工具 */
export function RelatedTools({ slug }: { slug: string }) {
  const items = toolsForPost(slug).flatMap((href) => {
    const t = TOOL_PAGES.find((p) => p.href === href);
    return t ? [{ href, title: `${t.zh} · ${t.en}`, sub: t.desc }] : [];
  });
  return <Block label="相關工具 · Related tools" items={items} />;
}

/** 工具頁：寫過這個工具背後的故事的文章 */
export function RelatedPostsForTool({ href }: { href: string }) {
  const bySlug = new Map(getAllPosts().map((p) => [p.slug, p]));
  const items = postsForTool(href).flatMap((slug) => {
    const p = bySlug.get(slug);
    return p ? [{ href: `/blog/${p.slug}` as Route, title: p.title, sub: p.description }] : [];
  });
  return <Block label="相關記事 · Related posts" items={items} />;
}
