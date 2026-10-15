import { ViewTransition } from "react";

// template.tsx（不是 layout.tsx）在每次導覽進這個路由 segment 時都會重新 mount。
// 2026-10 從 framer-motion 的 motion.div 改成 React 19.3 原生 <ViewTransition>：
// App Router 的導覽本身就是 transition，會自動觸發瀏覽器的 View Transitions API。
// 原本 framer 的 initial opacity:0 會讓瀏覽器拍到「還沒淡入」的新畫面快照，
// 跟作品卡片 → 詳細頁的標題／縮圖 morph（見 PortfolioSection.tsx）互相打架，
// 所以改由 CSS（globals.css 的 .page-enter）處理進場的 fade + slide-up。
// 不支援 View Transitions 的瀏覽器會直接顯示頁面，不會壞掉，只是沒有動畫。
export default function ProjectTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
