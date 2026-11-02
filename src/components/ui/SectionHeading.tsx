import type { ReactNode } from "react";

// 獨立頁面裡的小節標題（/uses、/resume、作品詳細頁）：靛藍等寬大寫，可選英文副標
export default function SectionHeading({
  children,
  en,
  className = "mb-4",
}: {
  children: ReactNode;
  en?: string;
  className?: string;
}) {
  return (
    <p className={`text-xs tracking-[0.2em] text-(--accent) uppercase font-mono ${className}`}>
      {children}
      {en && <span className="text-(--muted) normal-case tracking-normal"> · {en}</span>}
    </p>
  );
}
