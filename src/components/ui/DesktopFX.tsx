"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/lib/hooks";

// 桌機特效層（2026-11-05，使用者要桌機版多一點炫技）。掛在 layout，全站共用一份：
//   - 游標光圈：跟著滑鼠、稍微落後（lerp）；移到連結/按鈕上放大，移到作品卡片上變成實心圓＋「見る」字樣
//   - 點擊漣漪：點哪裡就從那裡擴散一圈細線
//   - 卡片聚光燈＋3D 微傾斜：[data-fx-card] 的元素，滑鼠位置寫進 CSS 變數，樣式在 globals.css
//   - 文字解碼：[data-scramble] 的文字第一次捲進畫面（或滑鼠移上去）時，先變亂碼再一個字一個字解開
//     （"hover" 只在滑鼠移上去時播——Hero 名字是 LCP 元素，載入時不能動它的文字）
// 只在「寬螢幕＋滑鼠＋沒開減少動態」時啟用；手機、觸控、reduced-motion 完全不載入這些行為。
// 全部直接改 DOM（style／CSS 變數／text node），不經過 React state，滑鼠移動時零 re-render。
const FX_QUERY = "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export default function DesktopFX() {
  const enabled = useMediaQuery(FX_QUERY);
  if (!enabled) return null;
  return <Effects />;
}

const KANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン";
const ASCII = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";
const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

const scrambling = new WeakSet<Element>();

/** 文字解碼。只處理「裡面剛好一個 text node」的元素，直接改 nodeValue（不換掉 node，React 之後照常更新）。
 *  全形字換成片假名、半形字換成英數，寬度不變 → 不會造成版面位移。 */
function scramble(el: HTMLElement) {
  const node = el.firstChild;
  if (scrambling.has(el) || el.childNodes.length !== 1 || node?.nodeType !== Node.TEXT_NODE) return;
  el.dataset.scrambleText ??= node.nodeValue ?? "";
  const chars = Array.from(el.dataset.scrambleText);
  const stagger = Math.min(30, 650 / chars.length);
  const start = performance.now();
  scrambling.add(el);
  const step = (now: number) => {
    const t = now - start;
    let done = true;
    let out = "";
    chars.forEach((c, i) => {
      if (t >= 100 + i * stagger || /[\s·・—/|()（）]/.test(c)) out += c;
      else {
        done = false;
        out += c.charCodeAt(0) > 0x2e80 ? pick(KANA) : pick(ASCII);
      }
    });
    node.nodeValue = out;
    if (done) scrambling.delete(el);
    else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const INTERACTIVE = "a, button, summary, [role='tab'], label, select";

function Effects() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  // 游標、漣漪、卡片聚光燈
  useEffect(() => {
    const el = ring.current;
    const lab = label.current;
    if (!el || !lab) return;
    const root = document.documentElement;
    root.setAttribute("data-fx", "");

    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;
    let shown = false;
    let card: HTMLElement | null = null;

    // 只有游標還在追的時候才跑 rAF，停下來就不畫
    const loop = () => {
      rx += (x - rx) * 0.22;
      ry += (y - ry) * 0.22;
      el.style.translate = `${rx}px ${ry}px`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
    };

    const resetCard = (c: HTMLElement) => {
      for (const v of ["--rx", "--ry"]) c.style.removeProperty(v);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        el.dataset.visible = "";
      }
      if (!raf) raf = requestAnimationFrame(loop);

      const c = (e.target as Element).closest<HTMLElement>("[data-fx-card]");
      if (c !== card) {
        if (card) resetCard(card);
        card = c;
      }
      if (c) {
        const r = c.getBoundingClientRect();
        const px = x - r.left;
        const py = y - r.top;
        c.style.setProperty("--mx", `${px}px`);
        c.style.setProperty("--my", `${py}px`);
        c.style.setProperty("--ry", `${(px / r.width - 0.5) * 5}deg`);
        c.style.setProperty("--rx", `${(0.5 - py / r.height) * 5}deg`);
      }
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const t = e.target as Element;
      const interactive = t.closest<HTMLElement>(INTERACTIVE);
      const text = t.closest("input, textarea, [contenteditable='true']");
      const cursorLabel = interactive?.dataset.cursor;
      el.dataset.state = text ? "text" : cursorLabel ? "label" : interactive ? "link" : "";
      lab.textContent = cursorLabel ?? "";
      const s = t.closest<HTMLElement>("[data-scramble]");
      if (s) scramble(s);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.dataset.down = "";
      const ripple = document.createElement("span");
      ripple.className = "fx-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.addEventListener("animationend", () => ripple.remove());
      document.body.appendChild(ripple);
    };
    const onUp = () => delete el.dataset.down;

    // 滑鼠離開視窗：光圈淡出，回來時從游標位置重新出現（不會從上次的位置飛過來）
    const onLeave = () => {
      shown = false;
      delete el.dataset.visible;
      if (card) resetCard(card);
      card = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeAttribute("data-fx");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // 文字解碼：每次換頁重新掃一次這頁的 [data-scramble]，捲進畫面時播一次
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          scramble(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    document.querySelectorAll("[data-scramble]:not([data-scramble='hover'])").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [pathname]);

  return (
    <div ref={ring} className="fx-cursor" aria-hidden>
      <span ref={label} className="fx-cursor-label" />
    </div>
  );
}
