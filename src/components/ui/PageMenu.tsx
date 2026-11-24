"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Collapse from "@/components/ui/Collapse";
import SiteIndex from "@/components/ui/SiteIndex";
import { useMenuDismiss } from "@/components/ui/useMenuDismiss";

// 子頁面（PageShell）的手機選單（2026-11-24，使用者：「手機版多利用右上角選單做收納」）。
// 跟首頁 NavBar 的抽屜同一份目錄（SiteIndex）跟同樣的收起規則（useMenuDismiss）；
// 面板疊在內容上面（absolute），不把內容往下推。640px 以上不顯示（桌機頁尾就有完整索引）。
const lineClass = "block w-5 h-px bg-(--muted) transition duration-200";

export default function PageMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useMenuDismiss(open, close, { container, button, panel });

  return (
    <div ref={container} className="sm:hidden">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group w-10 h-11 -mx-2 -my-3.5 flex flex-col items-center justify-center gap-[5px]"
        aria-label="選單"
        aria-expanded={open}
      >
        <span className={`${lineClass} group-aria-expanded:translate-y-[6px] group-aria-expanded:rotate-45`} />
        <span className={`${lineClass} group-aria-expanded:opacity-0`} />
        <span className={`${lineClass} group-aria-expanded:-translate-y-[6px] group-aria-expanded:-rotate-45`} />
      </button>
      <div className="absolute left-0 right-0 top-full mt-3 z-40">
        <Collapse open={open} className={`bg-(--bg) rounded-sm ${open ? "border border-(--border) shadow-sm" : ""}`}>
          <div ref={panel} className="px-5 py-4 max-h-[70svh] overflow-y-auto overscroll-contain">
            <Link href="/" onClick={close} className="inline-block py-2 mb-2 text-[15px] font-light text-(--text) hover:text-(--accent) transition-colors">
              首頁 <span className="text-[10px] tracking-wider text-(--muted) font-mono">Home</span>
            </Link>
            <SiteIndex onNavigate={close} />
          </div>
        </Collapse>
      </div>
    </div>
  );
}
