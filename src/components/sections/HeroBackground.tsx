"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import SceneErrorBoundary from "@/components/canvas/SceneErrorBoundary";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/client/hooks";
import { isNotMe } from "@/lib/client/not-me";

const HeroScene = dynamic(() => import("@/components/canvas/HeroScene"), {
  ssr: false,
  loading: () => <HeroSceneSkeleton />,
});

// 桌機＋拿得到真的 GPU：WebGPU 版（更多玩法、粒子數依效能調整，見 HeroSceneGPU）
const HeroSceneGPU = dynamic(() => import("@/components/canvas/HeroSceneGPU"), {
  ssr: false,
  loading: () => <HeroSceneSkeleton />,
});

// 手機：Canvas 2D 的輕量版（見 HeroSceneLite），一樣是確定是手機才下載
const HeroSceneLite = dynamic(() => import("@/components/canvas/HeroSceneLite"), {
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

type Tier = "probe" | "gpu" | "gl";

// 版本統計（決策表 B13）：每個分頁只回報一次實際拿到哪一版、WebGPU 退回時再報一次原因。只存次數（/stats 看）。
// 本人（NotMeToggle）不記；伺服器端另外擋機器人跟沒經過 Cloudflare 的請求
const REPORT_KEY = "hero-reported";
function reportHero(body: { variant?: "lite" | "gl" | "gpu"; fallback?: string }) {
  try {
    if (isNotMe()) return;
    if (body.variant) {
      if (sessionStorage.getItem(REPORT_KEY)) return;
      sessionStorage.setItem(REPORT_KEY, "1");
    }
    void fetch("/api/hero-stats", { method: "POST", keepalive: true, body: JSON.stringify(body) }).catch(() => {});
  } catch {}
}
// 2026-11-22 晚：使用者試了 WebGPU 粒子版：「有點複雜（煩），線條就不錯，有時加個流星」→ 預設不自動用 WebGPU 版，
// 桌機一律 WebGL 線條版（加了流星）。WebGPU 版的程式跟測試都留著，網址加 ?hero=webgpu 還看得到；要恢復自動判斷把這個改成 true
const AUTO_WEBGPU = false;
const TIER_KEY = "hero-tier"; // 這個分頁試過 WebGPU 太慢／失敗就記住，換頁不要每次重試（重試前會閃一下骨架）

/**
 * 桌機用哪一版：拿得到「真的」GPU adapter（不是軟體模擬的 fallback adapter）才用 WebGPU 版。
 * 只看 navigator.gpu 不夠：有 navigator.gpu 但沒有可用顯卡時，WebGPURenderer 會退回它自己的 WebGL2 後端，
 * 2026-11-22 量過從 60 掉到 12 fps。測試用：網址加 ?hero=webgl／?hero=webgpu 強制指定（webgpu 也關掉自動退回）
 */
function useHeroTier(enabled: boolean, reduced: boolean): [Tier, boolean, (reason: string) => void] {
  const [tier, setTier] = useState<Tier>("probe");
  const [forced, setForced] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const param = new URLSearchParams(window.location.search).get("hero");
      let next: Tier = "gl";
      if (param === "webgpu" && "gpu" in navigator) {
        next = "gpu";
        if (!cancelled) setForced(true);
      } else if (AUTO_WEBGPU && param !== "webgl" && !reduced && sessionStorage.getItem(TIER_KEY) !== "gl" && "gpu" in navigator) {
        try {
          const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
          // isFallbackAdapter：新版在 info 上、舊版在 adapter 上（TS 內建型別都還沒有）
          const soft = (adapter?.info as { isFallbackAdapter?: boolean } | undefined)?.isFallbackAdapter ?? (adapter as { isFallbackAdapter?: boolean } | null)?.isFallbackAdapter;
          if (adapter && !soft) next = "gpu";
        } catch {}
      }
      if (!cancelled) setTier(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, reduced]);
  const fallback = useCallback((reason: string) => {
    console.info(`[hero] WebGPU 版改回 WebGL 版：${reason}`);
    reportHero({ fallback: reason.slice(0, 60) });
    try {
      sessionStorage.setItem(TIER_KEY, "gl");
    } catch {}
    setTier("gl");
  }, []);
  return [tier, forced, fallback];
}

// Hero 背景：桌機載入 three.js 3D 場景（拿得到 GPU 用 WebGPU 版，不然 WebGL 版），手機載入 Canvas 2D 輕量版（不載 three.js）。
// server 端還不知道是哪種裝置（useMediaQuery 回傳 null）→ 先畫骨架屏，確定裝置（跟 GPU）後才下載對應的 chunk。
export default function HeroBackground() {
  const isDesktop = useMediaQuery("(width >= 768px)");
  const reduced = usePrefersReducedMotion();
  const [tier, forced, fallback] = useHeroTier(isDesktop === true, reduced);
  const variant = isDesktop === null ? null : !isDesktop ? "lite" : tier === "probe" ? null : tier;
  useEffect(() => {
    if (variant) reportHero({ variant });
  }, [variant]);

  if (isDesktop === null) return <HeroSceneSkeleton />;
  if (!isDesktop) return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <HeroSceneLite />
    </SceneErrorBoundary>
  );
  if (tier === "probe") return <HeroSceneSkeleton />;
  const webgl = (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <HeroScene />
    </SceneErrorBoundary>
  );
  if (tier === "gpu") return (
    // WebGPU 版自己壞掉（shader 編譯失敗之類）就改顯示 WebGL 版
    <SceneErrorBoundary fallback={webgl}>
      <HeroSceneGPU onFallback={fallback} noFallback={forced} />
    </SceneErrorBoundary>
  );
  return webgl;
}
