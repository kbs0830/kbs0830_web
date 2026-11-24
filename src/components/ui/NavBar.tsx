"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import Collapse from "@/components/ui/Collapse";
import QuickJumpButton from "@/components/ui/QuickJumpButton";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useMediaQuery, useScrolledPast } from "@/lib/hooks";

const links = [
  { href: "#about",     label: "自己紹介", id: "about" },
  { href: "#portfolio", label: "製作物",   id: "portfolio" },
  { href: "#contact",   label: "連絡先",   id: "contact" },
];

// 手機選單第二組：常用的獨立頁面（2026-11-24 TODO F4，之前選單只有三個錨點、下面一大片空白）
const pages: { href: Route; label: string; en: string }[] = [
  { href: "/blog", label: "技術部落格", en: "Blog" },
  { href: "/resume", label: "履歷", en: "Resume" },
  { href: "/travel", label: "旅行地球", en: "Travel" },
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
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      return [obs];
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // 手機選單打開時：焦點移進選單；Esc、點選單外面、捲動超過 40px 都收起（TODO F4）
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    const startY = window.scrollY;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 40) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [drawerOpen]);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 enter-up transition-colors duration-500 border-b ${
        solid ? "bg-(--nav-bg) backdrop-blur-md border-(--border)" : "border-transparent"
      }`}
      style={{ "--enter-duration": "0.6s", "--enter-distance": "-16px" } as React.CSSProperties}
    >
      <div className="scroll-progress absolute top-0 left-0 right-0 h-[2px] bg-(--accent)" />

      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
                className={`text-sm font-light tracking-wide transition-colors ${
                  activeSection === id ? "text-(--accent)" : "text-(--muted) hover:text-(--accent)"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <QuickJumpButton icon className={iconButton} />
            <ThemeToggle className={iconButton} />
          </li>
        </ul>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <QuickJumpButton icon className={iconButton} />
          <ThemeToggle className={iconButton} />
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
        <div ref={drawerRef} className="px-6 py-5">
          <ul className="space-y-5">
            {links.map(({ href, label, id }) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`block text-sm font-light tracking-wide transition-colors ${
                    activeSection === id ? "text-(--accent)" : "text-(--muted)"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <ul className="mt-6 pt-5 border-t border-(--border) space-y-5">
            {pages.map(({ href, label, en }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline gap-2 text-sm font-light tracking-wide text-(--muted) hover:text-(--accent) transition-colors"
                >
                  {label}
                  <span className="text-[10px] tracking-wider font-mono">{en}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Collapse>
    </header>
  );
}
