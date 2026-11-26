import { NextResponse, connection, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";
import { listDone } from "@/lib/admin/db";

// 完成紀錄的全文跟搜尋（2026-11-26，使用者：「admin 後台開始卡了」→「也改完成頁」）。
// /admin/done 列表只帶日期＋標題（原本把全部全文塞進頁面，壓縮後還有 131 KB），全文跟搜尋都走這支：
//   GET ?id=12        → { id, body }
//   GET ?q=關鍵字      → { ids: [...], bodies?: { [id]: body } }（標題＋全文都搜；結果 5 筆以內順便帶全文，讓列表直接展開）
// 只有站長能用，別人 404。
const noStore = { "cache-control": "private, no-store" };

export async function GET(req: NextRequest) {
  await connection();
  if (!(await isAdminRequest(req))) return new NextResponse(null, { status: 404 });
  const params = req.nextUrl.searchParams;
  let rows: ReturnType<typeof listDone> = [];
  try {
    rows = listDone();
  } catch {}

  const id = params.get("id");
  if (id !== null) {
    const row = rows.find((r) => String(r.id) === id);
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
    return NextResponse.json({ id: row.id, body: row.body }, { headers: noStore });
  }

  const q = (params.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  if (!q) return NextResponse.json({ error: "要 id 或 q" }, { status: 400, headers: noStore });
  const hits = rows.filter((r) => `${r.title}\n${r.body}`.toLowerCase().includes(q));
  const bodies = hits.length <= 5 ? Object.fromEntries(hits.map((r) => [r.id, r.body])) : undefined;
  return NextResponse.json({ ids: hits.map((r) => r.id), bodies }, { headers: noStore });
}
