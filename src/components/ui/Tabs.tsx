"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabItem = {
  key: string;
  label: string;
  labelEn: string;
  /** 分頁標籤右上角的小數字（例如幾項技能），沒有就不顯示 */
  count?: number;
  panel: ReactNode;
};

// 分頁切換（2026-11-05：About 原本歷程／技能／活動／足跡一路往下排，太長，改成分頁）。
// 面板內容是 server 產生好的 ReactNode，這個 client 元件只管「顯示哪一頁」：
//   - 沒選中的面板是 hidden="until-found"：HTML 裡內容都在（搜尋引擎讀得到），瀏覽器 Ctrl+F 找得到，
//     找到時瀏覽器發 beforematch → 自動切到那一頁
//   - ARIA tabs 規範：←→ / Home / End 換頁、只有目前那個 tab 在 Tab 鍵順序裡
//   - 底下那條指示線滑到選中的分頁（直接改 style，不 re-render）；列印時全部面板都印出來（globals.css）
export default function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  const [active, setActive] = useState(items[0].key);
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const panels = useRef(new Map<string, HTMLDivElement>());

  useLayoutEffect(() => {
    const place = () => {
      // 量按鈕裡的文字區塊（不含左右 padding），指示線才剛好跟字一樣寬
      const btn = list.current?.querySelector<HTMLElement>(`[data-key="${active}"] [data-tab-label]`);
      if (!btn || !indicator.current) return;
      indicator.current.style.translate = `${btn.offsetLeft}px 0`;
      indicator.current.style.width = `${btn.offsetWidth}px`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  // React 的 hidden 只接受 boolean，until-found 自己補上；React 之後把 hidden 改回 false 時會整個拿掉
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    for (const [key, el] of panels.current) {
      if (key === active) continue;
      el.setAttribute("hidden", "until-found");
      const onMatch = () => setActive(key);
      el.addEventListener("beforematch", onMatch);
      cleanups.push(() => el.removeEventListener("beforematch", onMatch));
    }
    return () => cleanups.forEach((c) => c());
  }, [active]);

  const focusTab = (key: string) => {
    setActive(key);
    list.current?.querySelector<HTMLElement>(`[data-key="${key}"]`)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    focusTab(items[next].key);
  };

  return (
    <div>
      <div
        ref={list}
        role="tablist"
        aria-label={label}
        className="tab-list filter-scroll relative flex overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 border-b border-(--border) mb-10 md:mb-12"
      >
        {items.map((t, i) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              data-key={t.key}
              id={`${id}-tab-${t.key}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${t.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`group shrink-0 px-4 sm:px-6 first:pl-0 py-3 text-left transition-colors ${
                selected ? "text-(--accent)" : "text-(--muted) hover:text-(--text)"
              }`}
            >
              <span data-tab-label className="inline-block">
                <span className="flex items-start gap-1 text-xs tracking-[0.2em] uppercase font-mono">
                  {t.labelEn}
                  {t.count !== undefined && <span className="text-[9px] tracking-normal opacity-60">{t.count}</span>}
                </span>
                <span className="block text-[11px] font-light mt-0.5 opacity-80">{t.label}</span>
              </span>
            </button>
          );
        })}
        <span
          ref={indicator}
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px] w-0 bg-(--accent) transition-[translate,width] duration-500 ease-(--ease-ma)"
        />
      </div>

      {items.map((t) => (
        <div
          key={t.key}
          ref={(el) => {
            if (el) panels.current.set(t.key, el);
            else panels.current.delete(t.key);
          }}
          role="tabpanel"
          id={`${id}-panel-${t.key}`}
          aria-labelledby={`${id}-tab-${t.key}`}
          hidden={t.key !== active}
          tabIndex={0}
          className="tab-panel focus-visible:outline-offset-8"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
