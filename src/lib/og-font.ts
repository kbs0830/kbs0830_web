// 分享圖（opengraph-image.tsx）用的中文字型。文章頁、作品頁共用。
//
// ImageResponse 內建的字型只有拉丁字母，中文會變方框。build 時跟 Google Fonts 要
// 「只含這張圖用到的字」的 Noto Serif TC 子集（幾十 KB，不是整套 10MB+）。
// 抓不到（沒網路）回 null，呼叫端要退回英文，寧可沒中文也不要一排方框。
export const OG_FONT_NAME = "Noto Serif TC";

// 2026-11-21 部署 build 失敗過一次：/changelog 的分享圖產生時丟「Cannot read properties of undefined (reading 'split')」，
// 重 build 就好了（同一段時間本機也失敗一次）。最可能是 Google 那時對那組字回了壞掉的字型——現在先檢查檔頭跟大小，
// 不像字型就重抓一次，還是不行就退回英文；og-card.tsx 另外會先試畫一次，畫不出來也退回英文，不讓整個 build 失敗。
function looksLikeFont(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 1024) return false;
  const tag = new DataView(buf).getUint32(0);
  // TrueType 1.0、'OTTO'（CFF）、'true'（舊 Mac TrueType）、'wOFF'
  return tag === 0x00010000 || tag === 0x4f54544f || tag === 0x74727565 || tag === 0x774f4646;
}

export async function loadSubsetFont(text: string): Promise<ArrayBuffer | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const font = await fetchSubsetFont(text);
    if (font) return font;
  }
  console.warn(`[og-font] 抓不到可用的中文字型（${text.length} 字），這張分享圖用英文`);
  return null;
}

async function fetchSubsetFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500&text=${encodeURIComponent(text)}`,
        { signal: AbortSignal.timeout(10_000) },
      )
    ).text();
    // 不帶瀏覽器 UA 時 Google 回 truetype（ImageResponse 吃 ttf/otf/woff，不吃 woff2）
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return looksLikeFont(buf) ? buf : null;
  } catch {
    return null;
  }
}
