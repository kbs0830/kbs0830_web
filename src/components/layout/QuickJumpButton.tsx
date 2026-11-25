"use client";

import { useSyncExternalStore } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { OPEN_QUICK_JUMP } from "@/lib/site/site-map";

const noop = () => () => {};

/** Mac／iPad 顯示 ⌘K，其他顯示 Ctrl K；server 端先當成 Ctrl */
function useIsApple() {
  return useSyncExternalStore(noop, () => /Mac|iPhone|iPad/.test(navigator.userAgent), () => false);
}

// 打開快速跳轉（QuickJump，掛在 layout）。icon：NavBar 用的純圖示；不然是「搜尋 Ctrl K」小字（PageShell 頂端）
export default function QuickJumpButton({ icon = false, className = "" }: { icon?: boolean; className?: string }) {
  const apple = useIsApple();
  const open = () => window.dispatchEvent(new Event(OPEN_QUICK_JUMP));

  if (icon) {
    return (
      <button type="button" onClick={open} className={className} aria-label="快速跳轉（搜尋頁面、作品、文章）" title={apple ? "⌘K" : "Ctrl K"}>
        <SearchIcon />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      title="快速跳轉：搜尋頁面、作品、文章"
      className={`inline-flex items-center gap-2 text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors font-mono ${className}`}
    >
      <SearchIcon size={12} />
      <span>搜尋</span>
      <kbd className="hidden pointer-fine:inline tracking-normal text-[10px] px-1 border border-(--border) rounded-sm">
        {apple ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
