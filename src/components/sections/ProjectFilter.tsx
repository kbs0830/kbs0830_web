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
export default function ProjectFilter({ tags, groups }: { tags: string[]; groups: FilterGroup[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
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
      className={`px-3 py-1 text-[11px] font-light rounded-sm border tracking-wide transition-colors font-mono ${
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
      <div className="flex flex-wrap gap-2 mb-10 md:mb-14">
        {chip("全部 · All", null)}
        {tags.map((tag) => chip(tag, tag))}
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
