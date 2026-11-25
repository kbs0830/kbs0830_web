import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin/auth";

// 只管站長後台（TODO A1）：不是站長就直接 404，頁面連渲染都不跑。其他路徑不經過這裡（matcher）。
export async function proxy(req: NextRequest) {
  if (!(await isAdminRequest(req))) return new NextResponse(null, { status: 404 });
  const res = NextResponse.next();
  res.headers.set("x-robots-tag", "noindex, nofollow");
  res.headers.set("cache-control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
