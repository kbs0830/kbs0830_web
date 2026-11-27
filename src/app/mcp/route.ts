import { handleRpc } from "@/lib/api/mcp";

// MCP 伺服器的 HTTP 端點（TODO A9，2026-11-21）：POST JSON-RPC，邏輯在 lib/api/mcp.ts。
// 無狀態：不發 session、不開 SSE（GET 回 405），通知回 202。瀏覽器裡的 MCP 客戶端要 CORS，所以全開（唯讀、公開內容）。

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID",
};
const MAX_BODY = 64 * 1024;

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
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleRpc(m)))).filter((r) => r !== null);
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
