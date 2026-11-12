import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brand-icon";

// 網站圖示（圖形在 lib/brand-icon.ts，2026-11-12 換成終端機視窗）。
// 32 用簡化版（分頁上看得清楚），192／512 用完整版（PWA、Android 主畫面）。
export const contentType = "image/png";

const variants = [
  { id: "32", width: 32, height: 32 },
  { id: "192", width: 192, height: 192 },
  { id: "512", width: 512, height: 512 },
];

export function generateImageMetadata() {
  return variants.map(({ id, width, height }) => ({
    id,
    size: { width, height },
    contentType,
  }));
}

// Next 16 傳進來的 id 是 Promise：直接拿去跟字串比永遠對不上，三種尺寸都會退回 32×32
// （manifest 宣告 192/512，Chrome 會報「Resource size is not correct」）。
export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id;
  const { width, height } = variants.find((v) => v.id === iconId) ?? variants[0];
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse（satori）只認 <img>
    <img src={brandIconDataUri(width <= 32 ? "small" : "full")} width={width} height={height} alt="" />,
    { width, height },
  );
}
