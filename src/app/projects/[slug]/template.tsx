"use client";

import { motion } from "framer-motion";

// template.tsx（不是 layout.tsx）在每次導覽進這個路由 segment 時都會重新 mount，
// 這樣從作品卡片點進不同專案的詳細頁時，每次都會重播一次進場動畫。
// App Router 目前沒有原生、穩定支援 unmount 時播放退場動畫的方式（AnimatePresence
// 需要保留舊路由畫面到動畫結束才真的卸載，跟 App Router 的導覽模型會打架），
// 所以這裡只做進場的 fade + slide-up，不做退場動畫。
export default function ProjectTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
