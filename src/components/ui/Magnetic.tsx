"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

// 滑鼠靠近時元素微微被吸過去。直接改 DOM 的 style.translate，不經過 React state——
// 原本每次 mousemove 都 setState 觸發一次 re-render。只對滑鼠生效（觸控拖曳不會亂跑），
// prefers-reduced-motion 在事件當下查，不用另外存 state。
export default function Magnetic({
  children,
  strength = 0.35,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    el.style.translate = `${x}px ${y}px`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.translate = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="inline-block transition-[translate] duration-250 ease-(--ease-ma)"
    >
      {children}
    </div>
  );
}
