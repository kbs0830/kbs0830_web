"use client";

import dynamic from "next/dynamic";
import SceneErrorBoundary from "@/components/canvas/SceneErrorBoundary";
import { useMediaQuery } from "@/lib/hooks";

const HeroScene = dynamic(() => import("@/components/canvas/HeroScene"), {
  ssr: false,
  loading: () => <HeroSceneSkeleton />,
});

const SceneFallback = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-(--bg) via-(--surface) to-(--bg)" />
);

// 稀疏細線骨架屏，呼應真正場景的視覺語言，避免載入期間是一片空白。
const HeroSceneSkeleton = () => (
  <div className="absolute inset-0 bg-(--bg) overflow-hidden">
    {Array.from({ length: 7 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-px bg-(--accent)"
        style={{
          width: `${18 + ((i * 11) % 34)}%`,
          left: `${(i * 19) % 70}%`,
          top: `${8 + ((i * 13) % 78)}%`,
          opacity: 0.12 + (i % 3) * 0.04,
          transform: `rotate(${(i * 41) % 180}deg)`,
          animation: `breathe ${2.6 + i * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

// Hero 背景：桌機載入 3D 場景，手機用 CSS 漸層。server 端還不知道是哪種裝置
// （useMediaQuery 回傳 null）→ 先畫骨架屏，確定是桌機才觸發 three.js chunk 下載。
export default function HeroBackground() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop === null) return <HeroSceneSkeleton />;
  if (!isDesktop) return <SceneFallback />;
  return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <HeroScene />
    </SceneErrorBoundary>
  );
}
