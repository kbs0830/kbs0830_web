import { NextResponse, connection } from "next/server";
import { isPresenceId, leave, presenceCount, touch } from "@/lib/stats/presence";

// 「いま N 人」（TODO B4）：POST { id, leave? } 回報／離開，回 { count }。GET 只讀。
// 只收經過 Cloudflare 的請求（有 cf-ipcountry，跟訪客統計同規則）：本機測試、印履歷 PDF 的 headless 瀏覽器不算。

const json = (count: number) => NextResponse.json({ count }, { headers: { "cache-control": "no-store" } });

export async function GET() {
  await connection(); // Cache Components：同步讀檔不算「即時」，不加這行 build 時會把當下的數字凍結（TODO C13）
  return json(presenceCount());
}

export async function POST(req: Request) {
  let body: { id?: unknown; leave?: unknown } = {};
  try {
    body = JSON.parse(await req.text());
  } catch {}
  if (req.headers.get("cf-ipcountry") && isPresenceId(body.id)) {
    if (body.leave === true) leave(body.id);
    else touch(body.id);
  }
  return json(presenceCount());
}
