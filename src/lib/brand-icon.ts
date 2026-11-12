// 網站圖示（2026-11-12 使用者選的「B3＋日」：暖白底上一個靛藍的終端機視窗，裡面是 >_，
// 標題列右上角一顆櫻花粉的「日」——使用者：「粉色櫻花有日本的感覺」）。
// 櫻花粉只用在圖示，網站本身的強調色照舊只有靛藍。
// 唯一的圖形來源：app/icon.tsx（32／192／512）、app/apple-icon.tsx（iPhone 主畫面）、
// scripts/build-favicon.mjs（app/favicon.ico）都從這裡拿 SVG，改這裡就全部一起變。
// 不放字母、不放本名（使用者不要用 P；本名本來就不能出現在看得到的地方）。
const W = "#fafaf8"; // 暖白
const SAKURA = "#f2a7b8"; // 櫻花粉（只用在圖示的「日」）

// 狀態色（2026-11-12 使用者：「多換一些顏色代表其他的狀態，維修、正常、有問題」）：視窗的顏色換掉，日照舊是櫻花粉。
//   ok：正式站正常（靛藍）      dev：本機 next dev（綠，分頁一眼分得出是本機還是正式站）
//   maintenance：維修模式（琥珀，scripts/maintenance.ps1 開）   error：頁面出錯（紅，error.tsx／global-error.tsx）
export type IconStatus = "ok" | "dev" | "maintenance" | "error";
export const STATUS_COLOR: Record<IconStatus, string> = {
  ok: "#2d5a8e",
  dev: "#2f7d5b",
  maintenance: "#c98a1b",
  error: "#c0392b",
};

/**
 * full：完整版（192／512、分享用）——暖白底＋細框，中間靛藍視窗（標題列兩顆點＋右邊櫻花粉的日）＋ >_
 * small：分頁用（16／32px）——整塊靛藍、一條標題列線＋粗 >_＋右上角的日。完整版縮到 16px 時視窗框跟小點會糊成一團
 * apple：iPhone 主畫面——iOS 會自己裁圓角，所以底色鋪滿、不畫外框圓角
 */
export function brandIconSvg(variant: "full" | "small" | "apple", status: IconStatus = "ok"): string {
  const B = STATUS_COLOR[status];
  if (variant === "small") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="${B}"/>
<path d="M0 140 L512 140" stroke="${W}" stroke-width="30" opacity="0.5"/>
<circle cx="410" cy="76" r="48" fill="${SAKURA}"/>
<path d="M90 210 L200 300 L90 390" fill="none" stroke="${W}" stroke-width="60" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M242 390 L390 390" stroke="${W}" stroke-width="60" stroke-linecap="round"/>
</svg>`;
  }
  const bg =
    variant === "apple"
      ? `<rect width="512" height="512" fill="${W}"/>`
      : `<rect width="512" height="512" rx="96" fill="${W}"/><rect x="4" y="4" width="504" height="504" rx="92" fill="none" stroke="#e0ddd8" stroke-width="8"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
${bg}
<rect x="76" y="104" width="360" height="304" rx="28" fill="${B}"/>
<path d="M76 162 L436 162" stroke="${W}" stroke-width="6" opacity="0.35"/>
<circle cx="110" cy="133" r="9" fill="${W}" opacity="0.7"/>
<circle cx="138" cy="133" r="9" fill="${W}" opacity="0.7"/>
<circle cx="394" cy="133" r="17" fill="${SAKURA}"/>
<path d="M140 222 L208 282 L140 342" fill="none" stroke="${W}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M242 342 L322 342" stroke="${W}" stroke-width="26" stroke-linecap="round"/>
</svg>`;
}

/** 給 ImageResponse 的 <img src>（satori 吃 data URI 的 SVG） */
export function brandIconDataUri(variant: "full" | "small" | "apple", status: IconStatus = "ok"): string {
  return `data:image/svg+xml;base64,${Buffer.from(brandIconSvg(variant, status)).toString("base64")}`;
}

/** 瀏覽器端用（沒有 Buffer）：直接把 SVG 編進網址 */
export function brandIconSvgUrl(status: IconStatus): string {
  return `data:image/svg+xml,${encodeURIComponent(brandIconSvg("small", status))}`;
}
