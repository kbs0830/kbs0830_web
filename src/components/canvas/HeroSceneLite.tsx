"use client";

import { useEffect, useRef } from "react";

// 手機版 Hero 背景：桌機 HeroScene（three.js）的同一個畫面語言——稀疏細線＋靛藍粒子、慢速旋轉——
// 改用 Canvas 2D 自己做 3D 投影，不載 three.js（這支約 2KB）。
// 互動：手機傾斜（陀螺儀，Android 不用授權；iOS 要跳授權視窗，太打擾就不做）或手指滑過，整個場景跟著微微轉。
// 省電：最多 30fps、捲出畫面或切到別的分頁就完全停、prefers-reduced-motion 只畫一張靜態圖、DPR 上限 2。

const rand = (spread: number, offset = 0) => (Math.random() - 0.5) * spread + offset;

// 直式螢幕比桌機窄，x 方向的散布範圍縮小，線條才不會大半落在畫面外
const LINES = Array.from({ length: 14 }, () => {
  const x = rand(7), y = rand(9), z = rand(4, -2);
  const len = 0.8 + Math.random() * 1.8, angle = Math.random() * Math.PI * 2;
  return { a: [x, y, z], b: [x + Math.cos(angle) * len, y + Math.sin(angle) * len, z], opacity: 0.22 + Math.random() * 0.2 };
});
const DOTS = Array.from({ length: 46 }, () => [rand(9), rand(11), rand(6, -2)]);

const CAMERA_Z = 6;
const FOV = (55 * Math.PI) / 180; // 跟桌機場景同一個相機
const FRAME_MS = 1000 / 30 - 4; // 60Hz 螢幕上 rAF 間隔約 16.7ms，留點餘裕才會穩定每兩幀畫一次（≈30fps）

export default function HeroSceneLite() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let color = "";
    const readColor = () => (color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2d5a8e");
    readColor();

    let w = 0, h = 0, focal = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      focal = h / 2 / Math.tan(FOV / 2);
    };

    // 傾斜目標值（-1～1），每幀用 lerp 慢慢靠過去，跟桌機的 PointerRig 同樣手感
    const target = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    let spinLines = 0, spinDots = 0, t = 0;

    const project = (p: number[], rotY: number, rotX: number, bob: number): [number, number, number] => {
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
      const x1 = p[0] * cy + p[2] * sy;
      const z1 = -p[0] * sy + p[2] * cy;
      const y1 = (p[1] + bob) * cx - z1 * sx;
      const z2 = (p[1] + bob) * sx + z1 * cx;
      const s = focal / (CAMERA_Z - z2);
      return [w / 2 + x1 * s, h / 2 - y1 * s, s];
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = ctx.fillStyle = color;
      ctx.lineWidth = 1;
      const tiltY = tilt.x * 0.18, tiltX = -tilt.y * 0.12;
      const bob = Math.sin(t * 0.6) * 0.12;

      for (const l of LINES) {
        const [ax, ay] = project(l.a, spinLines + tiltY, spinLines * 0.4 + tiltX, bob);
        const [bx, by] = project(l.b, spinLines + tiltY, spinLines * 0.4 + tiltX, bob);
        ctx.globalAlpha = l.opacity;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.4;
      for (const d of DOTS) {
        const [x, y, s] = project(d, spinDots + tiltY, tiltX, 0);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.6, s * 0.012), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    resize();
    draw();
    if (reduced) {
      const onResize = () => { resize(); draw(); };
      addEventListener("resize", onResize);
      return () => removeEventListener("resize", onResize);
    }

    let raf = 0, last = 0, visible = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      if (dt < FRAME_MS) return;
      last = now;
      const sec = Math.min(dt, 100) / 1000; // 切回分頁時不要一次跳一大段
      t += sec;
      spinLines += sec * 0.02;
      spinDots += sec * 0.015;
      tilt.x += (target.x - tilt.x) * 0.08;
      tilt.y += (target.y - tilt.y) * 0.08;
      draw();
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // 陀螺儀：gamma 左右傾（-90～90）、beta 前後傾（拿著手機大約 45° 當中心）
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.x = Math.max(-1, Math.min(1, e.gamma / 30));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };
    // 手指滑過：跟桌機滑鼠一樣，用位置當傾斜量；放開後慢慢回正
    const onTouch = (e: TouchEvent) => {
      const p = e.touches[0];
      if (!p) return;
      target.x = (p.clientX / innerWidth) * 2 - 1;
      target.y = (p.clientY / innerHeight) * 2 - 1;
    };
    const onTouchEnd = () => { target.x = 0; target.y = 0; };
    addEventListener("deviceorientation", onOrient);
    addEventListener("touchmove", onTouch, { passive: true });
    addEventListener("touchend", onTouchEnd, { passive: true });
    addEventListener("resize", resize);

    // 切換深淺色主題時換線條顏色
    const mo = new MutationObserver(readColor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    start();
    return () => {
      stop();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("deviceorientation", onOrient);
      removeEventListener("touchmove", onTouch);
      removeEventListener("touchend", onTouchEnd);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
