"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Magnetic from "@/components/ui/Magnetic";
import RevealHeading from "@/components/ui/RevealHeading";

const linkClass =
  "group relative inline-flex items-center gap-2 pb-2 text-sm font-light tracking-wide text-(--muted) hover:text-(--text) transition-colors";

const Underline = () => (
  <>
    <span className="absolute left-0 bottom-0 h-px w-full bg-(--border)" />
    <span className="absolute left-0 bottom-0 h-px w-0 bg-(--accent) group-hover:w-full transition-all duration-500" />
  </>
);

export default function ContactSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [copied, setCopied] = useState(false);

  const copyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText("1394kbs@gmail.com").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <section id="contact" className="py-20 md:py-32 bg-(--surface)">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Contact
          </p>
          <RevealHeading
            text="連絡先 · Get in Touch"
            className="text-3xl sm:text-4xl font-light text-(--text) mb-6"
            style={{ fontFamily: "var(--font-serif)" }}
          />
          <p className="text-(--text) font-light text-[15px] max-w-md leading-relaxed mb-3">
            合作・技術交流、或只是一段有趣的対話——關於 AI、網頁、或任何好奇的事。
          </p>
          <p className="text-(--muted) font-light text-sm max-w-md leading-relaxed mb-12">
            Open to collaborations, technical discussions, or just a conversation
            about AI, the web, or anything that sparks curiosity.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-5 sm:gap-8">
            {/* Email with copy feedback */}
            <div className="relative">
              <Magnetic>
                <button onClick={copyEmail} className={linkClass}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m2 7 10 7 10-7" />
                  </svg>
                  1394kbs@gmail.com
                  <Underline />
                </button>
              </Magnetic>
              <AnimatePresence>
                {copied && (
                  <motion.span
                    key="toast"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-(--accent) bg-(--bg) border border-(--border) px-3 py-1 rounded-sm whitespace-nowrap"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    已複製！
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <Magnetic>
              <a
                href="https://github.com/kbs0830"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
                <Underline />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="https://www.facebook.com/tra0830"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
                <Underline />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="https://www.instagram.com/pingwei_0830/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
                <Underline />
              </a>
            </Magnetic>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
