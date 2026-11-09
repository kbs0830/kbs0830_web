import { ImageResponse } from "next/og";
import { projects } from "@/lib/projects";
import { loadSubsetFont, OG_FONT_NAME } from "@/lib/og-font";

// 每個作品自己的分享圖（TODO「每個作品專屬分享圖」，2026-11-09）：作品名＋一句話成果＋技術 tag。
// 版面跟文章分享圖（app/blog/[slug]/opengraph-image.tsx）一致；中文字型抓不到就退回英文。
export const alt = "PINGWEI LI · 製作物";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  const kind = project?.isPersonal ? "個人専案" : "課程専題";
  const eyebrow = `製作物 · ${kind}`;
  const tags = (project?.tags ?? []).slice(0, 4);
  const font = await loadSubsetFont(
    eyebrow + (project ? project.titleZh + project.highlightZh : "製作物") + tags.join(""),
  );

  const title = font ? (project?.titleZh ?? "製作物") : (project?.title ?? "Portfolio");
  const subTitle = font ? project?.title : undefined;
  const highlight = font ? project?.highlightZh : project?.highlight;
  const serif = font ? OG_FONT_NAME : undefined;

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
          <div style={{ display: "flex", color: "#2d5a8e", fontSize: 22, letterSpacing: "0.2em", marginBottom: 36, fontFamily: serif }}>
            {font ? eyebrow : "PORTFOLIO"}
          </div>
          <div style={{ display: "flex", color: "#1a1a1a", fontSize: 66, lineHeight: 1.3, fontFamily: serif, maxWidth: 1000 }}>
            {title}
          </div>
          {subTitle && (
            <div style={{ display: "flex", color: "#6b6b6b", fontSize: 26, marginTop: 14 }}>{subTitle}</div>
          )}
          {highlight && (
            <div
              style={{
                display: "flex",
                color: "#1a1a1a",
                fontSize: 28,
                lineHeight: 1.5,
                marginTop: 40,
                paddingLeft: 22,
                borderLeft: "3px solid #2d5a8e",
                maxWidth: 1000,
                fontFamily: serif,
              }}
            >
              {highlight}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {tags.map((tag) => (
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
                  fontFamily: serif,
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
    { ...size, fonts: font ? [{ name: OG_FONT_NAME, data: font, weight: 500, style: "normal" }] : [] },
  );
}
