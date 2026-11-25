"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { searchPosts, type IndexedPost, type SearchHit } from "@/lib/content/blog-search";

// /blog 的全文搜尋框（TODO A6，2026-11-21）。第一次聚焦才下載索引（/blog/search-index.json，build 時產生），之後在瀏覽器裡比對。
// 沒有 JS 時整塊不出現（initial hidden），文章清單照常可以用。
export default function BlogSearch() {
  const wrap = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<IndexedPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const loading = useRef<AbortController | null>(null);

  useEffect(() => {
    wrap.current?.removeAttribute("hidden");
    return () => loading.current?.abort();
  }, []);

  const load = async () => {
    if (index || loading.current) return;
    const ctrl = new AbortController();
    loading.current = ctrl;
    try {
      const res = await fetch("/blog/search-index.json", { signal: ctrl.signal });
      setIndex(await res.json());
    } catch (e) {
      if ((e as Error).name !== "AbortError") setFailed(true);
    }
  };

  const hits: SearchHit[] = index && query.trim() ? searchPosts(index, query) : [];
  const searching = query.trim().length > 0;

  return (
    <div ref={wrap} hidden className="mb-12 -mt-4">
      <label htmlFor="blog-search" className="sr-only">
        搜尋文章
      </label>
      <input
        id="blog-search"
        type="search"
        value={query}
        onFocus={load}
        onChange={(e) => {
          setQuery(e.target.value);
          load();
        }}
        placeholder="搜尋文章（標題、內文、指令…）"
        autoComplete="off"
        className="w-full bg-transparent border-b border-(--border) focus:border-(--accent) outline-none py-2 text-sm font-light text-(--text) placeholder:text-(--muted) transition-colors"
      />
      <p aria-live="polite" className="text-xs text-(--muted) font-mono mt-2 min-h-4">
        {searching && (failed ? "搜尋索引載入失敗" : !index ? "載入中…" : `${hits.length} 篇`)}
      </p>
      {hits.length > 0 && (
        <ul className="mt-3 divide-y divide-(--border) border-y border-(--border)">
          {hits.map((h) => (
            <li key={h.slug}>
              <Link href={`/blog/${h.slug}`} className="group block py-3">
                <span className="text-[15px] sm:text-sm font-light text-(--text) group-hover:text-(--accent) transition-colors">{h.title}</span>
                {h.snippet && (
                  <span className="block text-xs text-(--muted) font-light mt-1 leading-relaxed">
                    {h.snippet.before}
                    <mark className="bg-(--accent-lt) text-(--text) rounded-xs px-0.5">{h.snippet.match}</mark>
                    {h.snippet.after}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
