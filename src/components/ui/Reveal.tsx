"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRevealOnce } from "@/lib/hooks";

// 捲動到才淡入。原本 About／Portfolio／Contact 各自用 framer-motion 的
// useInView + motion.div 重寫了 6 份，只差在位移方向/距離/時間，收斂成這一個。
// 樣式在 globals.css 的 [data-reveal]。
export default function Reveal({
  children,
  from = "up",
  delay = 0,
  distance,
  duration,
  margin,
  className,
}: {
  children: ReactNode;
  from?: "up" | "left";
  delay?: number;
  distance?: number;
  duration?: number;
  margin?: number;
  className?: string;
}) {
  const ref = useRevealOnce<HTMLDivElement>(margin);
  const style = {
    "--reveal-delay": `${delay}s`,
    ...(distance !== undefined && { "--reveal-distance": `${distance}px` }),
    ...(duration !== undefined && { "--reveal-duration": `${duration}s` }),
  } as CSSProperties;

  return (
    <div ref={ref} data-reveal={from} className={className} style={style}>
      {children}
    </div>
  );
}
