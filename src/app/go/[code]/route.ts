import { NextResponse, after, connection, type NextRequest } from "next/server";
import { GO_LINKS, isGoCode } from "@/lib/site/go-links";
import { recordGoClick } from "@/lib/stats/go-clicks";
import { isBrowserUA } from "../../../../scripts/lib/bot-patterns.js";

// /go/<代號>：記一次點擊再 302 到外部網址（TODO E10，2026-11-26）。不是真人的瀏覽器（爬蟲、預覽機器人）照樣轉址但不計數。
// 沒列在 lib/site/go-links.ts 的代號回 404（不是開放轉址，不會被拿去導向任意網站）。noindex、no-store。
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await ctx.params;
  const target = isGoCode(code) ? GO_LINKS[code] : undefined;
  if (!target) return new NextResponse(null, { status: 404 });
  if (isBrowserUA(req.headers.get("user-agent") ?? "")) after(() => recordGoClick(code));
  return new NextResponse(null, {
    status: 302,
    headers: { location: target, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}
