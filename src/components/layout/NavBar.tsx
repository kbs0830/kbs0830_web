"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Collapse from "@/components/ui/Collapse";
import SiteIndex from "@/components/layout/SiteIndex";
import { useMenuDismiss } from "@/components/layout/useMenuDismiss";
import QuickJumpButton from "@/components/layout/QuickJumpButton";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useMediaQuery, useScrolledPast } from "@/lib/client/hooks";
import { HOME_WIDTH } from "@/components/layout/home-width";

const links = [
  { href: "#about",     label: "自己紹介", id: "about" },
  { href: "#portfolio", label: "製作物",   id: "portfolio" },
  { href: "#contact",   label: "連絡先",   id: "contact" },
];

// 圖示按鈕：版面上佔 32×32（負 margin 抵銷），實際可點範圍 40×44，手機比較好按準。
// 手機版兩顆按鈕間距 8px，寬 40 剛好互相貼齊不重疊
const hitArea = "w-10 h-11 -mx-1 -my-1.5";
const iconButton = `${hitArea} flex items-center justify-center text-(--muted) hover:text-(--accent) transition-colors`;

const lineClass = "block w-5 h-px bg-(--muted) transition duration-200";

export default function NavBar() {
  const solid = useScrolledPast(60);
  const isDesktop = useMediaQuery("(width >= 640px)");
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerOpen = menuOpen && !isDesktop;

  useEffect(() => {
    const observers = links.flatMap(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return [];
      const obs = new IntersectionObserver(
        // 離開時也要清掉（TODO F5）：原本只在進入時設定，捲回 Hero 時「自己紹介」會一直亮著
        ([entry]) => setActiveSection((cur) => (entry.isIntersecting ? id : cur === id ? "" : cur)),
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      return [obs];
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // 手機選單：焦點、Esc、點外面、捲動收起（useMenuDismiss，子頁面的 PageMenu 共用）
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useMenuDismiss(drawerOpen, closeMenu, { container: headerRef, button: buttonRef, panel: drawerRef });

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 enter-up transition-colors duration-500 border-b ${
        solid ? "bg-(--nav-bg) backdrop-blur-md border-(--border)" : "border-transparent"
      }`}
      style={{ "--enter-duration": "0.6s", "--enter-distance": "-16px" } as React.CSSProperties}
    >
      <div className="scroll-progress absolute top-0 left-0 right-0 h-[2px] bg-(--accent)" />

      <nav className={`${HOME_WIDTH} mx-auto px-6 py-4 flex items-center justify-between`}>
        <Link
          href="#top"
          className="text-sm font-light tracking-[0.2em] text-(--text) hover:text-(--accent) transition-colors font-mono"
        >
          kbs0830
        </Link>

        {/* Desktop */}
        <ul className="hidden sm:flex gap-8 items-center">
          {links.map(({ href, label, id }) => (
            <li key={href}>
              <a
                href={href}
                aria-current={activeSection === id ? "location" : undefined}
                className={`text-sm font-light tracking-wide transition-colors ${
                  activeSection === id ? "text-(--accent)" : "text-(--muted) hover:text-(--accent)"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            {/* F12（2026-11-26 使用者選「先做」）：從首頁直接到部落格 */}
            <Link href="/blog" className="text-sm font-light tracking-wide text-(--muted) hover:text-(--accent) transition-colors">
              記事
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <QuickJumpButton icon className={iconButton} />
            <ThemeToggle className={iconButton} />
            {/* 站長後台入口（2026-11-26 G5，使用者：「首頁上加一格登入後台的按鈕」）→ /login 再分訪客參觀／站長登入 */}
            <Link href="/login" className="inline-flex items-center h-8 px-3 rounded-full border border-(--border) text-xs text-(--muted) hover:text-(--accent) hover:border-(--accent) transition-colors">
              登入
            </Link>
          </li>
        </ul>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <QuickJumpButton icon className={iconButton} />
          <ThemeToggle className={iconButton} />
          <Link href="/login" className="inline-flex items-center h-8 px-3 rounded-full border border-(--border) text-xs text-(--muted) hover:text-(--accent) hover:border-(--accent) transition-colors">
            登入
          </Link>
          <button
            ref={buttonRef}
            onClick={() => setMenuOpen((v) => !v)}
            className={`group ${hitArea} flex flex-col items-center justify-center gap-[5px]`}
            aria-label="選單"
            aria-expanded={drawerOpen}
          >
            <span className={`${lineClass} group-aria-expanded:translate-y-[6px] group-aria-expanded:rotate-45`} />
            <span className={`${lineClass} group-aria-expanded:opacity-0`} />
            <span className={`${lineClass} group-aria-expanded:-translate-y-[6px] group-aria-expanded:-rotate-45`} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer（視窗拉寬到桌機版時自動收起） */}
      <Collapse open={drawerOpen} className={`sm:hidden bg-(--bg) ${drawerOpen ? "border-t border-(--border)" : ""}`}>
        <div ref={drawerRef} className="px-6 py-4">
          <ul className="flex gap-x-6">
            {links.map(({ href, label, id }) => (
              <li key={href}>
                <a
                  href={href}
                  aria-current={activeSection === id ? "location" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 text-[15px] font-light tracking-wide transition-colors ${
                    activeSection === id ? "text-(--accent)" : "text-(--muted)"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="block py-2 text-[15px] font-light tracking-wide text-(--muted)">
                記事
              </Link>
            </li>
          </ul>
          {/* 全站頁面（2026-11-24：手機上頁尾不再列頁面，全部收在這裡） */}
          <div className="mt-3 pt-4 border-t border-(--border) max-h-[60svh] overflow-y-auto overscroll-contain">
            <SiteIndex onNavigate={closeMenu} />
          </div>
        </div>
      </Collapse>
    </header>
  );
}
