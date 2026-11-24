import fs from "node:fs";
import path from "node:path";

// 首頁 3D 背景版本統計（決策表 B13，2026-11-25）：訪客實際拿到哪一版、WebGPU 版有沒有退回、為什麼退回。
// 每個工作階段只回報一次（HeroBackground），只存「分類 → 次數」，不存任何訪客資訊。檔案 data/hero-stats.json（不進 git）。

export const HERO_VARIANTS = ["lite", "gl", "gpu"] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];
export const VARIANT_NAMES: Record<HeroVariant, string> = {
  lite: "手機精簡版（Canvas 2D）",
  gl: "桌機線條版（WebGL）",
  gpu: "桌機粒子版（WebGPU）",
};

export interface HeroStats {
  since: string;
  variants: Partial<Record<HeroVariant, number>>;
  fallbacks: Record<string, number>; // WebGPU → WebGL 的原因：slow／init／no-webgpu-backend／other
  days?: Record<string, Record<string, number>>; // 台灣日期 → { lite, gl, gpu, "退回:slow"… }（報表用，留 120 天）
}

export const heroStatsFile = () =>
  process.env.HERO_STATS_FILE || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "hero-stats.json");

export function readHeroStats(): HeroStats | null {
  try {
    return JSON.parse(fs.readFileSync(heroStatsFile(), "utf8")) as HeroStats;
  } catch {
    return null;
  }
}

/** 回報內容 → 要加的分類；看不懂的回 null（不記） */
export function parseHeroReport(body: unknown): { variant?: HeroVariant; fallback?: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { variant?: unknown; fallback?: unknown };
  const variant = HERO_VARIANTS.find((v) => v === b.variant);
  let fallback: string | undefined;
  if (typeof b.fallback === "string") {
    const r = b.fallback.toLowerCase();
    fallback = r === "slow" ? "slow" : r.startsWith("init") ? "init" : r === "no-webgpu-backend" ? "no-webgpu-backend" : "other";
  }
  return variant || fallback ? { variant, fallback } : null;
}

export function addHeroReport(prev: HeroStats | null, report: { variant?: HeroVariant; fallback?: string }, today: string): HeroStats {
  const s: HeroStats = prev ?? { since: today, variants: {}, fallbacks: {} };
  if (report.variant) s.variants[report.variant] = (s.variants[report.variant] ?? 0) + 1;
  if (report.fallback) s.fallbacks[report.fallback] = (s.fallbacks[report.fallback] ?? 0) + 1;
  const day = ((s.days ??= {})[today] ??= {});
  if (report.variant) day[report.variant] = (day[report.variant] ?? 0) + 1;
  if (report.fallback) day[`退回:${report.fallback}`] = (day[`退回:${report.fallback}`] ?? 0) + 1;
  const dates = Object.keys(s.days).sort();
  for (const old of dates.slice(0, Math.max(0, dates.length - 120))) delete s.days[old];
  return s;
}
