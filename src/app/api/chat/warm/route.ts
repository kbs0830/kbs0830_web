import { NextResponse } from "next/server";
import { warmChatModel } from "@/lib/ai/ollama";
import { warmRetrieval } from "@/lib/ai/retrieve";

// /ask 頁面一打開就呼叫：把聊天模型載進 GPU、把知識庫向量算好（冷啟動各要幾十秒），訪客打字的時候就在暖機。
// 不收任何資料。全站 3 分鐘最多真的暖一次（模型 keep_alive 10 分鐘，3 分鐘內一定還在），其餘直接回 ok。
let lastWarm = 0;

export async function POST() {
  const now = Date.now();
  if (now - lastWarm < 180_000) return NextResponse.json({ ok: true, skipped: true });
  lastWarm = now;
  const [chat, retrieval] = await Promise.all([warmChatModel(), warmRetrieval()]);
  if (!chat) lastWarm = 0; // 失敗了，下一個訪客再試
  return NextResponse.json({ ok: chat, retrieval }, { status: chat ? 200 : 503, headers: { "cache-control": "no-store" } });
}
