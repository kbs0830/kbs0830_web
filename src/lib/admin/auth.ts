import type { NextRequest } from "next/server";

// 站長後台的門禁（TODO A1）。proxy.ts 先擋一次，頁面／API 裡再各自呼叫一次（proxy 不能當唯一防線）。
// 1. 本機請求直接放行：經過 Cloudflare 進來的一定帶 cf-connecting-ip／cf-ipcountry（Cloudflare 自己加，外面拿不掉），
//    跟 /api/reports 同一個判斷。
// 2. 外部請求：Cloudflare Access 會帶 Cf-Access-Jwt-Assertion，這裡再驗一次（RS256 簽章、iss、aud、exp、email），
//    萬一 Access 規則被誤刪，後台也不會開著。不用 jose：WebCrypto 就夠（不能手動 pnpm add）。
//    設定在 .env.local：CF_ACCESS_TEAM（xxx.cloudflareaccess.com 的 xxx）、CF_ACCESS_AUD、ADMIN_EMAIL。沒設＝外部一律擋。
// 驗不過一律 404（不是 401），不讓外人知道有後台。

type HeaderLike = Pick<Headers, "get">;

function isLocalRequest(h: HeaderLike): boolean {
  return !h.get("cf-connecting-ip") && !h.get("cf-ipcountry");
}

export type AccessConfig = { team: string; aud: string; email: string };

function envConfig(): AccessConfig | null {
  const team = process.env.CF_ACCESS_TEAM?.trim();
  const aud = process.env.CF_ACCESS_AUD?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return team && aud && email ? { team, aud, email } : null;
}

// ── 公鑰快取：一小時；遇到不認得的 kid 最多每分鐘重抓一次（Cloudflare 會輪替金鑰）
type Jwk = JsonWebKey & { kid?: string };
let keyCache: { team: string; keys: Map<string, CryptoKey>; fetchedAt: number } | null = null;

async function loadKeys(team: string, now: number): Promise<Map<string, CryptoKey>> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 5000);
  try {
    const res = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`, { signal: ac.signal });
    if (!res.ok) throw new Error(`certs ${res.status}`);
    const { keys } = (await res.json()) as { keys: Jwk[] };
    const map = new Map<string, CryptoKey>();
    for (const jwk of keys) {
      if (!jwk.kid || jwk.kty !== "RSA") continue;
      map.set(jwk.kid, await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]));
    }
    keyCache = { team, keys: map, fetchedAt: now };
    return map;
  } finally {
    clearTimeout(timer);
  }
}

async function getKey(team: string, kid: string, now: number): Promise<CryptoKey | undefined> {
  const c = keyCache?.team === team ? keyCache : null;
  if (c && now - c.fetchedAt < 3_600_000 && c.keys.has(kid)) return c.keys.get(kid);
  if (c && c.keys.has(kid) === false && now - c.fetchedAt < 60_000) return undefined;
  return (await loadKeys(team, now)).get(kid);
}

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (ch) => ch.charCodeAt(0));
const decodeJson = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s))) as Record<string, unknown>;

/** 驗 Cloudflare Access 的 JWT。任何一步不對都回 false（不丟例外）。 */
/** 驗過的 JWT 內容（登入紀錄用）：sub＝Cloudflare 的使用者 id、iat＝這次登入的時間（秒） */
export type AccessClaims = { email: string; sub: string; iat: number; country?: string };

/** 驗 Cloudflare Access 的 JWT，過了回 claims、任何一步不對回 null（不丟例外） */
export async function verifyAccessClaims(token: string, cfg: AccessConfig, now = Date.now()): Promise<AccessClaims | null> {
  try {
    const [h, p, sig] = token.split(".");
    if (!h || !p || !sig) return null;
    const header = decodeJson(h);
    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
    const key = await getKey(cfg.team, header.kid, now);
    if (!key) return null;
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;
    const claims = decodeJson(p);
    const sec = now / 1000;
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const valid =
      claims.iss === `https://${cfg.team}.cloudflareaccess.com` &&
      aud.includes(cfg.aud) &&
      typeof claims.exp === "number" && claims.exp > sec &&
      (typeof claims.nbf !== "number" || claims.nbf <= sec + 60) &&
      typeof claims.email === "string" && claims.email.toLowerCase() === cfg.email;
    if (!valid) return null;
    return {
      email: (claims.email as string).toLowerCase(),
      sub: typeof claims.sub === "string" ? claims.sub : "",
      iat: typeof claims.iat === "number" ? claims.iat : Math.floor(sec),
      country: typeof claims.country === "string" ? claims.country : undefined,
    };
  } catch {
    return null;
  }
}

export async function verifyAccessJwt(token: string, cfg: AccessConfig, now = Date.now()): Promise<boolean> {
  return (await verifyAccessClaims(token, cfg, now)) !== null;
}

/**
 * 家裡 IP 白名單（2026-11-26 使用者：「目前後台就鎖家裡的 IP，筆電用 VPN 進來」）：
 * .env.local 的 ADMIN_ALLOW_IPS（逗號分隔，完全相同才算），比對 Cloudflare 帶的 cf-connecting-ip（外面偽造不了，Cloudflare 會蓋掉）。
 * 家用寬頻的 IP 會變：變了就外網進不去，筆電改走 Tailscale 直連桌機（沒經過 Cloudflare＝本機請求）或更新 env 後重啟。
 * Cloudflare Access 設好之後這個可以留著當第二條路，或清空。
 */
function isAllowedIp(h: HeaderLike): boolean {
  const ip = h.get("cf-connecting-ip")?.trim();
  if (!ip) return false;
  const list = (process.env.ADMIN_ALLOW_IPS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(ip);
}

/** 站長是怎麼進來的（登入紀錄用）。access＝Cloudflare 登入（有信箱）、ip＝家裡 IP、local＝桌機本機／Tailscale 直連 */
export type AdminIdentity =
  | { via: "access"; email: string; session: string; country?: string }
  | { via: "ip"; ip: string }
  | { via: "local" };

/** 是站長就回身分、不是回 null。有 Cloudflare 登入的優先（才知道是誰），再看本機、家裡 IP */
export async function whoIsAdmin(h: HeaderLike): Promise<AdminIdentity | null> {
  const cfg = envConfig();
  const token = h.get("cf-access-jwt-assertion");
  if (cfg && token) {
    const c = await verifyAccessClaims(token, cfg);
    if (c) return { via: "access", email: c.email, session: `${c.sub}:${c.iat}`, country: c.country ?? h.get("cf-ipcountry") ?? undefined };
  }
  if (isLocalRequest(h)) return { via: "local" };
  if (isAllowedIp(h)) return { via: "ip", ip: h.get("cf-connecting-ip")!.trim() };
  return null;
}

export async function isAdmin(h: HeaderLike): Promise<boolean> {
  return (await whoIsAdmin(h)) !== null;
}

export const isAdminRequest = (req: NextRequest) => isAdmin(req.headers);

/**
 * 寫入類 API（POST /api/admin/*）的 CSRF 防護：Origin 一定要是自己的網站。
 * 外部只認 kbs0830.com；本機請求另外認 localhost／127.0.0.1（桌機上直接開後台）。
 * Sec-Fetch-Site 有帶就一定要是 same-origin。
 */
export function isSameOriginWrite(h: HeaderLike): boolean {
  const site = h.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = h.get("origin");
  if (!origin) return false;
  if (origin === "https://kbs0830.com") return true;
  if (!isLocalRequest(h)) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

/** 只給測試用：清掉公鑰快取 */
export const __resetKeyCache = () => { keyCache = null; };
