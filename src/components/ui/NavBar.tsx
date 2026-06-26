"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";

const links = [
  { href: "#about",     label: "自己紹介", id: "about" },
  { href: "#portfolio", label: "製作物",   id: "portfolio" },
  { href: "#contact",   label: "連絡先",   id: "contact" },
];

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

export default function NavBar() {
  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const [solid, setSolid] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setSolid(v > 60));
    return unsub;
  }, [scrollY]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    links.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 640) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navBg = solid
    ? dark ? "rgba(15,15,13,0.9)" : "rgba(250,250,248,0.88)"
    : "transparent";

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-500"
      style={{
        backgroundColor: navBg,
        backdropFilter: solid ? "blur(12px)" : "none",
        borderBottom: solid ? "1px solid var(--border)" : "none",
      }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] bg-[--accent] origin-left"
        style={{ scaleX }}
      />

      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="#top"
          className="text-sm font-light tracking-[0.2em] text-[--text] hover:text-[--accent] transition-colors"
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
                  activeSection === id ? "text-[--accent]" : "text-[--muted] hover:text-[--accent]"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center text-[--muted] hover:text-[--accent] transition-colors"
              aria-label={dark ? "切換亮色模式" : "切換暗色模式"}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </li>
        </ul>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center text-[--muted] hover:text-[--accent] transition-colors"
            aria-label={dark ? "切換亮色模式" : "切換暗色模式"}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px]"
            aria-label="選單"
          >
            <motion.span
              className="block w-5 h-[1px] bg-[--muted]"
              animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-[1px] bg-[--muted]"
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.15 }}
            />
            <motion.span
              className="block w-5 h-[1px] bg-[--muted]"
              animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <motion.div
        className="sm:hidden overflow-hidden bg-[--bg]"
        initial={false}
        animate={{ height: menuOpen ? "auto" : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ borderTop: menuOpen ? "1px solid var(--border)" : "none" }}
      >
        <ul className="px-6 py-5 space-y-5">
          {links.map(({ href, label, id }) => (
            <li key={href}>
              <a
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm font-light tracking-wide transition-colors ${
                  activeSection === id ? "text-[--accent]" : "text-[--muted]"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.header>
  );
}
