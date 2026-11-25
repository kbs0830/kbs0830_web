"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

// 頁尾目錄裡「目前這一頁」換成強調色＋aria-current（TODO F9，2026-11-25）。
// 只有這個小元件在 client，頁尾其他部分照舊是 server 產生的。
export default function FooterNavLink({ href, children }: { href: Route; children: ReactNode }) {
  const current = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`group inline-flex items-baseline gap-2 py-1 text-sm font-light transition-colors ${current ? "text-(--accent)" : "text-(--text) hover:text-(--accent)"}`}
    >
      {children}
    </Link>
  );
}
