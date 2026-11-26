import { NextResponse, connection, type NextRequest } from "next/server";
import { isAdminRequest, isSameOriginWrite } from "@/lib/admin/auth";
import { KEEP_OFF, KEEP_ON, getSessionDuration, setSessionDuration } from "@/lib/admin/cf-access";
import { logEvent } from "@/lib/admin/db";
import { readLimitedJson } from "@/lib/api/request-guard";

// 「維持登入」開關（TODO G6）：GET 讀現在的登入有效期、POST {keep} 改成 30 天／1 天（改 Cloudflare Access app，下次登入生效）。
// 只有站長能用，別人 404。
const noStore = { "cache-control": "private, no-store" };
const notFound = () => new NextResponse(null, { status: 404 });

export async function GET(req: NextRequest) {
  await connection();
  if (!(await isAdminRequest(req))) return notFound();
  try {
    const duration = await getSessionDuration();
    return NextResponse.json({ keep: duration === KEEP_ON, duration }, { headers: noStore });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "讀不到" }, { status: 502, headers: noStore });
  }
}

export async function POST(req: NextRequest) {
  await connection();
  if (!(await isAdminRequest(req))) return notFound();
  if (!isSameOriginWrite(req.headers)) return NextResponse.json({ error: "origin" }, { status: 403, headers: noStore });
  const body = (await readLimitedJson(req, 256)) as { keep?: unknown } | undefined;
  if (typeof body?.keep !== "boolean") return NextResponse.json({ error: "bad request" }, { status: 400, headers: noStore });
  try {
    const duration = await setSessionDuration(body.keep ? KEEP_ON : KEEP_OFF);
    logEvent("session.keep", body.keep ? "維持登入：開（30 天）" : "維持登入：關（1 天）");
    return NextResponse.json({ keep: duration === KEEP_ON, duration }, { headers: noStore });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "改不了" }, { status: 502, headers: noStore });
  }
}
