"use client";

import { useEffect } from "react";

// Hero 名字的滑鼠解碼效果：滑鼠移到 [data-scramble="hover"] 上時，文字先變亂碼再一個字一個字解開。
// 只在「寬螢幕＋滑鼠＋沒開減少動態」時啟用。不在載入時播——<h1> 是 LCP 元素，載入時改它的字會讓 LCP 重算。
// 直接改 text node 的 nodeValue（不換掉 node，React 之後照常更新）；半形字換成英數，寬度幾乎不變。
// 2026-11-05 曾經做過全站版（游標光圈、卡片聚光燈、小標解碼…），使用者試完說「頁首就好」，只留 Hero。
const FX_QUERY = "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const KANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン";
const ASCII = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";
const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

function scramble(el: HTMLElement) {
  const node = el.firstChild;
  if (el.dataset.scrambling || el.childNodes.length !== 1 || node?.nodeType !== Node.TEXT_NODE) return;
  el.dataset.scrambleText ??= node.nodeValue ?? "";
  const chars = Array.from(el.dataset.scrambleText);
  const stagger = Math.min(30, 650 / chars.length);
  const start = performance.now();
  el.dataset.scrambling = "";
  const step = (now: number) => {
    const t = now - start;
    let done = true;
    let out = "";
    chars.forEach((c, i) => {
      if (t >= 100 + i * stagger || /\s/.test(c)) out += c;
      else {
        done = false;
        out += c.charCodeAt(0) > 0x2e80 ? pick(KANA) : pick(ASCII);
      }
    });
    node.nodeValue = out;
    if (done) delete el.dataset.scrambling;
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function HeroNameScramble() {
  useEffect(() => {
    if (!matchMedia(FX_QUERY).matches) return;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element).closest<HTMLElement>("[data-scramble='hover']");
      if (el) scramble(el);
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => document.removeEventListener("pointerover", onOver);
  }, []);
  return null;
}
