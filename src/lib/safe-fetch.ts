import https from "node:https";
import dns from "node:dns";
import net from "node:net";
import type { LookupFunction } from "node:net";

// 抓「訪客輸入的網址」用的安全版 fetch（TODO J12，2026-11-24）。防 SSRF：
//   - 只接受一般網域（不收 IP、localhost、.local／.internal 這類內網名稱），只走 https:443
//   - 連線那一刻才檢查 DNS 解出來的 IP（自訂 lookup），內網／保留位址一律拒絕——DNS 換位址（rebinding）也繞不過
//   - 轉址自己跟（最多 3 次），每一跳都重新檢查；逾時、回應大小都有上限
// 只給 /api/tools/* 用；網站自己抓固定網址的（天氣、匯率）照舊用 live-cache 的 fetchText。

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v);
  }
  return true;
}

const HOST_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;
const INTERNAL_RE = /(^|\.)(localhost|local|internal|lan|home|arpa|corp|intranet)$/;

/** 使用者輸入（可能帶 https://、路徑、大小寫）→ 乾淨的網域；不合格回 null */
export function normalizeHost(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;
  let host: string;
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (u.port && u.port !== "443") return null;
    host = u.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
  if (net.isIP(host.replace(/^\[|\]$/g, ""))) return null;
  if (!HOST_RE.test(host) || INTERNAL_RE.test(host)) return null;
  return host;
}

const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true }, (err, addrs) => {
    if (err) return callback(err, "", 4);
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
      return callback(Object.assign(new Error(`不允許連到 ${hostname} 解析出來的位址`), { code: "EBLOCKED" }), "", 4);
    }
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addrs);
    callback(null, addrs[0].address, addrs[0].family);
  });
};

export interface PublicFetchResult {
  status: number;
  text: string;
  url: string;
}

function getOnce(url: URL, timeoutMs: number, maxBytes: number): Promise<{ status: number; location?: string; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        lookup: safeLookup,
        timeout: timeoutMs,
        headers: { "User-Agent": "kbs0830-tools/1.0 (+https://kbs0830.com/tools/ai-crawlers)", Accept: "text/plain,*/*" },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ status, location: res.headers.location, text: "" });
        }
        let size = 0;
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > maxBytes) {
            req.destroy();
            resolve({ status, text: Buffer.concat(chunks).toString("utf8") });
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => resolve({ status, text: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("逾時")));
    req.on("error", reject);
  });
}

/** 抓一個公開網域底下的 https 路徑 */
export async function fetchPublicText(
  host: string,
  path: string,
  { timeoutMs = 6000, maxBytes = 200_000, maxRedirects = 3 } = {},
): Promise<PublicFetchResult> {
  let url = new URL(`https://${host}${path}`);
  for (let i = 0; i <= maxRedirects; i++) {
    const r = await getOnce(url, timeoutMs, maxBytes);
    if (!r.location) return { status: r.status, text: r.text, url: url.toString() };
    const next = new URL(r.location, url);
    if (next.protocol !== "https:" || !normalizeHost(next.hostname) || (next.port && next.port !== "443")) throw new Error("轉址到不允許的網址");
    url = next;
  }
  throw new Error("轉址太多次");
}
