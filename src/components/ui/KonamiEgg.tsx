"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export default function KonamiEgg() {
  const [active, setActive] = useState(false);
  const progress = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = CODE[progress.current];
      if (key === expected) {
        progress.current += 1;
        if (progress.current === CODE.length) {
          progress.current = 0;
          setActive(true);
          setTimeout(() => setActive(false), 3200);
        }
      } else {
        progress.current = key === CODE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.92 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.div
            className="relative text-center px-8"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p
              className="text-4xl sm:text-5xl font-light text-(--accent)"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              ようこそ
            </p>
            <p
              className="text-sm text-(--muted) font-light mt-4 tracking-widest"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              隠しコマンドを見つけましたね。
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
