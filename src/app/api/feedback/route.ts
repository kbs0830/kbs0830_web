import { NextResponse, type NextRequest } from "next/server";
import { clientIp, RateLimiter, readLimitedJson } from "@/lib/api/request-guard";
import { getAllPosts } from "@/lib/content/blog";
import { REASONS, recordFeedback, type Reason } from "@/lib/stats/feedback";
import { isBrowserUA } from "../../../../scripts/lib/bot-patterns.js";

// 記事最後「這篇有幫到你嗎？」（TODO B20，2026-11-28）。body：{ slug, helpful: boolean, reason?: "unclear"|"unsolved"|"outdated" }。
// 跟 /api/web-vitals 一樣：只收從 Cloudflare 進來（cf-ipcountry）、真人瀏覽器（isBrowserUA）的，本機測試、CI、爬蟲一律 204 不計；
// slug 要是真的文章；每個 IP 每分鐘最多 6 次、全站每分鐘 120 次（只在記憶體算，重啟就清掉，IP 不存檔）。
const limiter = new RateLimiter(60_000, 6, 120);

export async function POST(req: NextRequest) {
  if (!req.headers.get("cf-ipcountry") || !isBrowserUA(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  if (limiter.limited(clientIp(req))) return new NextResponse(null, { status: 429 });

  const body = (await readLimitedJson(req, 500)) as { slug?: unknown; helpful?: unknown; reason?: unknown } | undefined;
  if (!body || typeof body.slug !== "string" || typeof body.helpful !== "boolean") return new NextResponse(null, { status: 400 });
  if (!getAllPosts().some((p) => p.slug === body.slug)) return new NextResponse(null, { status: 400 });
  const reason = body.helpful === false && typeof body.reason === "string" && (REASONS as readonly string[]).includes(body.reason) ? (body.reason as Reason) : undefined;
  if (body.reason !== undefined && !reason && body.helpful === false) return new NextResponse(null, { status: 400 });

  recordFeedback(body.slug, body.helpful, reason);
  return new NextResponse(null, { status: 204 });
}
