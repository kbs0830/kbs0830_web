"use client";

import { Fragment, useState, type ReactNode } from "react";

export type FilterGroup = {
  key: string;
  className: string;
  gridClassName: string;
  label: ReactNode;
  items: { slug: string; tags: string[]; card: ReactNode }[];
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
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  // 再點一次目前選中的 tag = 取消篩選
  const select = (tag: string | null) => setActiveTag((cur) => (cur === tag ? null : tag));
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

      {visible.map((g) => (
        <div key={g.key} className={g.className}>
          {g.label}
          <div className={g.gridClassName}>
            {g.items.map((i) => (
              <Fragment key={i.slug}>{i.card}</Fragment>
            ))}
          </div>
        </div>
      ))}

      {visible.length === 0 && (
        <p className="text-sm font-light text-(--muted) text-center py-12">沒有符合「{activeTag}」的作品。</p>
      )}
    </>
  );
}
