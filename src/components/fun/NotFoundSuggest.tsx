"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Result = { title: string; href: string };

// 404 頁的「你是不是要找」（2026-11-27）：把打錯的網址拆成字（/blog/tunnel-dwon → blog tunnel dwon）丟給語意搜尋（/api/search），
// 找得到就列最多 3 個。AI 沒開、沒結果就什麼都不顯示，不影響 404 頁本身。
export default function NotFoundSuggest() {
  const path = usePathname();
  const [found, setFound] = useState<{ path: string; items: Result[] } | null>(null);

  useEffect(() => {
    // 只用最後一段（/blog/tunnel-dwon-four-days → tunnel dwon four days）：前面的 blog、projects 這種分類詞會讓每個都找到一堆不相干的
    const last = decodeURIComponent(path).split("/").filter(Boolean).at(-1) ?? "";
    const words = last.replace(/[_.-]+/g, " ").trim();
    if (words.length < 2) return;
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(words)}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { results?: Result[] }) => setFound({ path, items: (data.results ?? []).slice(0, 3) }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [path]);

  if (found?.path !== path || found.items.length === 0) return null;
  return (
    <nav aria-label="你是不是要找" className="mb-8">
      <p className="mb-2 text-xs tracking-[0.2em] text-(--muted) font-mono">你是不是要找 · Did you mean</p>
      <ul className="space-y-1">
        {found.items.map((r) => (
          <li key={r.href}>
            <Link href={r.href as Route} className="text-sm font-light text-(--accent) underline underline-offset-4 hover:opacity-70 transition-opacity">
              {r.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
