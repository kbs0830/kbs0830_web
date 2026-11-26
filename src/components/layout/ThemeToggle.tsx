"use client";

import { MoonIcon, SunIcon } from "@/components/ui/icons";

// 主題偵測只在 layout.tsx 的 inline script 一份；這裡切換時直接讀寫 <html data-theme>，
// icon 由 CSS 依 data-theme 決定顯示哪個（globals.css .theme-icon-*），React 不存 dark state。
// 2026-11-24（TODO F1）從 NavBar 抽出來：子頁面（PageShell）右上也放一顆，之前只有首頁能切主題
function applyTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

// 2026-11-26（TODO O4，使用者選 B）：切換時新主題從按鈕的位置用圓形慢慢擴散到整頁（View Transition＋clip-path），
// 500ms、跟全站同一條 easing（--ease-ma）。減少動態效果、不支援 View Transition 的瀏覽器直接切換。
// 鍵盤按 Enter／空白鍵時 clientX/Y 是 0，改用按鈕中心當圓心
function toggleTheme(e: React.MouseEvent<HTMLButtonElement>) {
  const root = document.documentElement;
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return applyTheme();
  const box = e.currentTarget.getBoundingClientRect();
  const x = e.clientX || box.left + box.width / 2;
  const y = e.clientY || box.top + box.height / 2;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.setAttribute("data-theme-vt", "");
  const vt = document.startViewTransition(applyTheme);
  vt.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 500, easing: "cubic-bezier(0.25, 0.1, 0.25, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  vt.finished.finally(() => root.removeAttribute("data-theme-vt"));
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={toggleTheme} className={className} aria-label="切換亮色／暗色模式">
      <MoonIcon className="theme-icon-moon" />
      <SunIcon className="theme-icon-sun" />
    </button>
  );
}
