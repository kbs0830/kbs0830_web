// 分享圖（opengraph-image.tsx）用的中文字型。文章頁、作品頁共用。
//
// ImageResponse 內建的字型只有拉丁字母，中文會變方框。build 時跟 Google Fonts 要
// 「只含這張圖用到的字」的 Noto Serif TC 子集（幾十 KB，不是整套 10MB+）。
// 抓不到（沒網路）回 null，呼叫端要退回英文，寧可沒中文也不要一排方框。
export const OG_FONT_NAME = "Noto Serif TC";

export async function loadSubsetFont(text: string): Promise<ArrayBuffer | null> {
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
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
