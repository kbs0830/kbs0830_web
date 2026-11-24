import type { ReactNode } from "react";

// 獨立頁面裡的小節標題（/uses、/resume、作品詳細頁）：靛藍等寬大寫，可選英文副標
export default function SectionHeading({
  children,
  en,
  className = "mb-4",
  as: Tag = "p",
}: {
  children: ReactNode;
  en?: string;
  className?: string;
  /** 長頁面（/reports）要用真的標題，螢幕閱讀器才能按標題跳；樣式一樣 */
  as?: "p" | "h2";
}) {
  return (
    <Tag className={`text-xs tracking-[0.2em] text-(--accent) uppercase font-mono font-normal ${className}`}>
      {children}
      {en && <span className="text-(--muted) normal-case tracking-normal"> · {en}</span>}
    </Tag>
  );
}
