"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

// 網址只在載入時讀一次（篩選改變不回寫網址），所以不用真的訂閱
const noopSubscribe = () => () => {};

export type FilterGroup = {
  key: string;
  className: string;
  gridClassName: string;
  label: ReactNode;
  /** mobileFeatured：手機上排到最前面、收起來時也露出（2026-11-25 個人專案的精選） */
  items: { slug: string; tags: string[]; mobileFeatured?: boolean; card: ReactNode }[];
  /** 手機（640px 以下）先顯示前幾張，其他按「顯示全部」才展開；有選 tag 篩選時全部顯示（2026-11-24 手機「重點顯示，剩下收起來」） */
  mobileLimit?: number;
};

// 作品集的 tag 篩選。卡片本身是 server 產生好的 HTML（PortfolioSection 傳進來的 ReactNode），
// 這個 client 元件只負責記住選了哪個 tag、決定哪些卡片要顯示——projects.ts 的資料不會進 client bundle。
export default function ProjectFilter({
  tags,
  moreTags = [],
  groups,
}: {
  tags: string[];
  /** 只有一個作品用到的 tag，預設收起來，按「+N」才展開 */
  moreTags?: string[];
  groups: FilterGroup[];
}) {
  // 技能 ↔ 作品互連（2026-11-09）：
  //   - 作品詳細頁的 tag 連到 /?tag=Python#portfolio → 這裡讀網址當初始值
  //   - 首頁 About 的技能 chip 是 <a href="#portfolio" data-filter-tag>（server 產生），點了在這裡接住，不重新載入
  // choice：使用者在這一頁自己選的（undefined＝還沒選，用網址上的）
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  const urlTag = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("tag"),
    () => null,
  );
  const allTags = [...tags, ...moreTags];
  const fromUrl = urlTag && allTags.includes(urlTag) ? urlTag : null;
  const activeTag = choice === undefined ? fromUrl : choice;
  const [showMore, setShowMore] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  // 「顯示全部」之後把焦點移到第一張新出現的卡片（TODO O5）：鍵盤、讀屏的使用者才知道新內容出現在哪
  const focusAfterExpand = useRef<{ key: string; rank: number } | null>(null);
  useEffect(() => {
    const target = focusAfterExpand.current;
    if (!target) return;
    focusAfterExpand.current = null;
    document.querySelector<HTMLElement>(`[data-filter-group="${target.key}"] [data-rank="${target.rank}"] a`)?.focus();
  }, [expanded]);
  // 再點一次目前選中的 tag = 取消篩選
  const select = (tag: string | null) => setChoice(activeTag === tag ? null : tag);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-filter-tag]");
      const tag = el?.getAttribute("data-filter-tag");
      if (tag) setChoice(tag); // 預設行為（跳到 #portfolio）照常
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !activeTag || i.tags.includes(activeTag)) }))
    .filter((g) => g.items.length > 0);

  const chip = (label: string, tag: string | null) => (
    <button
      key={label}
      onClick={() => select(tag)}
      aria-pressed={activeTag === tag}
      className={`shrink-0 snap-start px-3 py-1.5 sm:py-1 text-[11px] font-light rounded-sm border tracking-wide transition-colors font-mono ${
        activeTag === tag
          ? "text-(--accent) border-(--accent) bg-(--accent-lt)"
          : "text-(--muted) border-(--border) bg-(--surface) hover:border-(--accent) hover:text-(--accent)"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* 手機：一列橫向滑動（左右邊緣淡出提示還有更多）；sm 以上照舊換行排滿 */}
      <div className="filter-scroll flex gap-2 overflow-x-auto snap-x scroll-px-6 -mx-6 px-6 pb-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0 mb-10 md:mb-14">
        {chip("全部 · All", null)}
        {tags.map((tag) => chip(tag, tag))}
        {/* 收合後，選中的那個還是留著，才看得出現在在篩什麼 */}
        {moreTags.filter((tag) => showMore || tag === activeTag).map((tag) => chip(tag, tag))}
        {moreTags.length > 0 && (
          <button
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className="shrink-0 snap-start px-3 py-1.5 sm:py-1 text-[11px] font-light tracking-wide font-mono text-(--muted) hover:text-(--accent) transition-colors"
          >
            {showMore ? "收合 · Less" : `+${moreTags.length} 更多 · More`}
          </button>
        )}
      </div>

      {visible.map((g) => {
        // 收起來的卡片還在 HTML 裡（只是手機上 display:none），搜尋引擎、Ctrl+F 照樣看得到；桌機用 contents 不影響格線
        const limit = !activeTag && g.mobileLimit && !expanded.includes(g.key) ? g.mobileLimit : Infinity;
        const hiddenCount = Math.max(0, g.items.length - limit);
        // 手機上的排名：精選在前、其他照原本順序；排名超過 limit 的先收起來（桌機不看這個）
        const mobileRank = new Map([...g.items.filter((i) => i.mobileFeatured), ...g.items.filter((i) => !i.mobileFeatured)].map((i, n) => [i.slug, n]));
        return (
          <div key={g.key} className={g.className} data-filter-group={g.key}>
            {g.label}
            <div className={g.gridClassName}>
              {g.items.map((i) => (
                // 精選：手機上變成真的格子（max-sm:block）才能用 order 排到最前；桌機照舊 contents、順序不變
                <div
                  key={i.slug}
                  data-rank={mobileRank.get(i.slug)}
                  className={mobileRank.get(i.slug)! >= limit ? "hidden sm:contents" : i.mobileFeatured ? "contents max-sm:block max-sm:order-first" : "contents"}
                >
                  {i.card}
                </div>
              ))}
            </div>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  focusAfterExpand.current = { key: g.key, rank: limit };
                  setExpanded((e) => [...e, g.key]);
                }}
                className="sm:hidden mt-3 w-full py-3 border border-dashed border-(--border) rounded-sm text-sm font-light text-(--muted) hover:text-(--accent) hover:border-(--accent) transition-colors"
              >
                顯示全部 {g.items.length} 個 · 還有 {hiddenCount} 個 ▾
              </button>
            )}
          </div>
        );
      })}

      {visible.length === 0 && (
        <p className="text-sm font-light text-(--muted) text-center py-12">沒有符合「{activeTag}」的作品。</p>
      )}
    </>
  );
}
