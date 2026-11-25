import type { NextRequest } from "next/server";

// 站長後台的門禁（TODO A1，2026-11-25）。proxy.ts 先擋一次，頁面／API 裡再各自呼叫一次（proxy 不能當唯一防線）。
// 現在：只放行桌機本機的請求——經過 Cloudflare 進來的一定帶 cf-connecting-ip／cf-ipcountry（Cloudflare 自己加，外面拿不掉），
//       跟 /api/reports 同一個判斷。
// 之後（使用者：「入口密碼驗證我等等回去做」）：Cloudflare Access 保護 /admin*、/api/admin/*，這裡再驗
//       Cf-Access-Jwt-Assertion（team certs 公鑰、aud、email），驗過就放行外部請求。
// 驗不過一律 404（不是 401），不讓外人知道有後台。

type HeaderLike = Pick<Headers, "get">;

export function isLocalRequest(h: HeaderLike): boolean {
  return !h.get("cf-connecting-ip") && !h.get("cf-ipcountry");
}

export function isAdmin(h: HeaderLike): boolean {
  if (isLocalRequest(h)) return true;
  // TODO A1：Cloudflare Access JWT 驗證放這裡
  return false;
}

export const isAdminRequest = (req: NextRequest) => isAdmin(req.headers);
