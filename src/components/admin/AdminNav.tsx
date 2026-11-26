"use client";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_PAGES } from "@/lib/admin/nav";

// 後台分頁列：捲動時黏在畫面頂端（手機切頁不用滑回最上面），一排膠囊按鈕，手機橫向捲動。
// 目前所在頁＝實心強調色＋aria-current。
// base：真後台 /admin、訪客參觀 /demo/admin（TODO G4，分頁一樣、網址前綴不同）
export default function AdminNav({ base = "/admin" }: { base?: "/admin" | "/demo/admin" }) {
  const path = usePathname();
  return (
    <nav
      aria-label="站長後台"
      className="sticky top-0 z-30 -mx-6 px-6 py-2 mb-6 bg-(--nav-bg) backdrop-blur-md border-b border-(--border)"
    >
      <ul className="flex gap-0.5 sm:gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
        {ADMIN_PAGES.filter((p) => base === "/admin" || !p.private).map((p) => {
          const href = (base === "/admin" ? p.href : p.href.replace(/^\/admin/, base)) as Route;
          const active = path === href;
          return (
            <li key={p.href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center h-9 px-3 sm:px-3.5 rounded-full text-sm transition-colors ${
                  active ? "bg-(--accent) text-(--bg)" : "text-(--muted) hover:text-(--text) hover:bg-(--surface)"
                }`}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
