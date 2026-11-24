import type { ReactNode } from "react";

// 每個工具頁最下面的一段：資料從哪來、這個工具怎麼做的（工具帶流量、作品集接住流量，決策表 J 系列的共同規則）
export default function ToolNote({ children }: { children: ReactNode }) {
  return <div className="mt-16 pt-6 border-t border-(--border) text-xs text-(--muted) font-light leading-relaxed space-y-2">{children}</div>;
}
