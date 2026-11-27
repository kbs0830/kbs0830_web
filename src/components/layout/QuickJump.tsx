"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Route } from "next";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { SearchIcon } from "@/components/ui/icons";
import { OPEN_QUICK_JUMP, PAGE_ITEMS, matchItems, type JumpItem } from "@/lib/site/site-map";

type Index = { projects: JumpItem[]; posts: JumpItem[] };

// 全站快速跳轉（2026-11-23）：Ctrl+K／⌘K，或 NavBar／PageShell 的搜尋按鈕（送 OPEN_QUICK_JUMP 事件）。
// 掛在 layout，每一頁都能用。頁面清單編在 client 裡（lib/site/site-map.ts）；作品、文章第一次打開才下載 /jump-index.json。
// 結果是一般的 <Link>（可以中鍵開新分頁）；↑↓ 只是移動高亮，Enter 等於點那一個連結。
export default function QuickJump() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<Index | null>(null);
  const [failed, setFailed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const loading = useRef<AbortController | null>(null);

  useEffect(() => {
    const show = () => {
      setQuery("");
      setActive(0);
      setOpen(true);
      if (loading.current) return;
      const ctrl = new AbortController();
      loading.current = ctrl;
      fetch("/jump-index.json", { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data: Index) => setIndex(data))
        .catch((e: Error) => {
          if (e.name === "AbortError") return;
          setFailed(true);
          loading.current = null; // 下次打開再試一次
        });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "k") return;
      // 終端機、快捷鍵說明這些別的彈窗開著時不疊上去
      const other = document.querySelector("dialog[open]:not(.quick-jump)");
      if (other) return;
      e.preventDefault();
      if (document.querySelector("dialog.quick-jump[open]")) setOpen(false);
      else show();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_QUICK_JUMP, show);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_QUICK_JUMP, show);
      loading.current?.abort();
    };
  }, []);

  const searching = query.trim().length > 0;
  const pages = matchItems(PAGE_ITEMS, query);
  const projects = searching && index ? matchItems(index.projects, query) : [];
  const posts = searching && index ? matchItems(index.posts, query) : [];
  const literal = pages.length + projects.length + posts.length;
  const term = query.trim();

  // 語意搜尋（TODO H5）：字面比對找不到幾個結果時，停下打字 0.5 秒後問本機 AI 的 embedding（/api/search）。
  // 結果連同它回答的字一起存，字改了舊結果就不顯示（不用在 effect 裡同步清空 state）
  const [semantic, setSemantic] = useState<{ q: string; items: JumpItem[] } | null>(null);
  const wantSemantic = open && term.length >= 2 && literal < 3 && (index !== null || failed);
  useEffect(() => {
    if (!wantSemantic) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data: { results?: { title: string; href: string }[] }) =>
          setSemantic({ q: term, items: (data.results ?? []).map((r) => ({ ...r, sub: "語意相關" })) }),
        )
        .catch(() => {}); // AI 沒開或被限流：安靜地只顯示字面結果
    }, 500);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [wantSemantic, term]);
  const shown = new Set([...pages, ...projects, ...posts].map((i) => i.href));
  const related = wantSemantic && semantic?.q === term ? semantic.items.filter((i) => !shown.has(i.href)) : [];

  const groups = [
    { label: "頁面 · Pages", items: pages },
    // 沒輸入時只列頁面，清單不會一打開就很長
    { label: "作品 · Work", items: projects },
    { label: "文章 · Blog", items: posts },
    { label: "相關 · Related（AI）", items: related },
  ];
  const sections: { label: string; items: JumpItem[]; start: number }[] = [];
  let total = 0;
  for (const g of groups) {
    sections.push({ ...g, start: total });
    total += g.items.length;
  }
  const current = Math.min(active, Math.max(total - 1, 0));

  const close = () => setOpen(false);

  const linkAt = (i: number) => listRef.current?.querySelector<HTMLAnchorElement>(`[data-index="${i}"]`);

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      linkAt(current)?.click();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (total === 0) return;
    const next = (current + (e.key === "ArrowDown" ? 1 : -1) + total) % total;
    setActive(next);
    linkAt(next)?.scrollIntoView({ block: "nearest" });
  };

  const status = failed && searching
    ? "作品、文章清單載入失敗，只搜尋頁面"
    : searching && !index
      ? "載入作品、文章中…"
      : searching
        ? total === 0 ? (wantSemantic && semantic?.q !== term ? "沒有字面符合，AI 找相關內容中…" : "沒有符合的結果") : `${total} 筆`
        : "輸入關鍵字也會搜尋作品跟文章";

  return (
    <Modal
      open={open}
      onClose={close}
      label="快速跳轉"
      className="quick-jump w-[calc(100%-2rem)] max-w-lg mt-[12svh]"
    >
      <div className="border border-(--border) rounded-sm bg-(--surface) overflow-hidden">
        {/* 焦點提示改成這條底線變靛藍：全站 :focus-visible 的外框（沒包 layer，outline-none 蓋不掉）框在輸入框上很擠，用 inline style 關掉 */}
        <div className="flex items-center gap-3 px-4 border-b border-(--border) focus-within:border-(--accent) transition-colors">
          <SearchIcon className="shrink-0 text-(--muted)" />
          {open && (
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              aria-label="搜尋頁面、作品、文章"
              placeholder="要去哪裡？頁面、作品、文章…"
              autoComplete="off"
              enterKeyHint="go"
              style={{ outline: "none" }}
              className="w-full bg-transparent py-4 text-[15px] sm:text-sm font-light text-(--text) placeholder:text-(--muted)"
            />
          )}
          <kbd className="hidden pointer-fine:inline shrink-0 px-1.5 py-0.5 text-[10px] text-(--muted) border border-(--border) rounded-sm font-mono">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[min(60svh,28rem)] overflow-y-auto overscroll-contain py-2">
          {sections.map(
            (s) =>
              s.items.length > 0 && (
                <section key={s.label} aria-label={s.label}>
                  <p className="px-4 pt-3 pb-1 text-[10px] tracking-[0.25em] uppercase text-(--muted) font-mono">{s.label}</p>
                  <ul>
                    {s.items.map((item, j) => {
                      const i = s.start + j;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href as Route}
                            data-index={i}
                            onClick={close}
                            onMouseMove={() => setActive(i)}
                            className={`flex items-baseline justify-between gap-4 px-4 py-2.5 transition-colors ${
                              i === current ? "bg-(--accent-lt) text-(--accent)" : "text-(--text)"
                            }`}
                          >
                            <span className="text-[15px] sm:text-sm font-light truncate">{item.title}</span>
                            <span className="shrink-0 text-[11px] text-(--muted) font-mono">{item.sub}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ),
          )}
        </div>

        <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-(--border) text-[11px] text-(--muted) font-mono">
          <p aria-live="polite">{status}</p>
          <p className="hidden pointer-fine:block shrink-0">↑↓ 選擇 · Enter 前往</p>
        </div>
      </div>
    </Modal>
  );
}
