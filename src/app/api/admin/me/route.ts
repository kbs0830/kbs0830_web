import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";

// 前端用來判斷「現在是不是站長」（之後 Ctrl+K、Footer 的隱藏入口用）。只回 ok，不回 email。不是站長就 404。
export async function GET(req: NextRequest) {
  await connection();
  if (!(await isAdminRequest(req))) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "private, no-store" } });
}
