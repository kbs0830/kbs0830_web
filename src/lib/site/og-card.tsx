import { ImageResponse } from "next/og";
import { loadSubsetFont, OG_FONT_NAME } from "@/lib/site/og-font";

// 獨立頁面（/flights、/hotels、/stats、/now、/uses、/radar）的分享圖（TODO B7，2026-11-21）。
// 之前這幾頁分享出去都是首頁那張「PINGWEI LI — Portfolio」。版面跟文章／作品分享圖一致：
// 頂端靛藍細線、小標、大標、一句說明，底下可選一排數字。中文字型抓不到就整張退回英文。
// 數字只放 build 時就固定的靜態資料（航班數、飯店數）；/stats、/radar 是即時數字，分享圖不放，
// 不然圖會停在 build 那一刻、跟頁面對不上。
const OG_SIZE = { width: 1200, height: 630 };

interface PageCard {
  /** 小標，中文版（例：飛行紀錄 · Flight Log） */
  eyebrow: string;
  eyebrowEn: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  /** [數值, 中文標籤, 英文標籤] */
  stats?: [value: string, label: string, labelEn: string][];
}

export async function pageCardImage(card: PageCard): Promise<Response> {
  const stats = card.stats ?? [];
  const font = await loadSubsetFont(
    card.eyebrow + card.title + card.description + stats.map(([v, l]) => v + l).join(""),
  );
  if (!font) return render(card, null);
  // 先真的畫一次：字型檔頭正常但內容壞掉時，錯誤要到畫的時候才會出現（會讓整個 build 失敗）
  try {
    const res = render(card, font);
    const png = await res.arrayBuffer();
    return new Response(png, { headers: res.headers });
  } catch (e) {
    console.warn(`[og-card] 中文分享圖畫不出來，改用英文：${e instanceof Error ? e.message : e}`);
    return render(card, null);
  }
}

function render(card: PageCard, font: ArrayBuffer | null) {
  const stats = card.stats ?? [];
  const serif = font ? OG_FONT_NAME : undefined;
  const zh = Boolean(font);

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
            {zh ? card.eyebrow : card.eyebrowEn.toUpperCase()}
          </div>
          <div style={{ display: "flex", color: "#1a1a1a", fontSize: 66, lineHeight: 1.3, fontFamily: serif, maxWidth: 1000 }}>
            {zh ? card.title : card.titleEn}
          </div>
          {zh && <div style={{ display: "flex", color: "#6b6b6b", fontSize: 26, marginTop: 14 }}>{card.titleEn}</div>}
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
            {zh ? card.description : card.descriptionEn}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 48 }}>
            {stats.map(([value, label, labelEn]) => (
              <div key={labelEn} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", color: "#1a1a1a", fontSize: 40, lineHeight: 1.1 }}>{value}</div>
                <div style={{ display: "flex", color: "#6b6b6b", fontSize: 18, marginTop: 8, letterSpacing: "0.1em", fontFamily: serif }}>
                  {zh ? label : labelEn}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", color: "#9b9b9b", fontSize: 20, letterSpacing: "0.15em" }}>
            PINGWEI LI · kbs0830.com
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: font ? [{ name: OG_FONT_NAME, data: font, weight: 500, style: "normal" }] : [] },
  );
}
