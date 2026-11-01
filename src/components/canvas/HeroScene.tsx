"use client";

import { useRef, useMemo, useEffect, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Points,
  Vector3,
} from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";

// 裝飾用的隨機座標在 module 載入時產生一次（這個檔案只在桌機、client 端載入）。
// 放在 component 外面，render 才是純函式——原本寫在 useMemo 裡呼叫 Math.random，
// 要整段壓 eslint react-hooks/purity。
const rand = (spread: number, offset = 0) => (Math.random() - 0.5) * spread + offset;

const LINE_SPECS = Array.from({ length: 18 }, () => ({
  x: rand(12),
  y: rand(8),
  z: rand(4, -2),
  len: 0.8 + Math.random() * 2,
  angle: Math.random() * Math.PI * 2,
  opacity: 0.25 + Math.random() * 0.2,
}));

const DOT_POSITIONS = Float32Array.from({ length: 60 * 3 }, (_, i) =>
  i % 3 === 0 ? rand(14) : i % 3 === 1 ? rand(10) : rand(6, -2),
);

// 讓整個場景隨游標位置微微傾斜，把 Hero 從純裝飾變成可互動的名片。
function PointerRig({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  const target = useRef({ x: 0, y: 0 });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const handleMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [reduced]);

  useFrame(() => {
    if (!group.current || reduced) return;
    const g = group.current;
    g.rotation.y += (target.current.x * 0.18 - g.rotation.y) * 0.04;
    g.rotation.x += (-target.current.y * 0.12 - g.rotation.x) * 0.04;
  });

  return <group ref={group}>{children}</group>;
}

function Lines() {
  const ref = useRef<Group>(null);

  // 建好的 Line 物件（含各自的 geometry/material）記在 useMemo 裡，只在 mount 時
  // 產生一次；<primitive> 掛載的物件不是 R3F 自己宣告式建立的節點，R3F 不會自動
  // dispose，所以下面另外用 useEffect cleanup 手動處理，避免之後改成可以動態
  // 更新資料時漏掉 GPU 資源回收。
  const lineObjects = useMemo(
    () =>
      LINE_SPECS.map(({ x, y, z, len, angle, opacity }) => {
        const geometry = new BufferGeometry().setFromPoints([
          new Vector3(x, y, z),
          new Vector3(x + Math.cos(angle) * len, y + Math.sin(angle) * len, z),
        ]);
        const material = new LineBasicMaterial({ color: "#2d5a8e", transparent: true, opacity });
        return new Line(geometry, material);
      }),
    [],
  );

  useEffect(() => {
    return () => {
      lineObjects.forEach((line) => {
        line.geometry.dispose();
        (line.material as LineBasicMaterial).dispose();
      });
    };
  }, [lineObjects]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <group ref={ref}>
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

function Dots() {
  const ref = useRef<Points>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.015;
  });

  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(DOT_POSITIONS, 3));
    return g;
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#2d5a8e" size={0.04} transparent opacity={0.4} />
    </points>
  );
}

// <Canvas> 會在自己的外層 div 加 inline style `position:relative; height:100%`，
// className="absolute inset-0" 直接給 Canvas 會被蓋掉；section 只有 min-height，
// height:100% 算不出來，canvas 就退回預設的 150px 高（2026-11 才發現 Hero 3D 背景
// 一直只佔畫面最上面一條）。外面多包一層真正 absolute 的 div，Canvas 填滿它。
export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} style={{ background: "transparent" }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5} />
        <PointerRig>
          <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.3}>
            <Lines />
          </Float>
          <Dots />
        </PointerRig>
      </Canvas>
    </div>
  );
}
