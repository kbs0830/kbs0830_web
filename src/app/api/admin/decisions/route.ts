import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { isAdminRequest, isSameOriginWrite } from "@/lib/admin/auth";
import { CHOICES, listDecisions, saveDecision, type Choice } from "@/lib/admin/db";
import { readTodo } from "@/lib/admin/todo";
import { readLimitedJson } from "@/lib/api/request-guard";

// 決策表（TODO G1）：GET 讀全部、POST 存一項。只有站長能用，別人一律 404（跟頁面一樣不讓人知道有這支）。
const notFound = () => new NextResponse(null, { status: 404 });
const noStore = { "cache-control": "private, no-store" };

export async function GET(req: NextRequest) {
  await connection();
  if (!(await isAdminRequest(req))) return notFound();
  // ?detail=<id>：只回一項的完整說明（列表頁點「完整說明」時才抓，列表本身不帶全文）
  const detailId = req.nextUrl.searchParams.get("detail");
  if (detailId !== null) {
    const item = readTodo({ all: true }).find((i) => i.id === detailId);
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404, headers: noStore });
    return NextResponse.json({ id: item.id, detail: item.detail }, { headers: noStore });
  }
  return NextResponse.json({ items: readTodo(), decisions: listDecisions() }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  await connection();
  if (!(await isAdminRequest(req))) return notFound();
  if (!isSameOriginWrite(req.headers)) return NextResponse.json({ error: "origin" }, { status: 403, headers: noStore });

  const body = (await readLimitedJson(req, 4096)) as { itemId?: unknown; choice?: unknown; note?: unknown } | undefined;
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  const choice = body?.choice === null ? null : CHOICES.includes(body?.choice as Choice) ? (body?.choice as Choice) : undefined;
  const note = typeof body?.note === "string" ? body.note : "";
  if (!itemId || itemId.length > 200 || choice === undefined || note.length > 1000) {
    return NextResponse.json({ error: "bad request" }, { status: 400, headers: noStore });
  }
  // 只收 TODO.md 裡現在有的項目；已經不在 TODO.md 的舊紀錄只能清掉，不能再改
  const known = readTodo().some((i) => i.id === itemId);
  const existing = listDecisions().some((d) => d.itemId === itemId);
  if (!known && !(existing && !choice && !note.trim())) {
    return NextResponse.json({ error: "unknown item" }, { status: 404, headers: noStore });
  }
  const saved = saveDecision(itemId, choice, note);
  return NextResponse.json({ ok: true, decision: saved }, { headers: noStore });
}
