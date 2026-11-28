import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { isAdminRequest, isSameOriginWrite } from "@/lib/admin/auth";
import { REVIEW_STATUSES, reviewDraft, type ReviewStatus } from "@/lib/admin/blog-drafts";
import { readLimitedJson } from "@/lib/api/request-guard";

// 部落格草稿審批（/admin/blog 的按鈕）：只有站長能用，別人一律 404。草稿檔不存在的 slug 回 404。
const noStore = { "cache-control": "private, no-store" };

export async function POST(req: NextRequest) {
  await connection();
  if (!(await isAdminRequest(req))) return new NextResponse(null, { status: 404 });
  if (!isSameOriginWrite(req.headers)) return NextResponse.json({ error: "origin" }, { status: 403, headers: noStore });

  const body = (await readLimitedJson(req, 4096)) as { slug?: unknown; status?: unknown; note?: unknown } | undefined;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const status = REVIEW_STATUSES.includes(body?.status as ReviewStatus) ? (body?.status as ReviewStatus) : undefined;
  const note = typeof body?.note === "string" ? body.note : "";
  if (!slug || !status || note.length > 1000) return NextResponse.json({ error: "bad request" }, { status: 400, headers: noStore });
  const saved = reviewDraft(slug, status, note);
  if (!saved) return NextResponse.json({ error: "unknown draft" }, { status: 404, headers: noStore });
  return NextResponse.json({ ok: true, review: saved }, { headers: noStore });
}
