"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

// 睡著的小臉：稀疏細線 + 飄浮 zzz，呼應首頁 3D 場景的細線美學
const SleepyMascot = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ animation: "breathe 4s ease-in-out infinite" }}>
    <circle cx="34" cy="38" r="26" stroke="currentColor" strokeWidth="1.5" />
    <path d="M23 36c2-3 6-3 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M37 36c2-3 6-3 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M28 47c3.5 3 10 3 13.5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <text x="52" y="24" fontSize="9" fill="currentColor" style={{ animation: "drift-z 2.6s ease-in-out infinite" }}>z</text>
    <text x="59" y="15" fontSize="6" fill="currentColor" style={{ animation: "drift-z 2.6s ease-in-out 0.4s infinite" }}>z</text>
  </svg>
);

export default function MaintenancePage({
  onRetry,
  errorMessage,
}: {
  onRetry?: () => void;
  errorMessage?: string;
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // 這頁不看 localStorage / 系統深色偏好，固定以白色（淺色）開場
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[--bg]">
      <button
        onClick={toggle}
        aria-label="切換背景 · Toggle background"
        className="fixed top-6 right-6 w-9 h-9 rounded-full border border-[--border] flex items-center justify-center text-[--muted] hover:text-[--accent] hover:border-[--accent] transition-colors"
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="mb-8 text-[--accent]">
        <SleepyMascot />
      </div>

      <p
        className="text-xs tracking-[0.35em] text-[--muted] uppercase mb-6"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        System · 調整中
      </p>
      <h1
        className="text-3xl sm:text-4xl font-light text-[--text] mb-4 text-center"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        少々お待ちください &nbsp;·&nbsp; One Moment
      </h1>
      <p className="text-sm font-light text-[--muted] mb-2 text-center max-w-sm leading-relaxed">
        網站暫時遇到一點小狀況，正在修復中。
        <br />
        Something went a little wrong — we&apos;re on it.
      </p>

      {errorMessage && (
        <p
          className="text-xs font-light text-[--muted] opacity-70 mt-4 mb-2 text-center max-w-md break-words"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {errorMessage}
        </p>
      )}

      <div className="flex items-center gap-3 mt-8">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-light tracking-wide bg-[--accent] text-white rounded-sm hover:opacity-90 transition-opacity"
          >
            重新整理 · Try Again
          </button>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-light tracking-wide border border-[--border] text-[--text] rounded-sm hover:border-[--accent] hover:text-[--accent] transition-colors"
        >
          返回首頁 · Back Home
        </Link>
      </div>
    </div>
  );
}
