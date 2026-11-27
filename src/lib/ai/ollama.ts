// 本機 Ollama 的連線設定與 embedding 呼叫。Ollama 只聽 127.0.0.1，不對外（見 kbs-integrations 技能）。
export const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
export const CHAT_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:4b";
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "embeddinggemma";

/** 一次算多段文字的向量（Ollama 回傳的向量已正規化，內積就是餘弦相似度） */
export async function embed(inputs: string[], signal?: AbortSignal): Promise<number[][]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: signal ?? AbortSignal.timeout(120_000),
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs, keep_alive: "30m", truncate: true }),
  });
  if (!res.ok) throw new Error(`Ollama embed ${res.status}`);
  const { embeddings } = (await res.json()) as { embeddings?: number[][] };
  if (!embeddings || embeddings.length !== inputs.length) throw new Error("Ollama embed 回傳數量不對");
  return embeddings;
}

/** 把聊天模型先載進 GPU（空 prompt 不會生成任何字，只是載入）。失敗不丟例外，回 false */
export async function warmChatModel(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({ model: CHAT_MODEL, keep_alive: "10m" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const dot = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};
