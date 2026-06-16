"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function Lines() {
  const ref = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const data: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * 12;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 4 - 2;
      const len = 0.8 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      data.push({
        start: new THREE.Vector3(x, y, z),
        end: new THREE.Vector3(
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
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: "#2d5a8e",
          transparent: true,
          opacity: 0.25 + Math.random() * 0.2,
        });
        const lineObj = new THREE.Line(geometry, material);
        return <primitive key={i} object={lineObj} />;
      })}
    </group>
  );
}

function Dots() {
  const ref = useRef<THREE.Points>(null);

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
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
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
      <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.3}>
        <Lines />
      </Float>
      <Dots />
    </Canvas>
  );
}
