import { handleRpc } from "@/lib/api/mcp";
import { clientIp, RateLimiter } from "@/lib/api/request-guard";

// MCP 伺服器的 HTTP 端點（TODO A9，2026-11-21）：POST JSON-RPC，邏輯在 lib/api/mcp.ts。
// 無狀態：不發 session、不開 SSE（GET 回 405），通知回 202。瀏覽器裡的 MCP 客戶端要 CORS，所以全開（唯讀、公開內容）。

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID",
};
const MAX_BODY = 64 * 1024;
// semantic_search 會呼叫本機 Ollama（吃 GPU/CPU）：跟 /api/search 同一個額度（每 IP 1 分鐘 30 次、全站 300 次），批次裡每一則都算一次。
// 批次最多 10 則、一則一則依序處理，不用無上限的 Promise.all。
const MAX_BATCH = 10;
const aiLimit = new RateLimiter(60_000, 30, 300);
const isAiCall = (m: unknown) => {
  const x = m as { method?: unknown; params?: { name?: unknown } } | null;
  return x?.method === "tools/call" && x.params?.name === "semantic_search";
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > MAX_BODY) return json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Request too large" } }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }
  // 舊版協定允許一次送一批（陣列）；新版沒有了，但照樣處理
  const messages = Array.isArray(body) ? body : [body];
  if (messages.length > MAX_BATCH) return json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: `Batch too large (max ${MAX_BATCH})` } }, 413);
  const ip = clientIp(req);
  if (messages.filter(isAiCall).some(() => aiLimit.limited(ip))) return json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Rate limit exceeded" } }, 429);
  if (Array.isArray(body)) {
    const out: object[] = [];
    for (const m of body) {
      const r = await handleRpc(m);
      if (r !== null) out.push(r);
    }
    return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
  }
  const out = await handleRpc(body as Parameters<typeof handleRpc>[0]);
  return out ? json(out) : new Response(null, { status: 202, headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export function GET() {
  // 不提供伺服器主動推播的 SSE 串流（規格允許回 405）
  return new Response("This MCP endpoint only accepts POST (Streamable HTTP, JSON responses).", {
    status: 405,
    headers: { ...CORS, Allow: "POST, OPTIONS", "Content-Type": "text/plain; charset=utf-8" },
  });
}
