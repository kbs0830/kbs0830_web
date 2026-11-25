"use client";

import { useEffect, useRef, useState } from "react";

// 404 頁的小遊戲「迷子の飛行機」（2026-11-25，使用者：「更有創意一點」）：
// 一架迷路的紙飛機，滑鼠／手指指向哪裡它就慢慢轉過去，←→ 也能轉；飛進高雄（KHH）或福岡（FUK）的圈圈就降落。
// Canvas 2D、零依賴；畫面外或分頁在背景就停；減少動態效果時飛機不自己動，要按鍵／指向才飛。
const AIRPORTS = [
  { code: "KHH", name: "高雄", x: 0.13, y: 0.76 },
  { code: "FUK", name: "福岡", x: 0.87, y: 0.22 },
] as const;
type Landed = { code: string; name: string; sec: number } | null;

export default function LostPlane() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landed, setLanded] = useState<Landed>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = (v: string, d: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || d;

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // 飛機（像素座標，起點在中間偏下、朝右上）
    const plane = { x: w * 0.5, y: h * 0.55, a: -0.5, flying: !reduced };
    const trail: [number, number][] = [];
    let aim: { x: number; y: number } | null = null;
    let turn = 0; // 鍵盤：-1 左、1 右
    let t = 0, start = performance.now(), done = false;

    const draw = () => {
      const accent = css("--accent", "#2d5a8e"), muted = css("--muted", "#6b6b6b"), border = css("--border", "#e5e2dc");
      ctx.clearRect(0, 0, w, h);
      // 航路提示：兩個機場之間的虛線
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AIRPORTS[0].x * w, AIRPORTS[0].y * h);
      ctx.quadraticCurveTo(w * 0.45, h * 0.15, AIRPORTS[1].x * w, AIRPORTS[1].y * h);
      ctx.stroke();
      ctx.setLineDash([]);
      // 機場：一個點＋慢慢呼吸的圈
      for (const ap of AIRPORTS) {
        const x = ap.x * w, y = ap.y * h, r = Math.min(w, h) * 0.075;
        ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 1.5);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = muted;
        ctx.font = "11px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${ap.code} ${ap.name}`, x, y + r + 14);
      }
      // 航跡
      ctx.fillStyle = accent;
      trail.forEach(([x, y], i) => {
        ctx.globalAlpha = (i / trail.length) * 0.35;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      });
      ctx.globalAlpha = 1;
      // 紙飛機（三角形，機頭朝 a）
      ctx.save();
      ctx.translate(plane.x, plane.y);
      ctx.rotate(plane.a);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (!done && plane.flying) {
        // 轉向：指著的方向（或鍵盤），每秒最多轉 2.4 rad；再加一點風
        let want = plane.a + turn * 2;
        if (aim) want = Math.atan2(aim.y - plane.y, aim.x - plane.x);
        let diff = ((want - plane.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        if (!aim && !turn) diff = Math.sin(t * 0.7) * 0.4; // 沒人操作：迷路地晃
        plane.a += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
        const speed = Math.min(w, h) * 0.32;
        plane.x += Math.cos(plane.a) * speed * dt;
        plane.y += Math.sin(plane.a) * speed * dt + Math.sin(t * 0.9) * 6 * dt;
        // 撞到邊就轉回來
        if (plane.x < 8 || plane.x > w - 8 || plane.y < 8 || plane.y > h - 8) {
          plane.x = Math.max(8, Math.min(w - 8, plane.x));
          plane.y = Math.max(8, Math.min(h - 8, plane.y));
          plane.a += Math.PI * 0.6;
        }
        trail.push([plane.x, plane.y]);
        if (trail.length > 60) trail.shift();
        for (const ap of AIRPORTS) {
          if (Math.hypot(plane.x - ap.x * w, plane.y - ap.y * h) < Math.min(w, h) * 0.075) {
            done = true;
            setLanded({ code: ap.code, name: ap.name, sec: Math.round((performance.now() - start) / 100) / 10 });
          }
        }
      }
      draw();
    };
    const run = () => { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? run() : stop()));
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : run());
    document.addEventListener("visibilitychange", onVis);

    const point = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      aim = { x: e.clientX - r.left, y: e.clientY - r.top };
      plane.flying = true;
    };
    const leave = () => (aim = null);
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        turn = e.type === "keydown" ? (e.key === "ArrowLeft" ? -1 : 1) : 0;
        plane.flying = true;
      }
    };
    canvas.addEventListener("pointermove", point);
    canvas.addEventListener("pointerdown", point);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("keydown", key);
    canvas.addEventListener("keyup", key);
    start = performance.now();
    draw();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", point);
      canvas.removeEventListener("pointerdown", point);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("keydown", key);
      canvas.removeEventListener("keyup", key);
    };
  }, [round]);

  return (
    <div className="relative mb-10">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="小遊戲：用滑鼠、手指或左右方向鍵，把迷路的紙飛機帶回高雄或福岡"
        className="w-full aspect-[2/1] border border-(--border) rounded-sm bg-(--surface) touch-none cursor-crosshair focus:outline-none focus-visible:border-(--accent)"
      />
      {landed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-(--bg)/80 rounded-sm">
          <p lang="ja" className="font-serif text-2xl text-(--text)">おかえり</p>
          <p className="text-sm font-light text-(--muted)">
            平安降落 {landed.code} {landed.name} · {landed.sec} 秒
          </p>
          <button
            type="button"
            onClick={() => { setLanded(null); setRound((r) => r + 1); }}
            className="mt-2 font-mono text-[11px] tracking-wide text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)"
          >
            再飛一次
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[12px] font-light text-(--muted)">
          飛機迷路了。滑鼠／手指指向哪裡它就往哪飛（鍵盤：先點一下，再按 ← →），帶它回高雄或福岡。
        </p>
      )}
    </div>
  );
}
