"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type CSSProperties } from "react";

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
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const chars = Array.from(text);

  return (
    <h2 ref={ref} className={className} style={style}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: delay + i * 0.02 }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </h2>
  );
}
