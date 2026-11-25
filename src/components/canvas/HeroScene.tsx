"use client";

import { useRef, useMemo, useEffect, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  LineSegments,
  Matrix4,
  OctahedronGeometry,
  Points,
  Quaternion,
  Vector3,
} from "three";
import { useAccentColor, usePrefersReducedMotion } from "@/lib/client/hooks";

// 桌機 Hero 3D 背景：稀疏細線＋靛藍粒子，慢速旋轉。2026-11-05 加上互動（使用者要桌機多一點炫技）：
//   - 游標靠近時粒子被輕輕推開，離開後彈簧拉回原位（不彈跳：阻尼夠大，沒有來回震盪）
//   - 游標附近的粒子跟游標、彼此之間連出細線（星座）
//   - 點一下 Hero 空白處，從點擊位置擴散一圈衝擊波把粒子推開
//   - 往下捲時相機慢慢後退，場景整個捲出畫面後 frameloop 停掉（不再每秒畫 60 張看不到的圖）
// 全部在 useFrame 裡直接改 BufferAttribute，不經過 React state。
// 2026-11-22 晚：WebGPU 粒子版使用者試了覺得「有點複雜（煩），線條就不錯，有時加個流星」→ 桌機預設改回這版，加上 Meteor。

// 裝飾用的隨機座標在 module 載入時產生一次（這個檔案只在桌機、client 端載入）。
const rand = (spread: number, offset = 0) => (Math.random() - 0.5) * spread + offset;

// 背景線條（11/23 使用者：「線條可以再多一點」→「更豐富、更有深度（立體）一點」）：
//   - 每條線是真的 3D 方向（不再全部平貼在同一個平面），前後拉開 11 個單位
//   - 透明度依「跟鏡頭的距離」每幀重算：近的濃、遠的淡（空氣透視），整組慢慢轉的時候會看到線條一前一後地浮現
//   - 約三分之一的線一端有個小節點
const LINE_COUNT = 44;
const LINE_SPECS = Array.from({ length: LINE_COUNT }, () => {
  const x = rand(16);
  const y = rand(10);
  const z = rand(11, -3.5);
  const th = Math.random() * Math.PI * 2;
  const dz = rand(1.4); // 不要正對鏡頭（那樣看起來只是一個點）
  const r = Math.sqrt(1 - dz * dz);
  const len = 0.8 + Math.random() * 1.8;
  return {
    a: [x, y, z] as const,
    b: [x + r * Math.cos(th) * len, y + r * Math.sin(th) * len, z + dz * len] as const,
    base: 0.3 + Math.random() * 0.2,
    node: Math.random() < 0.35,
  };
});
const NODE_SPECS = LINE_SPECS.filter((l) => l.node);
// 距離鏡頭 4 → 1（最濃）、17 → 0.08（最淡）
const depthFade = (d: number) => Math.max(0.08, Math.min(1, 1 - (d - 4) / 13)) ** 1.3;

const DOT_COUNT = 50; // 11/23 使用者：「粒子效果少一點」（原本 90）
const DOT_REST = Float32Array.from({ length: DOT_COUNT * 3 }, (_, i) =>
  i % 3 === 0 ? rand(14) : i % 3 === 1 ? rand(10) : rand(6, -2),
);

const REPEL_RADIUS = 0.32; // 螢幕座標（NDC，x 已乘上長寬比）
const LINK_RADIUS = 0.42;
const MAX_LINKS = 28;
const WAVE_SPEED = 1.6; // NDC / 秒
const WAVE_WIDTH = 0.12;
const WAVE_LIFE = 1.4; // 秒

// 粒子模擬的狀態（目前位置、速度、每幀重複使用的暫存物件）。場景同時只會有一個，放 module 層級：
// React Compiler 不允許改 useMemo/useRef 拿到的值，useFrame 裡又一定要每幀改它們
const sim = {
  pos: DOT_REST.slice(),
  vel: new Float32Array(DOT_COUNT * 3),
  near: new Int16Array(DOT_COUNT),
  v: new Vector3(),
  push: new Vector3(),
  inv: new Matrix4(),
  invQ: new Quaternion(),
};

// 游標狀態只有這個場景用，一個 listener 寫、useFrame 讀（不進 React state）
const pointer = { x: 0, y: 0, inside: false, waveX: 0, waveY: 0, waveStart: -1 };

function usePointerTracking(container: RefObject<HTMLDivElement | null>, reduced: boolean) {
  useEffect(() => {
    if (reduced) return;
    const toNdc = (e: PointerEvent) => {
      const r = container.current?.getBoundingClientRect();
      if (!r) return null;
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1), inside };
    };
    const onMove = (e: PointerEvent) => {
      const p = toNdc(e);
      if (!p) return;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.inside = p.inside && e.pointerType === "mouse";
    };
    const onDown = (e: PointerEvent) => {
      const p = toNdc(e);
      // 點在按鈕、連結上不要觸發（那是要換頁或捲動）
      if (!p?.inside || (e.target as Element).closest("a, button")) return;
      pointer.waveX = p.x;
      pointer.waveY = p.y;
      pointer.waveStart = performance.now() / 1000;
    };
    const onLeave = () => (pointer.inside = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [container, reduced]);
}

// 讓整個場景隨游標位置微微傾斜
function PointerRig({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current || reduced) return;
    const g = group.current;
    g.rotation.y += (pointer.x * 0.18 - g.rotation.y) * 0.04;
    g.rotation.x += (-pointer.y * 0.12 - g.rotation.x) * 0.04;
  });
  return <group ref={group}>{children}</group>;
}

// 往下捲時相機慢慢往後退，Hero 文字捲走的同時場景也跟著「拉遠」
function ScrollRig({ reduced }: { reduced: boolean }) {
  useFrame(({ camera }) => {
    if (reduced) return;
    const progress = Math.min(window.scrollY / window.innerHeight, 1);
    const target = 6 + progress * 2.2;
    camera.position.z += (target - camera.position.z) * 0.08;
  });
  return null;
}

// 狀態放 module 層級（理由同 sim）
const lineState = { rgb: new Color("#2d5a8e"), v: new Vector3() };

function Lines({ color, reduced }: { color: string; reduced: boolean }) {
  const ref = useRef<Group>(null);
  const seg = useRef<LineSegments>(null);
  const nodes = useRef<Points>(null);

  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(Float32Array.from(LINE_SPECS.flatMap((l) => [...l.a, ...l.b])), 3));
    g.setAttribute("color", new BufferAttribute(new Float32Array(LINE_COUNT * 2 * 4), 4)); // rgba：透明度跟著深度
    return g;
  }, []);
  const nodeGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(Float32Array.from(NODE_SPECS.flatMap((l) => [...l.b])), 3));
    g.setAttribute("color", new BufferAttribute(new Float32Array(NODE_SPECS.length * 4), 4));
    return g;
  }, []);

  useEffect(() => {
    lineState.rgb.set(color);
  }, [color]);
  useEffect(
    () => () => {
      geo.dispose();
      nodeGeo.dispose();
    },
    [geo, nodeGeo],
  );

  useFrame(({ camera }, delta) => {
    const g = ref.current;
    const l = seg.current;
    const n = nodes.current;
    if (!g || !l || !n) return;
    if (!reduced) {
      g.rotation.y += delta * 0.02;
      g.rotation.x += delta * 0.008;
    }
    // 每幀依深度重算透明度（88 個頂點，很便宜）
    const { rgb, v } = lineState;
    const fade = (obj: LineSegments | Points, count: number, base: (i: number) => number) => {
      obj.updateMatrixWorld();
      const pos = obj.geometry.attributes.position.array as Float32Array;
      const col = obj.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < count; i++) {
        v.fromArray(pos, i * 3).applyMatrix4(obj.matrixWorld);
        col.set([rgb.r, rgb.g, rgb.b, base(i) * depthFade(v.distanceTo(camera.position))], i * 4);
      }
      obj.geometry.attributes.color.needsUpdate = true;
    };
    fade(l, LINE_COUNT * 2, (i) => LINE_SPECS[i >> 1].base);
    fade(n, NODE_SPECS.length, (i) => NODE_SPECS[i].base + 0.25);
  });

  return (
    <group ref={ref}>
      <lineSegments ref={seg} geometry={geo} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent depthWrite={false} />
      </lineSegments>
      <points ref={nodes} geometry={nodeGeo} frustumCulled={false}>
        <pointsMaterial vertexColors transparent depthWrite={false} size={0.05} />
      </points>
    </group>
  );
}

// 背景深處兩個很淡的線框幾何體（測地球面、八面體），跟線條反方向慢慢轉 → 前後兩層轉速不同，立體感從視差出來。
// 放在標題旁邊的空白處（右後方、左下），不壓標題。
function Structures({ color, reduced }: { color: string; reduced: boolean }) {
  const a = useRef<Group>(null);
  const b = useRef<Group>(null);
  const geos = useMemo(() => {
    const ico = new IcosahedronGeometry(2.6, 1);
    const oct = new OctahedronGeometry(0.9);
    const out = [new EdgesGeometry(ico), new EdgesGeometry(oct)];
    ico.dispose();
    oct.dispose();
    return out;
  }, []);
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  useFrame((_, delta) => {
    if (reduced || !a.current || !b.current) return;
    a.current.rotation.y -= delta * 0.035;
    a.current.rotation.x += delta * 0.012;
    b.current.rotation.y += delta * 0.09;
    b.current.rotation.z += delta * 0.04;
  });
  return (
    <>
      <group ref={a} position={[4.8, 0.6, -4.5]}>
        <lineSegments geometry={geos[0]}>
          <lineBasicMaterial color={color} transparent opacity={0.09} depthWrite={false} />
        </lineSegments>
      </group>
      <group ref={b} position={[-5.2, -2.2, -2]}>
        <lineSegments geometry={geos[1]}>
          <lineBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
        </lineSegments>
      </group>
    </>
  );
}

function Dots({ color, reduced }: { color: string; reduced: boolean }) {
  const ref = useRef<Points>(null);
  const links = useRef<LineSegments>(null);

  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(sim.pos, 3));
    return g;
  }, []);

  const linkGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(MAX_LINKS * 2 * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);

  useEffect(
    () => () => {
      geo.dispose();
      linkGeo.dispose();
    },
    [geo, linkGeo],
  );

  useFrame(({ camera, size }, delta) => {
    const p = ref.current;
    const l = links.current;
    if (!p || !l) return;
    p.rotation.y += delta * 0.015;
    if (reduced) return;

    p.updateMatrixWorld();
    sim.inv.copy(p.matrixWorld).invert();
    p.getWorldQuaternion(sim.invQ).invert();
    const { pos, vel, near, v, push } = sim;
    const aspect = size.width / size.height;
    const now = performance.now() / 1000;
    const waveAge = pointer.waveStart < 0 ? -1 : now - pointer.waveStart;
    const waveR = waveAge * WAVE_SPEED;
    const waveOn = waveAge >= 0 && waveAge < WAVE_LIFE;
    let nearCount = 0;

    for (let i = 0; i < DOT_COUNT; i++) {
      const k = i * 3;
      v.set(pos[k], pos[k + 1], pos[k + 2]).applyMatrix4(p.matrixWorld).project(camera);
      let fx = 0;
      let fy = 0;

      if (pointer.inside) {
        const dx = (v.x - pointer.x) * aspect;
        const dy = v.y - pointer.y;
        const d = Math.hypot(dx, dy) || 1e-4;
        if (d < REPEL_RADIUS) {
          const f = (1 - d / REPEL_RADIUS) ** 2 * 0.012;
          fx += (dx / d) * f;
          fy += (dy / d) * f;
        }
        if (d < LINK_RADIUS && nearCount < near.length) near[nearCount++] = i;
      }

      if (waveOn) {
        const dx = (v.x - pointer.waveX) * aspect;
        const dy = v.y - pointer.waveY;
        const d = Math.hypot(dx, dy) || 1e-4;
        const band = 1 - Math.abs(d - waveR) / WAVE_WIDTH;
        if (band > 0) {
          const f = band * 0.03 * (1 - waveAge / WAVE_LIFE);
          fx += (dx / d) * f;
          fy += (dy / d) * f;
        }
      }

      // 螢幕方向的推力 → 世界座標（NDC 1 單位 ≈ 3 個世界單位）→ 粒子群組的本地座標（群組一直在轉）
      push.set(fx * 3, fy * 3, 0).applyQuaternion(sim.invQ);
      for (let a = 0; a < 3; a++) {
        const rest = DOT_REST[k + a];
        vel[k + a] = (vel[k + a] + (rest - pos[k + a]) * 0.02 + push.getComponent(a)) * 0.86;
        pos[k + a] += vel[k + a];
      }
    }
    p.geometry.attributes.position.needsUpdate = true;

    // 星座連線：游標 → 附近粒子、附近粒子彼此（距離夠近才連）
    const out = l.geometry.attributes.position.array as Float32Array;
    let n = 0;
    for (let a = 0; a < nearCount && n < MAX_LINKS; a++) {
      const i = near[a];
      const k = i * 3;
      // 游標在「這顆粒子的深度」上的位置：投影到螢幕上剛好落在游標底下
      v.set(pos[k], pos[k + 1], pos[k + 2]).applyMatrix4(p.matrixWorld).project(camera);
      v.set(pointer.x, pointer.y, v.z).unproject(camera).applyMatrix4(sim.inv);
      out.set([v.x, v.y, v.z, pos[k], pos[k + 1], pos[k + 2]], n++ * 6);
      for (let b = a + 1; b < nearCount && n < MAX_LINKS; b++) {
        const j = near[b] * 3;
        const d = Math.hypot(pos[k] - pos[j], pos[k + 1] - pos[j + 1], pos[k + 2] - pos[j + 2]);
        if (d < 1.8) out.set([pos[k], pos[k + 1], pos[k + 2], pos[j], pos[j + 1], pos[j + 2]], n++ * 6);
      }
    }
    l.geometry.setDrawRange(0, n * 2);
    l.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={color} size={0.045} transparent opacity={0.5} />
      <lineSegments ref={links} geometry={linkGeo}>
        <lineBasicMaterial color={color} transparent opacity={0.28} />
      </lineSegments>
    </points>
  );
}

// 流星：每 4～8 秒從畫面上方斜斜劃過一顆，不到一秒就消失。頭亮、尾巴漸淡（每個頂點自己的透明度）。
// 大約四次有一次是兩顆（11/23 使用者：「偶爾一次來兩顆」）：第二顆晚 0.15～0.45 秒、從旁邊出發、角度差不多、稍微淡一點。
// 不跟游標傾斜（放在 PointerRig 外面），減少動態時不出現。
const METEOR_SEGS = 12; // 尾巴切 12 段，每段兩個頂點（LineSegments）
const METEOR_SLOTS = 2; // 同時最多兩顆，共用一個 geometry
const PAIR_CHANCE = 0.25;
type MeteorState = { start: number; x: number; y: number; dx: number; dy: number; life: number; bright: number };
// 狀態放 module 層級（理由同 sim）
const meteors = {
  next: 0,
  rgb: new Color("#2d5a8e"),
  speed: 9,
  len: 1.8,
  slots: Array.from({ length: METEOR_SLOTS }, (): MeteorState => ({ start: -1, x: 0, y: 0, dx: 0, dy: 0, life: 0.9, bright: 1 })),
};

function launch(m: MeteorState, start: number, x: number, y: number, deg: number, bright: number) {
  const a = (deg * Math.PI) / 180;
  Object.assign(m, { start, x, y, dx: Math.cos(a), dy: Math.sin(a), life: 0.8 + Math.random() * 0.2, bright });
}

function Meteor({ color, reduced }: { color: string; reduced: boolean }) {
  const ref = useRef<LineSegments>(null);
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(METEOR_SLOTS * METEOR_SEGS * 2 * 3), 3));
    g.setAttribute("color", new BufferAttribute(new Float32Array(METEOR_SLOTS * METEOR_SEGS * 2 * 4), 4)); // rgba：尾巴漸淡
    return g;
  }, []);
  useEffect(() => {
    meteors.rgb.set(color);
  }, [color]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(() => {
    const l = ref.current;
    if (!l) return;
    const now = performance.now() / 1000;
    if (reduced) {
      l.visible = false;
      return;
    }
    const [first, second] = meteors.slots;
    const idle = meteors.slots.every((m) => m.start < 0);
    if (idle) {
      if (!meteors.next) meteors.next = now + 2 + Math.random() * 2; // 第一顆：載入後 2～4 秒
      if (now < meteors.next) {
        l.visible = false;
        return;
      }
      // 從畫面上半部偏右出發，往左下劃（角度 200°～215°）
      const deg = 200 + Math.random() * 15;
      const x = rand(8, 2);
      const y = 2.2 + Math.random() * 1.6;
      launch(first, now, x, y, deg, 1);
      if (Math.random() < PAIR_CHANCE) {
        // 第二顆：晚一點、從旁邊（上方或右邊一點）出發、角度差 ±3°
        launch(second, now + 0.15 + Math.random() * 0.3, x + 0.6 + Math.random() * 1.2, y + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4), deg + (Math.random() * 6 - 3), 0.7);
      }
    }

    const pos = l.geometry.attributes.position.array as Float32Array;
    const col = l.geometry.attributes.color.array as Float32Array;
    const { r, g, b } = meteors.rgb;
    const n = METEOR_SEGS * 2;
    let any = false;
    meteors.slots.forEach((m, s) => {
      const t = m.start < 0 ? -1 : (now - m.start) / m.life;
      if (t >= 1) m.start = -1;
      const live = t >= 0 && t < 1;
      const env = live ? Math.sin(Math.PI * t) : 0; // 淡入淡出
      const travel = meteors.speed * m.life * Math.max(t, 0);
      const tail = meteors.len * (0.4 + 0.6 * env);
      for (let i = 0; i < n; i++) {
        const f = (Math.floor(i / 2) + (i % 2)) / METEOR_SEGS; // 0＝頭、1＝尾
        const k = s * n + i;
        pos.set([m.x + m.dx * (travel - tail * f), m.y + m.dy * (travel - tail * f), -1], k * 3);
        col.set([r, g, b, live ? (1 - f) ** 1.6 * env * 0.85 * m.bright : 0], k * 4);
      }
      if (live) any = true;
    });
    if (meteors.slots.every((m) => m.start < 0)) meteors.next = now + 4 + Math.random() * 4;
    l.geometry.attributes.position.needsUpdate = true;
    l.geometry.attributes.color.needsUpdate = true;
    l.visible = any;
  });

  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false} visible={false}>
      <lineBasicMaterial vertexColors transparent depthWrite={false} />
    </lineSegments>
  );
}

// <Canvas> 會在自己的外層 div 加 inline style `position:relative; height:100%`，
// className="absolute inset-0" 直接給 Canvas 會被蓋掉；外面多包一層真正 absolute 的 div，Canvas 填滿它。
export default function HeroScene() {
  const container = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const color = useAccentColor();
  const [onScreen, setOnScreen] = useState(true);
  usePointerTracking(container, reduced);

  // Hero 整個捲出畫面就停止繪製
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={container} className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
        frameloop={onScreen ? "always" : "never"}
      >
        <ambientLight intensity={0.5} />
        <ScrollRig reduced={reduced} />
        <Meteor color={color} reduced={reduced} />
        <PointerRig reduced={reduced}>
          <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.3}>
            <Lines color={color} reduced={reduced} />
          </Float>
          <Dots color={color} reduced={reduced} />
          <Structures color={color} reduced={reduced} />
        </PointerRig>
      </Canvas>
    </div>
  );
}
