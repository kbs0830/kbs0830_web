"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SceneErrorBoundary from "@/components/canvas/SceneErrorBoundary";
import Magnetic from "@/components/ui/Magnetic";

const HeroScene = dynamic(() => import("@/components/canvas/HeroScene"), {
  ssr: false,
  loading: () => <HeroSceneSkeleton />,
});

const SceneFallback = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-(--bg) via-(--surface) to-(--bg)" />
);

// 稀疏細線骨架屏，呼應真正場景的視覺語言，避免載入期間是一片空白。
const HeroSceneSkeleton = () => (
  <div className="absolute inset-0 bg-(--bg) overflow-hidden">
    {Array.from({ length: 7 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-px bg-(--accent)"
        style={{
          width: `${18 + ((i * 11) % 34)}%`,
          left: `${(i * 19) % 70}%`,
          top: `${8 + ((i * 13) % 78)}%`,
          opacity: 0.12 + (i % 3) * 0.04,
          transform: `rotate(${(i * 41) % 180}deg)`,
          animation: `breathe ${2.6 + i * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number], delay },
  }),
};

const SUBTITLE_TEXT = "学生開発者  ·  Claude × Gemini";

function useTypewriter(text: string, startDelay = 0, speed = 42) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(text);
      return;
    }
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, startDelay, speed]);

  return display;
}

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState(false);
  const typedSubtitle = useTypewriter(SUBTITLE_TEXT, 950);
  const subtitleDone = typedSubtitle.length === SUBTITLE_TEXT.length;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      id="top"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {isMobile ? (
        <SceneFallback />
      ) : (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <HeroScene />
        </SceneErrorBoundary>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <motion.p
          className="text-xs tracking-[0.35em] text-(--muted) mb-6 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
        >
          高雄・福岡 &nbsp;/&nbsp; Kaohsiung · Fukuoka
        </motion.p>

        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] tracking-[0.04em] text-(--text) mb-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.25}
        >
          PINGWEI LI
        </motion.h1>

        <motion.p
          className="text-base font-light text-(--accent) tracking-[0.25em] mb-8 min-h-[1.5em]"
          style={{ fontFamily: "var(--font-mono)" }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.35}
        >
          {typedSubtitle}
          <span
            aria-hidden
            className={`inline-block w-[2px] h-[0.9em] bg-(--accent) ml-0.5 align-middle ${
              subtitleDone ? "opacity-0" : "animate-pulse"
            }`}
          />
        </motion.p>

        <motion.p
          className="text-lg sm:text-xl font-light text-(--muted) max-w-lg leading-relaxed mb-3"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.45}
        >
          在瀏覽器與模型層之間，構建有意義的系統。
        </motion.p>

        <motion.p
          className="text-base font-light text-(--muted) max-w-lg leading-relaxed mb-12 opacity-70"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.5}
        >
          Building thoughtful systems — from the browser to the model layer.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.6}
        >
          <Magnetic>
            <a
              href="#portfolio"
              className="group relative inline-flex items-center gap-2 pb-2 text-sm font-light tracking-wide text-(--text)"
            >
              查看作品 · View Work
              <span className="absolute left-0 bottom-0 h-px w-full bg-(--border)" />
              <span className="absolute left-0 bottom-0 h-px w-0 bg-(--accent) group-hover:w-full transition-all duration-500" />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 pb-2 text-sm font-light tracking-wide text-(--muted) hover:text-(--text) transition-colors"
            >
              聯絡我 · Contact
              <span className="absolute left-0 bottom-0 h-px w-full bg-(--border)" />
              <span className="absolute left-0 bottom-0 h-px w-0 bg-(--accent) group-hover:w-full transition-all duration-500" />
            </a>
          </Magnetic>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-(--muted)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <div className="w-[1px] h-12 bg-(--border) animate-pulse" />
      </motion.div>
    </section>
  );
}
