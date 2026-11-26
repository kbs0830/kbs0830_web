import "server-only";

// 後台改 Cloudflare Access 設定（TODO G6「維持登入」，2026-11-26）。
// Access 的登入有效期是整個 app 一個值（session_duration），沒辦法每次登入各選，所以「維持登入」做成開關：
// 開＝30 天（720h）、關＝1 天（24h），改的是 app「kbs0830 站長後台」（用 .env.local 的 CF_ACCESS_AUD 找），下次登入生效。
// 金鑰：.env.local 的 CLOUDFLARE_CONFIG_TOKEN（2026-11-26 使用者補了 Access 應用程式與原則：編輯 權限）。

export const KEEP_ON = "720h";
export const KEEP_OFF = "24h";
const API = "https://api.cloudflare.com/client/v4";

type App = {
  id: string;
  aud: string;
  name: string;
  type: string;
  domain: string;
  destinations?: unknown[];
  session_duration?: string;
  allowed_idps?: string[];
  auto_redirect_to_identity?: boolean;
  app_launcher_visible?: boolean;
  policies?: { id: string; precedence?: number }[];
};

async function cf<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.CLOUDFLARE_CONFIG_TOKEN;
  if (!token) throw new Error("沒有 CLOUDFLARE_CONFIG_TOKEN");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      signal: ac.signal,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    });
    const body = (await res.json()) as { success: boolean; result: T; errors?: { message: string }[] };
    if (!body.success) throw new Error(body.errors?.map((e) => e.message).join("；") || `HTTP ${res.status}`);
    return body.result;
  } finally {
    clearTimeout(timer);
  }
}

let accountId: string | null = null;
async function account(): Promise<string> {
  if (accountId) return accountId;
  const zones = await cf<{ account: { id: string } }[]>("/zones?name=kbs0830.com");
  if (!zones[0]) throw new Error("找不到 kbs0830.com");
  accountId = zones[0].account.id;
  return accountId;
}

async function findApp(): Promise<App> {
  const aud = process.env.CF_ACCESS_AUD?.trim();
  if (!aud) throw new Error("沒有 CF_ACCESS_AUD");
  const apps = await cf<App[]>(`/accounts/${await account()}/access/apps`);
  const app = apps.find((a) => a.aud === aud);
  if (!app) throw new Error("找不到後台的 Access app");
  return app;
}

// 讀到的值記 10 分鐘（後台每換一頁開關都會問一次，每次打 Cloudflare 要 0.4～1.5 秒）；自己改了就直接換成新值
let cached: { value: string; at: number } | null = null;
const CACHE_MS = 10 * 60_000;

export async function getSessionDuration(now = Date.now()): Promise<string> {
  if (cached && now - cached.at < CACHE_MS) return cached.value;
  const value = (await findApp()).session_duration ?? "24h";
  cached = { value, at: now };
  return value;
}

/** 只給測試用 */
export const __resetSessionCache = () => { cached = null; };

/** 改登入有效期。PUT 要整份設定，所以先讀再把原本的欄位原樣送回去，只換 session_duration */
export async function setSessionDuration(duration: typeof KEEP_ON | typeof KEEP_OFF): Promise<string> {
  const app = await findApp();
  const body = {
    name: app.name,
    type: app.type,
    domain: app.domain,
    destinations: app.destinations,
    allowed_idps: app.allowed_idps,
    auto_redirect_to_identity: app.auto_redirect_to_identity,
    app_launcher_visible: app.app_launcher_visible,
    policies: (app.policies ?? []).map((p) => ({ id: p.id, precedence: p.precedence ?? 1 })),
    session_duration: duration,
  };
  const updated = await cf<App>(`/accounts/${await account()}/access/apps/${app.id}`, { method: "PUT", body: JSON.stringify(body) });
  const value = updated.session_duration ?? duration;
  cached = { value, at: Date.now() };
  return value;
}
