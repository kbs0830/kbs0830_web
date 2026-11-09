import type { Metadata } from "next";

type PageMeta = Metadata & { title: string; description: string };

/**
 * 子頁面的分享預覽（Open Graph／Twitter 卡片）跟著頁面自己的 title／description 走。
 *
 * Next 的 metadata 是逐層「整個物件蓋掉」：子頁面沒寫 openGraph 就會原封不動繼承 layout 的，
 * 2026-11-09 才發現作品頁、/now、/flights… 分享到 LINE／Discord 全部顯示「PINGWEI LI — Portfolio」。
 * 圖片一定要明確寫：子頁面一宣告 openGraph，根目錄 opengraph-image.tsx 那張就不會再自動掛上
 * （第一版沒寫，e2e/share-meta.spec.ts 抓到 og:image 整個消失）。自己資料夾有 opengraph-image 的頁面
 * （作品頁）傳 `{ ownImage: true }`：不寫 images，讓檔案慣例自動掛上那張。
 * 網址取自 alternates.canonical，所以每頁原本就必須寫的 canonical（CLAUDE.md SEO）順便決定 og:url。
 */
const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "PINGWEI LI — Portfolio" };

export function withShare(meta: PageMeta, { ownImage = false }: { ownImage?: boolean } = {}): Metadata {
  const canonical = meta.alternates?.canonical;
  const url = typeof canonical === "string" ? canonical : undefined;
  const images = ownImage ? {} : { images: [DEFAULT_IMAGE] };
  return {
    ...meta,
    openGraph: { title: meta.title, description: meta.description, url, type: "website", ...images },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, ...images },
  };
}
