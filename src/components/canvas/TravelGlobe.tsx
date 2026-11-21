"use client";

import { useEffect, useRef, useState } from "react";
import type { Arc, Place } from "@/lib/travel";
import { useAccentColor } from "@/lib/hooks";

// 旅行地球（TODO A5，2026-11-21）：Canvas 2D 正射投影，桌機手機同一套（不載 three.js）。
// 畫面語言跟 Hero 一樣：經緯線細線、大圓航線弧線、住過的城市點；沒有底圖（跟 RouteMap 一樣）。
// - 拖曳轉動；「全球／東亞」切換遠近；點城市（或下面清單的按鈕）看住過幾間、起降幾次
// - 慢慢自轉；減少動態時不轉、切換不做動畫；捲出畫面或分頁在背景就完全停畫
// - DPR 上限 2

const DEG = Math.PI / 180;
const VIEWS = { globe: { scale: 0.42, lat: 25, lon: 125 }, asia: { scale: 1.6, lat: 30, lon: 128 } } as const;
type ViewKey = keyof typeof VIEWS;

interface Projected {
  x: number;
  y: number;
  depth: number; // > 0 在正面
}

/** 地球上一點（可以浮在表面上方 lift 倍）投影到畫面；r＝地球在畫面上的半徑 */
function project(lat: number, lon: number, lat0: number, lon0: number, r: number, cx: number, cy: number, lift = 1): Projected {
  const la = lat * DEG;
  const dl = (lon - lon0) * DEG;
  const l0 = lat0 * DEG;
  const x1 = Math.cos(la) * Math.cos(dl);
  const right = Math.cos(la) * Math.sin(dl);
  const up = -Math.sin(l0) * x1 + Math.cos(l0) * Math.sin(la);
  const depth = Math.cos(l0) * x1 + Math.sin(l0) * Math.sin(la);
  return { x: cx + right * r * lift, y: cy - up * r * lift, depth: depth * lift };
}

/** 大圓上的點（球面線性插值），回傳 [lat, lon] 陣列 */
function greatCircle(a: [number, number], b: [number, number], steps: number): [number, number][] {
  const toV = ([lat, lon]: [number, number]) => [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)];
  const va = toV(a);
  const vb = toV(b);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const omega = Math.acos(dot);
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s1 = omega < 1e-6 ? 1 - t : Math.sin((1 - t) * omega) / Math.sin(omega);
    const s2 = omega < 1e-6 ? t : Math.sin(t * omega) / Math.sin(omega);
    const v = [s1 * va[0] + s2 * vb[0], s1 * va[1] + s2 * vb[1], s1 * va[2] + s2 * vb[2]];
    out.push([Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG, Math.atan2(v[1], v[0]) / DEG]);
  }
  return out;
}

export default function TravelGlobe({ places, arcs }: { places: Place[]; arcs: Arc[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accent = useAccentColor();
  const [view, setView] = useState<ViewKey>("globe");
  const [selected, setSelected] = useState<Place | null>(null);
  // 動畫狀態放 ref：每幀都要改，不走 React state
  type View = { lat: number; lon: number; scale: number };
  const cam = useRef<View & { target: View | null }>({ ...VIEWS.globe, target: null });
  const selectedRef = useRef<Place | null>(null);
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    selectedRef.current = selected;
    kick.current();
  }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(document.documentElement);
    const color = (v: string, fb: string) => css.getPropertyValue(v).trim() || fb;
    const muted = color("--muted", "#6b6b6b");
    const border = color("--border", "#e0ddd8");
    const text = color("--text", "#1a1a1a");
    const mono = css.getPropertyValue("--font-mono").trim() || "monospace"; // canvas 的 font 吃不了 var()
    // 弧線高度跟航線長度成正比：台灣–日本低低的，飛美國那條拱比較高
    const angle = (a: Arc) => {
      const [la1, lo1] = a.from.map((v) => v * DEG);
      const [la2, lo2] = a.to.map((v) => v * DEG);
      return Math.acos(Math.min(1, Math.sin(la1) * Math.sin(la2) + Math.cos(la1) * Math.cos(la2) * Math.cos(lo2 - lo1)));
    };
    const arcPaths = arcs.map((a) => ({ ...a, pts: greatCircle(a.from, a.to, 48), height: Math.min(0.25, angle(a) * 0.25) }));
    const maxCount = Math.max(1, ...arcs.map((a) => a.count));

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      draw();
    };

    const draw = () => {
      if (!w) return;
      const c = cam.current;
      const r = Math.min(w, h) * c.scale;
      const cx = w / 2;
      const cy = h / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // 地球輪廓
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 經緯線（每 30°，只畫正面）
      ctx.strokeStyle = border;
      ctx.lineWidth = 0.6;
      const line = (pts: [number, number][]) => {
        ctx.beginPath();
        let pen = false;
        for (const [la, lo] of pts) {
          const p = project(la, lo, c.lat, c.lon, r, cx, cy);
          if (p.depth > 0) {
            if (pen) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();
      };
      for (let lat = -60; lat <= 60; lat += 30) line(Array.from({ length: 73 }, (_, i) => [lat, i * 5 - 180] as [number, number]));
      for (let lon = -180; lon < 180; lon += 30) line(Array.from({ length: 37 }, (_, i) => [i * 5 - 90, lon] as [number, number]));

      // 航線：浮在表面上的大圓弧，被地球擋住的那段不畫
      for (const a of arcPaths) {
        const n = a.pts.length - 1;
        const lift = (i: number) => 1 + a.height * Math.sin((Math.PI * i) / n);
        ctx.beginPath();
        let pen = false;
        a.pts.forEach(([la, lo], i) => {
          const p = project(la, lo, c.lat, c.lon, r, cx, cy, lift(i));
          const hidden = p.depth < 0 && Math.hypot(p.x - cx, p.y - cy) < r;
          if (!hidden) {
            if (pen) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            pen = true;
          } else pen = false;
        });
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.35 + 0.5 * (a.count / maxCount);
        ctx.lineWidth = 0.8 + 1.2 * (a.count / maxCount);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 地點：住過的城市大一點，只有機場的小點
      for (const pl of places) {
        const p = project(pl.lat, pl.lon, c.lat, c.lon, r, cx, cy);
        if (p.depth <= 0) continue;
        const size = pl.hotels ? 1.8 + Math.min(3, Math.sqrt(pl.hotels)) : 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = pl.hotels ? accent : muted;
        ctx.fill();
      }

      // 選到的地點：外圈＋名字
      const sel = selectedRef.current;
      if (sel) {
        const p = project(sel.lat, sel.lon, c.lat, c.lon, r, cx, cy);
        if (p.depth > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.font = `12px ${mono}`;
          ctx.fillStyle = text;
          ctx.fillText(sel.name, p.x + 11, p.y + 4);
        }
      }
    };

    // ── 動畫迴圈：需要時才跑（自轉中、切換視角中、拖曳中）──────────────────
    let raf = 0;
    let last = 0;
    let visible = true;
    let dragging = false;
    let idleUntil = 0; // 拖完 3 秒內不自轉
    const step = (t: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const c = cam.current;
      let moving = false;
      if (c.target) {
        const k = reduce ? 1 : 1 - Math.pow(0.002, dt); // 指數趨近，不彈
        const dLon = ((c.target.lon - c.lon + 540) % 360) - 180;
        c.lon += dLon * k;
        c.lat += (c.target.lat - c.lat) * k;
        c.scale += (c.target.scale - c.scale) * k;
        if (Math.abs(dLon) < 0.05 && Math.abs(c.target.lat - c.lat) < 0.05 && Math.abs(c.target.scale - c.scale) < 0.002) {
          c.lon = c.target.lon;
          c.lat = c.target.lat;
          c.scale = c.target.scale;
          c.target = null;
        } else moving = true;
      } else if (!reduce && !dragging && t > idleUntil) {
        c.lon += 4 * dt; // 每秒 4°，一圈 90 秒
        moving = true;
      }
      draw();
      if ((moving || dragging) && visible && !document.hidden) raf = requestAnimationFrame(step);
      else last = 0;
    };
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(step);
    };
    kick.current = start;

    // ── 拖曳、點選 ───────────────────────────────────────────────────────
    let down: { x: number; y: number; lat: number; lon: number; moved: boolean } | null = null;
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY, lat: cam.current.lat, lon: cam.current.lon, moved: false };
      dragging = true;
      cam.current.target = null;
      start();
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const r = Math.min(w, h) * cam.current.scale;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (Math.hypot(dx, dy) > 4) down.moved = true;
      cam.current.lon = down.lon - (dx / r) * 57;
      cam.current.lat = Math.max(-75, Math.min(75, down.lat + (dy / r) * 57));
    };
    const onUp = (e: PointerEvent) => {
      if (down && !down.moved) {
        // 點一下：找最近的正面地點（14px 內）
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const c = cam.current;
        const r = Math.min(w, h) * c.scale;
        let best: { pl: Place; d: number } | null = null;
        for (const pl of places) {
          const p = project(pl.lat, pl.lon, c.lat, c.lon, r, w / 2, h / 2);
          if (p.depth <= 0) continue;
          const d = Math.hypot(p.x - mx, p.y - my);
          if (d < 14 && (!best || d < best.d)) best = { pl, d };
        }
        setSelected(best ? best.pl : null);
      }
      down = null;
      dragging = false;
      idleUntil = performance.now() + 3000;
      start();
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onVis = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVis);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [arcs, places, accent]);

  const focus = (pl: Place) => {
    setSelected(pl);
    cam.current.target = { lat: pl.lat, lon: pl.lon, scale: Math.max(cam.current.scale, VIEWS.asia.scale) };
    kick.current();
  };

  const byCountry = new Map<string, Place[]>();
  for (const pl of places) byCountry.set(pl.country, [...(byCountry.get(pl.country) ?? []), pl]);

  return (
    <div>
      <div className="relative border border-(--border) rounded-sm bg-(--surface) overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block w-full aspect-square sm:aspect-[4/3] touch-none cursor-grab active:cursor-grabbing"
          role="img"
          aria-label={`旅行地球：${places.length} 個去過的地方、${arcs.length} 條航線。下面的清單可以用鍵盤選。`}
        />
        <div className="absolute top-3 right-3 flex text-[11px] font-mono border border-(--border) rounded-sm overflow-hidden bg-(--bg)">
          {(["globe", "asia"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={view === k}
              onClick={() => {
                setView(k);
                cam.current.target = { ...VIEWS[k] };
                kick.current();
              }}
              className={`px-2.5 py-1.5 transition-colors ${view === k ? "bg-(--accent) text-(--bg)" : "text-(--muted) hover:text-(--accent)"}`}
            >
              {k === "globe" ? "全球" : "東亞"}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="absolute left-3 bottom-3 right-3 text-xs font-light text-(--text) pointer-events-none">
          {selected ? (
            <span className="inline-block bg-(--bg) border border-(--border) rounded-sm px-2.5 py-1.5">
              <span className="font-normal">{selected.name}</span>
              <span className="text-(--muted)">
                {" "}
                · {selected.country}
                {selected.hotels > 0 && ` · 住過 ${selected.hotels} 間`}
                {selected.flights > 0 && ` · 起降 ${selected.flights} 次`}
              </span>
            </span>
          ) : (
            <span className="text-(--muted)">拖曳轉動，點城市看住過幾間</span>
          )}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {[...byCountry.entries()].map(([country, list]) => (
          <div key={country} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xs text-(--muted) font-mono w-14 shrink-0">{country}</span>
            {list.map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => focus(pl)}
                aria-pressed={selected?.id === pl.id}
                className={`text-[13px] font-light transition-colors ${selected?.id === pl.id ? "text-(--accent)" : "text-(--text) hover:text-(--accent)"}`}
              >
                {pl.name}
                {pl.hotels > 0 && <span className="text-(--muted) text-[11px] font-mono"> {pl.hotels}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
