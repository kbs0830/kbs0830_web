import type { ReactNode } from "react";

// 「▸ 一行一項」的清單（/now、/uses、作品詳細頁）
export default function BulletList({ items, className = "space-y-2.5" }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm font-light">
          <span className="text-(--accent) mt-0.5" aria-hidden>▸</span>
          <span className="text-(--text)">{item}</span>
        </li>
      ))}
    </ul>
  );
}
