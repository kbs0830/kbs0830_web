"use client";

import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";
import Link from "next/link";

const links = [
  { href: "#about", label: "自己紹介" },
  { href: "#portfolio", label: "製作物" },
  { href: "#contact", label: "連絡先" },
];

export default function NavBar() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setSolid(v > 60));
    return unsub;
  }, [scrollY]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-500"
      style={{
        backgroundColor: solid ? "rgba(250,250,248,0.88)" : "transparent",
        backdropFilter: solid ? "blur(12px)" : "none",
        borderBottom: solid ? "1px solid var(--border)" : "none",
      }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="#top"
          className="text-sm font-light tracking-[0.2em] text-[--text] hover:text-[--accent] transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          kbs0830
        </Link>
        <ul className="flex gap-8">
          {links.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="text-sm font-light text-[--muted] hover:text-[--accent] transition-colors tracking-wide"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </motion.header>
  );
}
