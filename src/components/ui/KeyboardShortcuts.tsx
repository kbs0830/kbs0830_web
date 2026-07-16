"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isTyping } from "@/lib/isTyping";

const sectionKeys: Record<string, string> = {
  "1": "about",
  "2": "portfolio",
  "3": "contact",
};

const shortcuts = [
  { key: "1 / 2 / 3", desc: "跳轉至 自己紹介 / 製作物 / 連絡先" },
  { key: "G", desc: "開啟 GitHub" },
  { key: "E", desc: "寄一封信" },
  { key: "`", desc: "呼出終端機模式" },
  { key: "?", desc: "顯示 / 隱藏這個提示" },
];

export default function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "?") {
        if (isTyping()) return;
        setShowHelp((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }
      if (isTyping()) return;

      if (e.key === "g" || e.key === "G") {
        window.open("https://github.com/kbs0830", "_blank", "noopener,noreferrer");
      } else if (e.key === "e" || e.key === "E") {
        window.location.href = "mailto:1394kbs@gmail.com";
      } else if (sectionKeys[e.key]) {
        document.getElementById(sectionKeys[e.key])?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {showHelp && (
        <motion.div
          className="fixed inset-0 z-[998] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setShowHelp(false)}
          />
          <motion.div
            className="relative w-full max-w-sm p-6 border border-(--border) rounded-sm bg-(--surface)"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p
              className="text-xs tracking-[0.25em] text-(--accent) uppercase mb-5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Keyboard Shortcuts
            </p>
            <div className="space-y-3">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center gap-4">
                  <kbd
                    className="shrink-0 min-w-[2.5rem] text-center px-2 py-1 text-[11px] text-(--accent) border border-(--accent-lt) bg-(--accent-lt) rounded-sm"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {s.key}
                  </kbd>
                  <span className="text-sm font-light text-(--muted)">{s.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
