import { availability, readUptime } from "@/lib/ops/status";
import { badgeSvg, uptimeBadge } from "@/lib/ops/badge";

// 近 90 天可用率徽章（TODO B15，2026-11-24）。資料跟 /status 的可用率同一份（data/uptime.log）。
// 用法：README 放 ![uptime](https://kbs0830.com/api/badge/uptime)。只給數字，不給 log。
// GitHub 會透過自己的圖片代理（camo）抓，回應快取 10 分鐘就夠。
export const dynamic = "force-dynamic";

export function GET() {
  const { message, color } = uptimeBadge(availability(readUptime(90)));
  return new Response(badgeSvg("uptime 90d", message, color), {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=600" },
  });
}
