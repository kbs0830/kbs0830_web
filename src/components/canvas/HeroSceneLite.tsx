"use client";

import { useEffect, useRef } from "react";
import { ensureSky, moonNow, SYNODIC_DAYS, skyNow } from "@/lib/client/sky";

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

// 天空同步（2026-11-25，lib/client/sky.ts）：下雨畫斜斜的雨絲、福岡櫻花季畫幾片花瓣，數量用 amount 慢慢淡入淡出。
// 用螢幕比例座標（0～1），不走 3D 投影，便宜
const RAIN = Array.from({ length: 40 }, () => ({ x: Math.random() * 1.2, y: Math.random(), v: 0.8 + Math.random() * 0.4, a: 0.5 + Math.random() * 0.5 }));
const PETALS = Array.from({ length: 14 }, () => ({ x: Math.random() * 1.1, y: Math.random(), v: 0.7 + Math.random() * 0.6, ph: Math.random() * 6.3 }));
const weatherFx = { rain: 0, petals: 0 };

// 夜空（2026-11-26，使用者：「夜晚要有流星星空的感覺」「手機版線條拿掉改成一閃一閃的星星＋流星＋月亮」「早上用線條，太陽太不舒服」）：
// 時段是 night 時線條／粒子淡出、星空淡入（night.v 0～1，慢慢換）；白天、清晨、黃昏照舊是線條，不畫太陽。
// 星星各自用不同速度明暗（sin），幾顆亮的多一個十字光芒；流星 3～8 秒一顆；月亮照真的月相畫（lib/client/sky.ts moonPhase）。
// 天氣：多雲星星少一半、霧／雨幾乎看不到、雷雨全暗；下雨不出流星。
const STARS = Array.from({ length: 120 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.92,
  r: 0.45 + Math.random() ** 3 * 1.3,
  a: 0.35 + Math.random() * 0.65,
  sp: 0.5 + Math.random() * 2,
  ph: Math.random() * Math.PI * 2,
}));
const STAR_VIS = { clear: 1, cloud: 0.5, fog: 0.25, rain: 0.15, storm: 0.04 } as const;
const MOON_VIS = { clear: 1, cloud: 0.6, fog: 0.35, rain: 0.25, storm: 0.1 } as const;
const night = { v: -1, meteor: { start: -10, x: 0, y: 0, dx: 0, dy: 0, life: 0.8 }, next: 2 };

/** 月亮：先畫整顆很淡的暗面，再畫亮的那塊。k＝cos(月相角)，1＝新月、-1＝滿月；盈＝右邊亮、虧＝左邊亮（鏡像） */
function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, lit: string, dark: boolean) {
  const { age, waxing } = moonNow();
  const k = Math.cos((age / SYNODIC_DAYS) * Math.PI * 2);
  ctx.save();
  ctx.translate(x, y);
  if (!waxing) ctx.scale(-1, 1);
  // 光暈：越接近滿月越亮（深色主題才明顯）
  const glow = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 3.2);
  glow.addColorStop(0, lit);
  glow.addColorStop(1, "transparent");
  ctx.globalAlpha = alpha * ((dark ? 0.16 : 0.06) * (1 - k) * 0.5 + 0.02);
  ctx.fillStyle = glow;
  ctx.fillRect(-r * 3.2, -r * 3.2, r * 6.4, r * 6.4);
  // 暗面
  ctx.globalAlpha = alpha * (dark ? 0.08 : 0.06);
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // 亮面：右半圓（上→右→下），再沿明暗交界的橢圓回到上面；眉月往右凸（k>0）、凸月往左凸（k<0）
  ctx.globalAlpha = alpha * (dark ? 0.92 : 0.45); // 淺色主題用強調色畫，實心太重
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.ellipse(0, 0, r * Math.abs(k), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
  ctx.fill();
  ctx.restore();
}

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
    ensureSky();
    let color = "", starColor = "", moonColor = "", dark = false;
    const readColor = () => {
      color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2d5a8e";
      dark = document.documentElement.dataset.theme === "dark";
      // 深色主題：白色星星、淡黃月亮；淺色主題（背景是米白）用強調色，不然看不到
      starColor = dark ? "#f2efe6" : color;
      moonColor = dark ? "#f3e9c6" : color;
    };
    readColor();
    // 一開始就是夜晚的話直接顯示星空，不要從線條淡過去
    night.v = skyNow().phase === "night" ? 1 : 0;
    night.next = 2; // t 每次掛載從 0 算，流星排程也要重來
    night.meteor.start = -10;

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

    // 夜空：星星（各自明暗）＋月亮＋流星。跟著傾斜微微移動（比線條少，像很遠的東西）
    const drawNight = (nf: number) => {
      const sky = skyNow();
      const vis = STAR_VIS[sky.weather];
      const ox = tilt.x * 6, oy = tilt.y * 4;
      ctx.fillStyle = ctx.strokeStyle = starColor;
      ctx.lineWidth = 0.6;
      for (const st of STARS) {
        const tw = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(t * st.sp + st.ph);
        const a = nf * vis * st.a * (0.25 + 0.75 * tw);
        if (a < 0.02) continue;
        const x = st.x * w + ox, y = st.y * h + oy;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, st.r, 0, Math.PI * 2);
        ctx.fill();
        if (st.r > 1.25) {
          // 亮星的十字光芒，跟著閃
          const len = st.r * (2.5 + tw * 2.5);
          ctx.globalAlpha = a * 0.45;
          ctx.beginPath();
          ctx.moveTo(x - len, y);
          ctx.lineTo(x + len, y);
          ctx.moveTo(x, y - len);
          ctx.lineTo(x, y + len);
          ctx.stroke();
        }
      }
      // 月亮：右上（左上是天氣那行字、右邊中段是直書片假名）
      const mr = Math.max(14, Math.min(w, h) * 0.05);
      drawMoon(ctx, w * 0.74 + ox * 0.6, h * 0.2 + oy * 0.6, mr, nf * MOON_VIS[sky.weather], moonColor, dark);
      // 流星：頭亮、尾巴漸淡
      const m = night.meteor;
      const p = (t - m.start) / m.life;
      if (p >= 0 && p <= 1) {
        const ease = 1 - (1 - p) ** 2;
        const hx = m.x + m.dx * ease, hy = m.y + m.dy * ease;
        const tail = 0.28 * (1 - Math.abs(p - 0.4)); // 中段最長
        const tx = hx - m.dx * tail, ty = hy - m.dy * tail;
        const fade = nf * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85);
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, "transparent");
        g.addColorStop(1, starColor);
        ctx.globalAlpha = fade;
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        ctx.fillStyle = starColor;
        ctx.beginPath();
        ctx.arc(hx, hy, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const nf = Math.max(0, night.v);
      if (nf > 0.01) drawNight(nf);
      ctx.strokeStyle = ctx.fillStyle = color;
      ctx.lineWidth = 1;
      const tiltY = tilt.x * 0.18, tiltX = -tilt.y * 0.12;
      const bob = Math.sin(t * 0.6) * 0.12;
      const day = 1 - nf; // 線條、粒子跟夜空交叉淡入淡出

      if (day > 0.01) for (const l of LINES) {
        const [ax, ay] = project(l.a, spinLines + tiltY, spinLines * 0.4 + tiltX, bob);
        const [bx, by] = project(l.b, spinLines + tiltY, spinLines * 0.4 + tiltX, bob);
        ctx.globalAlpha = l.opacity * day;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.4 * day;
      if (day > 0.01) for (const d of DOTS) {
        const [x, y, s] = project(d, spinDots + tiltY, tiltX, 0);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.6, s * 0.012), 0, Math.PI * 2);
        ctx.fill();
      }
      // 雨絲：細線、微微往左斜
      if (weatherFx.rain > 0.01) {
        const storm = skyNow().weather === "storm";
        const len = (storm ? 0.05 : 0.035) * h;
        const n = Math.round(RAIN.length * weatherFx.rain);
        for (let i = 0; i < n; i++) {
          const d = RAIN[i];
          const x = d.x * w, y = d.y * h;
          ctx.globalAlpha = 0.22 * d.a * Math.min(1, weatherFx.rain * 1.5);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + len * 0.16, y - len);
          ctx.stroke();
        }
      }
      // 花瓣：淡粉色小橢圓
      if (weatherFx.petals > 0.01) {
        ctx.fillStyle = "#e9a6bb";
        for (const q of PETALS) {
          ctx.globalAlpha = 0.7 * weatherFx.petals;
          ctx.beginPath();
          ctx.ellipse(q.x * w, q.y * h, 3.2, 2, q.ph + t, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    draw();
    // 看 canvas 自己的尺寸（不是 window resize）：手機捲動時網址列伸縮會一直觸發 window resize，
    // Hero 用 svh 高度不會變，這裡就不會白白重設畫布
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    if (reduced) return () => ro.disconnect();

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
      const sky = skyNow();
      night.v += ((sky.phase === "night" ? 1 : 0) - night.v) * Math.min(1, sec * 0.5);
      if (night.v > 0.5 && t >= night.next) {
        night.next = t + 3 + Math.random() * 5;
        if (sky.weather === "clear" || sky.weather === "cloud") {
          // 從畫面上半部往左下劃過，角度、長度每顆不太一樣
          const ang = ((20 + Math.random() * 20) * Math.PI) / 180;
          const dist = (0.5 + Math.random() * 0.3) * w;
          night.meteor = {
            start: t,
            x: (0.45 + Math.random() * 0.5) * w,
            y: Math.random() * 0.4 * h,
            dx: -Math.cos(ang) * dist,
            dy: Math.sin(ang) * dist,
            life: 0.7 + Math.random() * 0.4,
          };
        }
      }
      const rainTarget = sky.weather === "storm" ? 1 : sky.weather === "rain" ? 0.6 : 0;
      weatherFx.rain += (rainTarget - weatherFx.rain) * Math.min(1, sec * 0.6);
      weatherFx.petals += ((sky.sakura ? 1 : 0) - weatherFx.petals) * Math.min(1, sec * 0.5);
      if (weatherFx.rain > 0.01) {
        const speed = sky.weather === "storm" ? 1.5 : 1;
        for (const d of RAIN) {
          d.y += sec * speed * d.v;
          d.x -= sec * speed * d.v * 0.16 * (h / Math.max(w, 1));
          if (d.y > 1.05) { d.y = -0.05; d.x = Math.random() * 1.2; }
        }
      }
      if (weatherFx.petals > 0.01) {
        for (const q of PETALS) {
          q.y += sec * 0.05 * q.v;
          q.x += sec * (Math.sin(t * 0.8 + q.ph) * 0.03 - 0.015);
          if (q.y > 1.05) { q.y = -0.05; q.x = Math.random() * 1.1; }
        }
      }
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

    // 切換深淺色主題時換線條顏色
    const mo = new MutationObserver(readColor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    start();
    return () => {
      stop();
      io.disconnect();
      mo.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("deviceorientation", onOrient);
      removeEventListener("touchmove", onTouch);
      removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
