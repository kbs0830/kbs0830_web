"use client";

import { MoonIcon, SunIcon } from "@/components/ui/icons";

// 主題偵測只在 layout.tsx 的 inline script 一份；這裡切換時直接讀寫 <html data-theme>，
// icon 由 CSS 依 data-theme 決定顯示哪個（globals.css .theme-icon-*），React 不存 dark state。
// 2026-11-24（TODO F1）從 NavBar 抽出來：子頁面（PageShell）右上也放一顆，之前只有首頁能切主題
function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={toggleTheme} className={className} aria-label="切換亮色／暗色模式">
      <MoonIcon className="theme-icon-moon" />
      <SunIcon className="theme-icon-sun" />
    </button>
  );
}
