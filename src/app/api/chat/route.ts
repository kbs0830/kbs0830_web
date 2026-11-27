import { NextResponse, type NextRequest } from "next/server";
import { clientIp, RateLimiter, readLimitedJson } from "@/lib/api/request-guard";
import { MAX_BODY_BYTES, SYSTEM_PROMPT, ollamaToTextStream, parseChatBody } from "@/lib/ai/chat-input";
import { contextBlock, sourcesOf, techLines, techSources } from "@/lib/ai/knowledge";
import { CHAT_MODEL, OLLAMA_URL } from "@/lib/ai/ollama";
import { retrieve } from "@/lib/ai/retrieve";

// 站上 AI 小助理（2026-11-27）：POST /api/chat  body: { messages: [{ role, content }, ...] }
// 轉給本機 Ollama（預設 gemma3:4b），回應是純文字串流（一邊生成一邊送）。
// 回答前先依問題找網站內容（lib/ai/retrieve.ts：基本資料＋最相關的作品／文章）放進提示，來源連結放在 `x-sources` 標頭（URL 編碼的 JSON），
// 瀏覽器在串流開始前就拿得到。
// Ollama 只聽 127.0.0.1:11434，不對外開；這支是唯一入口，所以限流都在這裡：
//   每個 IP 10 分鐘 12 則、全站每小時 200 則、同時最多 2 個在生成（RTX 3070 8GB 排隊只會更慢）。
// 不存對話內容、不記錄誰問了什麼（只在記憶體算次數，重啟就清空）。

const TIMEOUT_MS = 120_000; // 冷啟動（載入模型）實測約 60 秒，再留生成的時間
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

  // 檢索用最近兩則提問（追問「那它呢？」才找得到東西）；檢索失敗不影響回答，只是沒有參考資料
  const query = messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join("\n");
  const { core, found, cited } = await retrieve(query).catch(() => ({ core: [], found: [], cited: [] }));
  const sources = [...techSources(query), ...sourcesOf(cited)].filter((s, i, all) => all.findIndex((x) => x.href === s.href) === i).slice(0, 3);
  // 「哪些作品用了 X」由程式算好，放在問題正後方（放在參考資料裡面，4B 模型會視而不見、照自己的印象列）
  const tech = techLines(query);
  const hint = tech.length ? `\n【已確認的事實，列作品時照這個，不要多列】${tech.join("；")}` : "";

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
        model: CHAT_MODEL,
        stream: true,
        keep_alive: "10m",
        options: { temperature: 0.3, num_predict: 400, num_ctx: 6144 },
        // 參考資料放在最後一則提問的前面（小模型比較聽最近的內容；放在系統提示裡它常常視而不見）
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(0, -1), { role: "user", content: `${contextBlock(core, found)}\n\n【問題】${messages.at(-1)!.content}${hint}` }],
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
    return new Response(text, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-accel-buffering": "no",
        "x-sources": encodeURIComponent(JSON.stringify(sources)),
      },
    });
  } catch {
    release();
    return fail("AI 暫時無法使用", 503);
  }
}
