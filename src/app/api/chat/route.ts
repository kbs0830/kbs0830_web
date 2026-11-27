import { NextResponse, type NextRequest } from "next/server";
import { clientIp, RateLimiter, readLimitedJson } from "@/lib/api/request-guard";
import { MAX_BODY_BYTES, SYSTEM_PROMPT, ollamaToTextStream, parseChatBody } from "@/lib/ai/chat-input";

// 站上 AI 小助理（2026-11-27）：POST /api/chat  body: { messages: [{ role, content }, ...] }
// 轉給本機 Ollama（預設 gemma3:4b），回應是純文字串流（一邊生成一邊送）。
// Ollama 只聽 127.0.0.1:11434，不對外開；這支是唯一入口，所以限流都在這裡：
//   每個 IP 10 分鐘 12 則、全站每小時 200 則、同時最多 2 個在生成（RTX 3070 8GB 排隊只會更慢）。
// 不存對話內容、不記錄誰問了什麼（只在記憶體算次數，重啟就清空）。

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:4b";
const TIMEOUT_MS = 60_000;
const MAX_CONCURRENT = 2;

const perIp = new RateLimiter(600_000, 12);
const sitewide = new RateLimiter(3600_000, 200);
let active = 0;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: NextRequest) {
  const messages = parseChatBody(await readLimitedJson(req, MAX_BODY_BYTES));
  if (!messages) return fail("訊息格式不對、太長，或最後一則不是你的提問", 400);

  if (perIp.limited(clientIp(req)) || sitewide.limited("all")) return fail("問太多次了，休息一下再問", 429);
  if (active >= MAX_CONCURRENT) return fail("現在有人在問，請幾秒後再試", 503);

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = AbortSignal.any([timeout, req.signal]);
  active++;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      active--;
    }
  };

  try {
    const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        keep_alive: "10m",
        options: { temperature: 0.6, num_predict: 400, num_ctx: 2048 },
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });
    if (!upstream.ok || !upstream.body) {
      release();
      return fail("AI 暫時無法使用", 502);
    }
    const text = ollamaToTextStream(upstream.body).pipeThrough(
      new TransformStream({
        flush: release,
        transform: (chunk, controller) => controller.enqueue(chunk),
      }),
    );
    // 瀏覽器中途關掉或逾時：上游 fetch 被 abort，串流出錯，也要把名額還回去
    signal.addEventListener("abort", release, { once: true });
    return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
  } catch {
    release();
    return fail("AI 暫時無法使用", 503);
  }
}
