// 收訪客 POST 的 API 共用的防濫用（2026-11-25 安全檢查）：
//   - readLimitedText：body 邊讀邊算，超過上限就停（原本先 req.text() 整包讀進記憶體才檢查大小，Cloudflare 免費版放行到 100MB）
//   - RateLimiter：只在記憶體算次數（重啟就清空），不寫檔、不存 IP 以外的東西
// /api/tools/robots、/api/visitor-stats 等共用。

/** 讀 body，超過 maxBytes 回 null（content-length 先擋一次，沒帶長度的 chunked 邊讀邊算） */
export async function readLimitedText(req: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** 讀 body 並 JSON.parse；太大或格式壞掉回 undefined */
export async function readLimitedJson(req: Request, maxBytes: number): Promise<unknown> {
  const text = await readLimitedText(req, maxBytes);
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** 訪客 IP：經過 Cloudflare 的一定有 cf-connecting-ip；本機、CI 沒有就是 "local" */
export const clientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";

/** 滑動視窗計數：每個 key 在 windowMs 內最多 perKey 次，全部加起來最多 total 次（不給就不限） */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private all: number[] = [];
  constructor(
    private windowMs: number,
    private perKey: number,
    private total = Infinity,
    private maxKeys = 5000,
  ) {}

  /** 超過上限回 true（這次不算進去）；沒超過就記一次、回 false */
  limited(key: string, now = Date.now()): boolean {
    this.all = this.all.filter((t) => now - t < this.windowMs);
    const mine = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (this.all.length >= this.total || mine.length >= this.perKey) return true;
    mine.push(now);
    this.all.push(now);
    if (this.hits.size >= this.maxKeys && !this.hits.has(key)) this.hits.clear();
    this.hits.set(key, mine);
    return false;
  }
}
