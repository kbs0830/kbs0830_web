"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_PAGES } from "@/lib/admin/nav";

// 後台分頁列：手機橫向捲動、桌機一排。目前所在頁加底線＋aria-current
export default function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="站長後台" className="-mx-6 px-6 overflow-x-auto mb-10 border-b border-(--border)">
      <ul className="flex gap-6 whitespace-nowrap">
        {ADMIN_PAGES.map((p) => {
          const active = path === p.href;
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={active ? "page" : undefined}
                className={`inline-block py-3 text-sm transition-colors border-b-2 -mb-px ${active ? "border-(--accent) text-(--accent)" : "border-transparent text-(--muted) hover:text-(--text)"}`}
              >
                {p.label}
                <span className="ml-1.5 font-mono text-[10px] tracking-wide opacity-70">{p.en}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
