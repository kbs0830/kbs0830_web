import { connection, NextResponse, type NextRequest } from "next/server";
import { clientIp, RateLimiter } from "@/lib/api/request-guard";
import { semanticSearch } from "@/lib/ai/retrieve";

// 語意搜尋（2026-11-27，TODO H5）：GET /api/search?q=…  → { results: [{ title, href }] }
// Ctrl+K 快速跳轉沒找到字面符合時、404 頁的「你是不是要找」會呼叫。只用 embedding 模型（lib/ai/retrieve.ts），不碰聊天模型。
// 不存、不記搜尋字。每個 IP 1 分鐘 30 次、全站每分鐘 300 次；查詢最多 100 字。

const perIp = new RateLimiter(60_000, 30, 300);
const headers = { "cache-control": "no-store" };

export async function GET(req: NextRequest) {
  await connection(); // 讀記憶體裡的知識庫、呼叫 Ollama：每次都要即時算，不能在 build 時凍結
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] }, { headers });
  if (perIp.limited(clientIp(req))) return NextResponse.json({ error: "查太多次了" }, { status: 429, headers });
  const results = await semanticSearch(q, 5, AbortSignal.any([AbortSignal.timeout(8000), req.signal])).catch(() => []);
  return NextResponse.json({ results }, { headers });
}
