"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity --
   既有寫法（matchMedia 初始值同步 setState、useMemo 內用 Math.random 產生一次性裝飾用
   隨機座標），跟這次調整 three.js import 方式無關，是新版 eslint-plugin-react-hooks
   規則變嚴格後才浮現的既有債務（HeroSection.tsx / Magnetic.tsx 也有一樣的 matchMedia
   pattern）。這兩種寫法在這個情境下都不是真的 bug：mount 一次的裝飾性隨機生成、
   讀取現有 matchMedia 狀態的初始化，不影響正確性，這裡先不做更大範圍的 hook 重構。 */

import { useRef, useMemo, useEffect, useState, type ReactNode } from "react";
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

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

  const lines = useMemo(() => {
    const data: { start: Vector3; end: Vector3 }[] = [];
    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * 12;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 4 - 2;
      const len = 0.8 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      data.push({
        start: new Vector3(x, y, z),
        end: new Vector3(
          x + Math.cos(angle) * len,
          y + Math.sin(angle) * len,
          z
        ),
      });
    }
    return data;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <group ref={ref}>
      {lines.map((l, i) => {
        const points = [l.start, l.end];
        const geometry = new BufferGeometry().setFromPoints(points);
        const material = new LineBasicMaterial({
          color: "#2d5a8e",
          transparent: true,
          opacity: 0.25 + Math.random() * 0.2,
        });
        const lineObj = new Line(geometry, material);
        return <primitive key={i} object={lineObj} />;
      })}
    </group>
  );
}

function Dots() {
  const ref = useRef<Points>(null);

  const [positions, opacities] = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    const ops = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
      ops[i] = 0.1 + Math.random() * 0.3;
    }
    return [pos, ops];
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#2d5a8e" size={0.04} transparent opacity={0.4} />
    </points>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      style={{ background: "transparent" }}
      className="absolute inset-0"
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.5} />
      <PointerRig>
        <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.3}>
          <Lines />
        </Float>
        <Dots />
      </PointerRig>
    </Canvas>
  );
}
