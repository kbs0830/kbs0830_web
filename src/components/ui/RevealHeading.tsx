"use client";

import type { CSSProperties } from "react";
import { useRevealOnce } from "@/lib/hooks";

// 捲動到時逐字淡入的標題。每個字是一個 span，延遲由 CSS 的 --i 算（globals.css
// [data-reveal-chars]），JS 只負責在進入視窗時加上 data-shown。
export default function RevealHeading({
  text,
  className,
  style,
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}) {
  const ref = useRevealOnce<HTMLHeadingElement>();

  return (
    <h2
      ref={ref}
      data-reveal-chars
      aria-label={text}
      className={className}
      style={{ ...style, "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {Array.from(text).map((char, i) => (
        <span key={i} aria-hidden style={{ "--i": i } as CSSProperties}>
          {char === " " ? " " : char}
        </span>
      ))}
    </h2>
  );
}
