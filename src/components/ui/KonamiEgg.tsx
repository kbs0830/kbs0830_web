"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const SHOW_MS = 3200;
const LEAVE_MS = 500;

export default function KonamiEgg() {
  // hidden → shown（CSS 進場）→ leaving（CSS 退場）→ hidden（卸載）
  const [phase, setPhase] = useState<"hidden" | "shown" | "leaving">("hidden");
  const progress = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clearTimers = () => timers.current.forEach(clearTimeout);
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key !== CODE[progress.current]) {
        progress.current = key === CODE[0] ? 1 : 0;
        return;
      }
      progress.current += 1;
      if (progress.current < CODE.length) return;

      progress.current = 0;
      clearTimers();
      setPhase("shown");
      timers.current = [
        setTimeout(() => setPhase("leaving"), SHOW_MS),
        setTimeout(() => setPhase("hidden"), SHOW_MS + LEAVE_MS),
      ];
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimers();
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center pointer-events-none transition-opacity duration-500 enter-fade ${
        phase === "leaving" ? "opacity-0" : ""
      }`}
      style={{ "--enter-duration": "0.4s" } as CSSProperties}
    >
      <div className="absolute inset-0 bg-(--bg) opacity-92" />
      <div
        className="relative text-center px-8 enter-up"
        style={{ "--enter-duration": "0.5s", "--enter-distance": "12px" } as CSSProperties}
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
      </div>
    </div>
  );
}
