"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import Collapse from "@/components/ui/Collapse";
import { useMediaQuery, useScrolledPast } from "@/lib/hooks";

const links = [
  { href: "#about",     label: "自己紹介", id: "about" },
  { href: "#portfolio", label: "製作物",   id: "portfolio" },
  { href: "#contact",   label: "連絡先",   id: "contact" },
];

// 主題偵測只在 layout.tsx 的 inline script 一份；這裡切換時直接讀寫 <html data-theme>，
// icon 由 CSS 依 data-theme 決定顯示哪個（globals.css .theme-icon-*），React 不存 dark state。
function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

function ThemeToggle() {
  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center text-(--muted) hover:text-(--accent) transition-colors"
      aria-label="切換亮色／暗色模式"
    >
      <MoonIcon className="theme-icon-moon" />
      <SunIcon className="theme-icon-sun" />
    </button>
  );
}

const lineClass = "block w-5 h-px bg-(--muted) transition duration-200";

export default function NavBar() {
  const solid = useScrolledPast(60);
  const isDesktop = useMediaQuery("(min-width: 640px)");
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 enter-up transition-colors duration-500 border-b ${
        solid ? "bg-(--nav-bg) backdrop-blur-md border-(--border)" : "border-transparent"
      }`}
      style={{ "--enter-duration": "0.6s", "--enter-distance": "-16px" } as React.CSSProperties}
    >
      <div className="scroll-progress absolute top-0 left-0 right-0 h-[2px] bg-(--accent)" />

      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="#top"
          className="text-sm font-light tracking-[0.2em] text-(--text) hover:text-(--accent) transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
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
          <li>
            <ThemeToggle />
          </li>
        </ul>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="group w-8 h-8 flex flex-col items-center justify-center gap-[5px]"
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
        <ul className="px-6 py-5 space-y-5">
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
      </Collapse>
    </header>
  );
}
