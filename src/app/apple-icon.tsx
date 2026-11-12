import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brand-icon";

// iPhone「加入主畫面」的圖示（2026-11-12 補：之前沒有，iOS 會拿網頁截圖當圖示）。
// iOS 自己會裁圓角，所以用 apple 版：底色鋪滿、不畫外框。
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse（satori）只認 <img>
    <img src={brandIconDataUri("apple")} width={180} height={180} alt="" />,
    size,
  );
}
