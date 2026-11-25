"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import { Fn, If, Loop, Return, abs, deltaTime, float, hash, instanceIndex, instancedArray, length, max, mix, mx_noise_vec3, normalize, smoothstep, time, uniform, uv, vec3 } from "three/tsl";
import { useAccentColor } from "@/lib/client/hooks";
import { heroShapes, type ShapeName } from "./hero-shapes";

// 桌機 Hero 的 WebGPU 版（2026-11-22，使用者：「電腦版要更多可玩性」）。粒子全在 GPU 上用 compute shader 算，數量依效能自動調整。
// HeroBackground 只在「拿得到真的 GPU adapter、沒開減少動態」時才載入這個；不然照舊是 HeroScene（WebGL）。
// 玩法：
//   - 移動游標：附近的粒子被帶著流動（流場）
//   - 按住不動：粒子慢慢聚到游標；放開：往外散開再回原位
//   - 按住拖曳：沿路留下星點、連成星座線，粒子被星點吸過去；放開 4 秒後淡掉
//   - 雙擊：粒子排成 名字 → 航線圖 → 網站圖示 → 高雄 ⇄ 福岡 → 回到星空（10 秒沒動作也會自己回星空）
// 原則照舊「不跳不彈」：彈簧 k=4、阻尼 4.4，阻尼比約 1.1（稍微過阻尼：不會來回震盪，3 秒內就位）。
//   第一版阻尼比 1.5，過阻尼太多，慢的那個模態時間常數 2.3 秒，形狀 3 秒後還糊成一團
// 星空模式時標題那一塊的粒子調淡（uQuiet），形狀模式不調（那是使用者自己叫出來的）。
// 效能：一開始 1,200 顆，每秒量一次 fps：≥57 就加 50%、<48 就減 30%；最少的時候還 <40 連兩次 → onFallback 換回 WebGL 版。
// 捲出畫面、分頁在背景時完全停畫。

// 上限 8,000：第一版開到 16,384，RTX 3070 跑 100 fps 一下就頂到上限，但滿版的點壓到標題、太吵（2026-11-22 截圖看過）
const MAX = 8000;
const BRIGHT = 90; // 亮的大點固定 90 顆（跟 WebGL 版一樣），多出來的都是淡淡的細點
const SHAPE_HOLD_MS = 10_000; // 換成形狀 10 秒後自己回到星空，不要一直蓋著標題
const START = 1200;
const MIN = 600;
const MAX_STARS = 24;
// 雙擊依序換：星空 → 名字 → 航線圖 → 網站圖示 → 高雄 ⇄ 福岡（B14，2026-11-25）→ 星空
const SHAPES: ShapeName[] = ["stars", "name", "routes", "icon", "cities"];

// ⚠️ vec3 的 storage buffer 要更新時，一律照「每顆 3 個 float」寫進 attr.array（不是 4 個）。
// three（0.187）第一次上傳時會把 CPU 這邊的陣列換成每顆 4 個（補位），但之後每次 needsUpdate 又會把陣列
// 當成每顆 3 個重新補位一次。所以照 4 個寫反而整個錯位（2026-11-22 寫 E2E 時誤判成 bug、改成 4 個，形狀就全亂了）。
// 讀的時候反過來：上傳後的陣列是每顆 4 個，所以 E2E 的 probe 從原始的 shapes 拿「家」的位置，不讀這個陣列。

export default function HeroSceneGPU({ onFallback, noFallback = false }: { onFallback: (reason: string) => void; noFallback?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accent = useAccentColor();
  const accentRef = useRef(accent);
  const setColorRef = useRef<(c: string) => void>(() => {});
  const [hint, setHint] = useState(false);

  useEffect(() => {
    accentRef.current = accent;
    setColorRef.current(accent);
  }, [accent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = container.current;
    if (!canvas || !box) return;
    let disposed = false;
    let raf = 0;
    const cleanups: (() => void)[] = [];

    (async () => {
      const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
      try {
        await renderer.init();
      } catch (e) {
        onFallback(`init: ${e instanceof Error ? e.message : e}`);
        return;
      }
      if (disposed) return renderer.dispose();
      if (!(renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend) {
        // 退回 WebGL2 後端的 WebGPURenderer 比原本的 WebGL 版慢很多（2026-11-22 量過 60 → 12 fps），不要用
        renderer.dispose();
        onFallback("no-webgpu-backend");
        return;
      }
      (window as unknown as { __heroRenderer?: string }).__heroRenderer = "webgpu";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.set(0, 0, 6);
      const rig = new THREE.Group(); // 跟著游標微微傾斜
      scene.add(rig);

      // ── 形狀（每顆粒子的「家」）──────────────────────────────────────
      const shapes = heroShapes(MAX, getComputedStyle(document.documentElement).getPropertyValue("--font-serif").trim() || "serif");
      let shapeIndex = 0;

      // ── GPU 上的粒子資料 ─────────────────────────────────────────────
      const pos = instancedArray(shapes.stars.slice(), "vec3");
      const vel = instancedArray(MAX, "vec3");
      const home = instancedArray(shapes.stars.slice(), "vec3");

      const uCount = uniform(START);
      const uPointer = uniform(new THREE.Vector3(99, 99, 0));
      const uPointerVel = uniform(new THREE.Vector3());
      const uActive = uniform(0); // 游標在 Hero 裡
      const uGather = uniform(0); // 0～1，按住時往上爬
      const uBurst = uniform(0); // 放開那一幀的衝量
      const stars = Array.from({ length: MAX_STARS }, () => new THREE.Vector3(99, 99, 0));
      // 星點用 storage buffer，不用 uniformArray：uniformArray 只在 render 時同步，只有 compute 用到的話 GPU 永遠拿不到（11/22 踩到）
      const starBuf = instancedArray(MAX_STARS, "vec3");
      const syncStars = () => {
        stars.forEach((s, i) => starBuf.value.array.set([s.x, s.y, s.z], i * 3));
        starBuf.value.needsUpdate = true;
      };
      const uStarCount = uniform(0);
      const uStarFade = uniform(0);
      const uColor = uniform(new THREE.Color(accentRef.current));
      const uQuiet = uniform(1); // 1＝星空模式（標題後面調淡），0＝形狀模式

      const update = Fn(() => {
        If(float(instanceIndex).greaterThanEqual(uCount), () => {
          Return();
        });
        const p = pos.element(instanceIndex);
        const v = vel.element(instanceIndex);
        const h = home.element(instanceIndex);
        const dt = deltaTime.min(0.05);

        // 彈簧拉回家（k=4、阻尼 4.4，阻尼比約 1.1）；按住聚集時彈簧放鬆，粒子才拉得過來
        const force = h.sub(p).mul(float(4.0).mul(float(1).sub(uGather.mul(0.8)))).toVar();
        // 慢慢飄的雜訊，讓靜止時也有生命感（形狀模式小一點，字才清楚）
        force.addAssign(mx_noise_vec3(p.mul(0.35).add(time.mul(0.04))).mul(mix(0.08, 0.3, uQuiet)));

        const d = p.sub(uPointer);
        const dist = length(d.xy);
        // 流場：游標附近的粒子順著游標移動的方向被帶走
        const near = float(1).sub(smoothstep(0.0, 1.9, dist)).mul(uActive);
        force.addAssign(vec3(uPointerVel.x, uPointerVel.y, 0).mul(near).mul(5.5));
        // 聚集：往游標拉，越遠拉越弱（不會整團塌成一點）
        const pull = float(1).sub(smoothstep(0.0, 6.0, dist)).mul(uGather);
        force.addAssign(normalize(d.negate().add(vec3(0.0001))).mul(pull).mul(16.0));
        // 散開：放開那一幀往外推
        v.addAssign(normalize(d.add(vec3(0.0001))).mul(uBurst).mul(float(1).sub(smoothstep(0.0, 4.0, dist))).mul(6.0));
        // 星座：被附近的星點吸過去
        Loop(MAX_STARS, ({ i }) => {
          const s = starBuf.element(i);
          const sd = s.sub(p);
          const on = float(i).lessThan(uStarCount).select(float(1), float(0));
          // 用畫面上的距離（xy）判斷誰被吸：星點在 z=0，粒子深度 -5～1，用 3D 距離的話幾乎沒有粒子在範圍內
          force.addAssign(sd.mul(float(1).sub(smoothstep(0.0, 1.2, length(sd.xy)))).mul(on).mul(uStarFade).mul(10.0));
        });

        v.addAssign(force.mul(dt));
        v.mulAssign(float(1).sub(dt.mul(4.4)).max(0));
        p.addAssign(v.mul(dt));
      })().compute(MAX);

      // ── 粒子外觀：小圓點，少數亮一點；動得快的稍微亮 ──────────────────
      const mat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
      mat.positionNode = pos.toAttribute();
      const r = hash(instanceIndex);
      const bright = float(instanceIndex).lessThan(BRIGHT).select(float(1), float(0));
      mat.scaleNode = float(0.016).add(r.mul(0.012)).add(bright.mul(0.034));
      const speed = length(vel.toAttribute());
      const dot = float(1).sub(smoothstep(0.25, 0.5, length(uv().sub(0.5))));
      // 標題那一塊（畫面中間）調淡，星空模式才調
      const wp = pos.toAttribute();
      const inTitle = float(1).sub(smoothstep(0.75, 1.15, max(abs(wp.x).div(3.6), abs(wp.y.add(0.2)).div(1.7))));
      const quiet = float(1).sub(inTitle.mul(uQuiet).mul(0.65));
      mat.colorNode = uColor;
      mat.opacityNode = dot.mul(float(0.16).add(r.mul(0.16)).add(bright.mul(0.5)).add(speed.mul(0.12).min(0.35))).mul(quiet);
      const sprites = new THREE.Sprite(mat);
      sprites.count = START;
      sprites.frustumCulled = false;
      rig.add(sprites);

      // ── 裝飾細線（跟 WebGL 版同樣的語言）──────────────────────────────
      const rand = (s: number, o = 0) => (Math.random() - 0.5) * s + o;
      const linePts: number[] = [];
      for (let i = 0; i < 18; i++) {
        const x = rand(12), y = rand(8), z = rand(4, -2), len = 0.8 + Math.random() * 2, a = Math.random() * Math.PI * 2;
        linePts.push(x, y, z, x + Math.cos(a) * len, y + Math.sin(a) * len, z);
      }
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePts, 3));
      const lineMat = new THREE.LineBasicNodeMaterial({ color: accentRef.current, transparent: true, opacity: 0.28 });
      const decor = new THREE.LineSegments(lineGeo, lineMat);
      const decorGroup = new THREE.Group();
      decorGroup.add(decor);
      rig.add(decorGroup);

      // ── 星座線（CPU 畫，最多 24 個點）──────────────────────────────────
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(MAX_STARS * 2 * 3);
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
      starGeo.setDrawRange(0, 0);
      const starMat = new THREE.LineBasicNodeMaterial({ color: accentRef.current, transparent: true, opacity: 0 });
      const starLines = new THREE.LineSegments(starGeo, starMat);
      starLines.frustumCulled = false;
      rig.add(starLines);

      setColorRef.current = (c) => {
        uColor.value.set(c);
        lineMat.color.set(c);
        starMat.color.set(c);
      };

      // ── 尺寸 ─────────────────────────────────────────────────────────
      const resize = () => {
        const { width, height } = box.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(box);
      cleanups.push(() => ro.disconnect());
      resize();

      // ── 游標 ─────────────────────────────────────────────────────────
      const ndc = { x: 0, y: 0, inside: false };
      const world = new THREE.Vector3();
      const lastWorld = new THREE.Vector3(99, 99, 0);
      const tmp = new THREE.Vector3();
      let down: { x: number; y: number; t: number; mode: "pending" | "gather" | "draw" } | null = null;
      let starCount = 0;
      let fadeAt = 0; // 星座開始淡出的時間（ms），0＝正在畫或沒有
      let burstNext = false;
      let shapeSince = 0; // 換成形狀的時間（ms），0＝星空
      let interacted = false;

      const toWorld = () => {
        tmp.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(camera.position).normalize();
        const t = -camera.position.z / tmp.z;
        world.copy(camera.position).addScaledVector(tmp, t);
        rig.worldToLocal(world);
      };
      const inHero = (e: PointerEvent | MouseEvent) => {
        const r = box.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      };
      const ignored = (e: Event) => !!(e.target as Element | null)?.closest?.("a, button, h1, p, input, nav");
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = box.getBoundingClientRect();
        ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        ndc.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        ndc.inside = inHero(e);
        if (down && down.mode === "pending" && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
          down.mode = "draw";
          starCount = 0;
          fadeAt = 0;
        }
      };
      const onDown = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || e.button !== 0 || !inHero(e) || ignored(e)) return;
        down = { x: e.clientX, y: e.clientY, t: performance.now(), mode: "pending" };
        interacted = true;
      };
      const onUp = () => {
        if (!down) return;
        if (down.mode === "gather") burstNext = true;
        if (down.mode === "draw") fadeAt = performance.now() + 4000;
        down = null;
      };
      const setShape = (i: number) => {
        shapeIndex = i;
        home.value.array.set(shapes[SHAPES[i]]);
        home.value.needsUpdate = true;
        shapeSince = i === 0 ? 0 : performance.now();
      };
      const onDbl = (e: MouseEvent) => {
        if (!inHero(e) || ignored(e)) return;
        setShape((shapeIndex + 1) % SHAPES.length);
        window.getSelection()?.removeAllRanges();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("dblclick", onDbl);
      cleanups.push(() => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("dblclick", onDbl);
      });

      // ── 畫面迴圈 ─────────────────────────────────────────────────────
      let visible = true;
      let count = START;
      let frames = 0;
      let windowStart = 0;
      let slowStrikes = 0;
      let last = 0;
      const loop = (t: number) => {
        raf = 0;
        if (disposed) return;
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
        last = t;

        // 相機：捲動時後退；整組跟游標微微傾斜
        const progress = Math.min(window.scrollY / window.innerHeight, 1);
        camera.position.z += (6 + progress * 2.2 - camera.position.z) * 0.08;
        rig.rotation.y += ((ndc.inside ? ndc.x : 0) * 0.15 - rig.rotation.y) * 0.04;
        rig.rotation.x += ((ndc.inside ? -ndc.y : 0) * 0.1 - rig.rotation.x) * 0.04;
        decorGroup.rotation.y += dt * 0.02;
        decorGroup.rotation.x += dt * 0.008;

        // 游標 → 世界座標、速度（平滑過）
        toWorld();
        uActive.value += ((ndc.inside ? 1 : 0) - uActive.value) * 0.15;
        if (lastWorld.x < 90) {
          tmp.copy(world).sub(lastWorld).divideScalar(dt);
          uPointerVel.value.lerp(tmp.clampLength(0, 12), 0.25);
        }
        lastWorld.copy(world);
        uPointer.value.copy(world);

        if (down && down.mode === "pending" && t - down.t > 220) down.mode = "gather";
        uGather.value += ((down?.mode === "gather" ? 1 : 0) - uGather.value) * 0.06;
        uBurst.value = burstNext ? 1 : 0;
        burstNext = false;

        // 星座：拖曳時每隔一段距離留一個星點
        if (down?.mode === "draw") {
          const prev = starCount ? stars[starCount - 1] : null;
          if (starCount < MAX_STARS && (!prev || prev.distanceTo(world) > 0.55)) {
            stars[starCount].copy(world);
            syncStars();
            if (prev) {
              starPos.set([prev.x, prev.y, prev.z, world.x, world.y, world.z], (starCount - 1) * 6);
              starGeo.attributes.position.needsUpdate = true;
              starGeo.setDrawRange(0, starCount * 2);
            }
            starCount++;
          }
          uStarFade.value += (1 - uStarFade.value) * 0.2;
        } else if (fadeAt && t > fadeAt) {
          uStarFade.value *= 0.96;
          if (uStarFade.value < 0.01) {
            uStarFade.value = 0;
            starCount = 0;
            fadeAt = 0;
            starGeo.setDrawRange(0, 0);
          }
        }
        uStarCount.value = starCount;
        starMat.opacity = 0.5 * uStarFade.value;
        starLines.visible = starCount > 1; // 沒有線就不畫（不然每幀送一次 0 個頂點的 draw）

        // 形狀模式：10 秒後自己回星空；標題後面的調淡跟著模式慢慢切換
        if (shapeSince && t - shapeSince > SHAPE_HOLD_MS) setShape(0);
        uQuiet.value += ((shapeIndex === 0 ? 1 : 0) - uQuiet.value) * 0.05;

        renderer.compute(update);
        renderer.render(scene, camera);

        // 效能：每秒調一次數量
        frames++;
        if (!windowStart) windowStart = t;
        if (t - windowStart >= 1000) {
          const fps = (frames * 1000) / (t - windowStart);
          frames = 0;
          windowStart = t;
          if (fps >= 57 && count < MAX) count = Math.min(MAX, Math.round(count * 1.5));
          else if (fps < 48) count = Math.max(MIN, Math.round(count * 0.7));
          if (count === MIN && fps < 40) slowStrikes++;
          else slowStrikes = 0;
          sprites.count = count;
          uCount.value = count;
          (window as unknown as { __heroParticles?: number; __heroFps?: number }).__heroParticles = count;
          (window as unknown as { __heroFps?: number }).__heroFps = Math.round(fps);
          if (slowStrikes >= 2 && !noFallback) {
            onFallback("slow");
            return;
          }
        }
        if (visible && !document.hidden) raf = requestAnimationFrame(loop);
        else last = 0;
      };
      const start = () => {
        if (!raf && visible && !document.hidden && !disposed) {
          windowStart = 0;
          frames = 0;
          raf = requestAnimationFrame(loop);
        }
      };
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
      });
      io.observe(box);
      const onVis = () => start();
      document.addEventListener("visibilitychange", onVis);
      cleanups.push(() => {
        io.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        cancelAnimationFrame(raf);
        mat.dispose();
        lineMat.dispose();
        starMat.dispose();
        lineGeo.dispose();
        starGeo.dispose();
        renderer.dispose();
      });
      // 給 E2E（e2e/hero-webgpu.spec.ts）看的：GPU 上的粒子真的有照玩法動。sample 會從 GPU 讀回前 n 顆的位置，
      // 只有測試呼叫時才讀，平常零成本
      (window as unknown as { __heroProbe?: unknown }).__heroProbe = {
        shape: () => SHAPES[shapeIndex],
        stars: () => starCount,
        gather: () => uGather.value,
        pointer: () => [uPointer.value.x, uPointer.value.y],
        sample: async (n = 300) => {
          const buf = new Float32Array((await renderer.getArrayBufferAsync(pos.value)) as ArrayBuffer);
          const stride = Math.round(buf.length / MAX); // GPU 上的 vec3 是每顆 4 個 float
          const h = shapes[SHAPES[shapeIndex]]; // 原始資料（每顆 3 個），見檔案開頭的 ⚠️
          const hs = 3;
          const k = Math.min(n, count);
          return {
            pos: Array.from({ length: k }, (_, i) => [buf[i * stride], buf[i * stride + 1], buf[i * stride + 2]]),
            home: Array.from({ length: k }, (_, i) => [h[i * hs], h[i * hs + 1], h[i * hs + 2]]),
          };
        },
      };
      cleanups.push(() => delete (window as unknown as { __heroProbe?: unknown }).__heroProbe);
      start();
      const hintTimer = setTimeout(() => !interacted && setHint(true), 1500);
      cleanups.push(() => clearTimeout(hintTimer));
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((f) => f());
    };
  }, [onFallback, noFallback]);

  return (
    <div ref={container} className="absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} className="block w-full h-full" />
      <p
        className={`absolute left-6 bottom-6 text-[11px] text-(--muted) font-mono tracking-wide pointer-events-none transition-opacity duration-700 ease-(--ease-ma) ${hint ? "opacity-100" : "opacity-0"}`}
      >
        按住聚集 · 拖曳畫星座 · 雙擊換形狀
      </p>
    </div>
  );
}
