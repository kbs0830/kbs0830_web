import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { loadSubsetFont } from "@/lib/og-font";

// 每篇文章自己的分享圖（TODO「每篇文章專屬 OG 分享圖」，2026-11-09）。之前文章分享出去都是首頁那張
// 「PINGWEI LI — Portfolio」，看不出是哪篇。build 時每篇產生一張（generateStaticParams）。
// 中文字型見 lib/og-font.ts；抓不到就退回英文標題。
export const alt = "PINGWEI LI · 技術部落格";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "技術部落格";
  const eyebrow = "技術部落格 · Blog";
  const font = await loadSubsetFont(title + eyebrow + (post?.tags ?? []).join(""));
  const mainTitle = font ? title : (post?.titleEn ?? "PINGWEI LI · Blog");
  const subTitle = font ? post?.titleEn : undefined;
  const long = mainTitle.length > 26;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#fafaf8",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "84px 100px 72px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#2d5a8e" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: "#2d5a8e",
              fontSize: 22,
              letterSpacing: "0.2em",
              marginBottom: 36,
              fontFamily: font ? "Noto Serif TC" : undefined,
            }}
          >
            {font ? eyebrow : "BLOG"}
            {post?.date ? `  ·  ${post.date}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              color: "#1a1a1a",
              fontSize: long ? 50 : 60,
              lineHeight: 1.4,
              fontFamily: font ? "Noto Serif TC" : undefined,
              maxWidth: 1000,
            }}
          >
            {mainTitle}
          </div>
          {subTitle && (
            <div style={{ display: "flex", color: "#6b6b6b", fontSize: 24, marginTop: 24, maxWidth: 1000, lineHeight: 1.4 }}>
              {subTitle}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {(post?.tags ?? []).slice(0, 3).map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  color: "#6b6b6b",
                  fontSize: 18,
                  padding: "6px 14px",
                  border: "1px solid #e0ddd8",
                  borderRadius: 3,
                  background: "#f0ede8",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", color: "#9b9b9b", fontSize: 20, letterSpacing: "0.15em" }}>
            PINGWEI LI · kbs0830.com
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Noto Serif TC", data: font, weight: 500, style: "normal" }] : [] },
  );
}
