"use client";

import { useEffect, useState } from "react";

// 逐字打出文字，打完游標淡掉。螢幕閱讀器讀的是外層的 sr-only 完整文字（這段 aria-hidden），
// 不會一個字一個字念。
export default function Typewriter({ text, startDelay = 0, speed = 42 }: { text: string; startDelay?: number; speed?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // prefers-reduced-motion：不打字，下一個 tick 直接顯示全文
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setCount(text.length));
      return () => clearTimeout(t);
    }
    let i = 0;
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setCount(i);
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, startDelay, speed]);

  const done = count >= text.length;
  return (
    <>
      <span aria-hidden>{text.slice(0, count)}</span>
      <span
        aria-hidden
        className={`inline-block w-[2px] h-[0.9em] bg-(--accent) ml-0.5 align-middle ${done ? "opacity-0" : "animate-pulse"}`}
      />
    </>
  );
}
