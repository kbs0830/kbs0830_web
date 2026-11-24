import https from "node:https";
import dns from "node:dns";
import net from "node:net";
import type { LookupFunction } from "node:net";

// 抓「訪客輸入的網址」用的安全版 fetch（TODO J12，2026-11-24）。防 SSRF：
//   - 只接受一般網域（不收 IP、localhost、.local／.internal 這類內網名稱），只走 https:443
//   - 連線那一刻才檢查 DNS 解出來的 IP（自訂 lookup），內網／保留位址一律拒絕——DNS 換位址（rebinding）也繞不過
//   - 轉址自己跟（最多 3 次），每一跳都重新檢查；逾時、回應大小都有上限
// 只給 /api/tools/* 用；網站自己抓固定網址的（天氣、匯率）照舊用 live-cache 的 fetchText。

// 不能連的位址：內網、本機、保留、文件範例、多播，加上「IPv6 裡面包 IPv4」的轉換範圍
// （IPv4-compatible、IPv4-mapped、NAT64、6to4、Teredo）——不然 64:ff9b::7f00:1 這種寫法就能繞到 127.0.0.1。
// 2026-11-24 安全檢查抓到第一版用字串比對漏了這些，改用 net.BlockList 照網段判斷
// IPv4、IPv6 各一份：同一份 BlockList 查 IPv4 時也會比 IPv6 規則（拿 ::ffff:a.b.c.d 去比），
// ::ffff:0:0/96 會把所有 IPv4 都擋掉
const BLOCKED_V4 = new net.BlockList();
const BLOCKED_V6 = new net.BlockList();
for (const [addr, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) BLOCKED_V4.addSubnet(addr, prefix, "ipv4");
for (const [addr, prefix] of [
  ["::", 96], ["::ffff:0:0", 96], ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64], ["2001::", 32], ["2001:db8::", 32],
  ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) BLOCKED_V6.addSubnet(addr, prefix, "ipv6");

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return BLOCKED_V4.check(ip, "ipv4");
  if (family === 6) return BLOCKED_V6.check(ip, "ipv6");
  return true; // 看不懂的一律當不安全
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

// 逾時是「從發出請求開始的總時間」，不是「多久沒收到資料」：
// 對方每幾秒滴一點資料就能把連線一直拖著（2026-11-24 安全檢查抓到，第一版用的是 socket 閒置逾時）
function getOnce(url: URL, timeoutMs: number, maxBytes: number): Promise<{ status: number; location?: string; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        lookup: safeLookup,
        signal: AbortSignal.timeout(timeoutMs),
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
        res.on("error", (e) => reject(e.name === "AbortError" || e.name === "TimeoutError" ? new Error("逾時") : e));
      },
    );
    req.on("error", (e) => reject(e.name === "AbortError" || e.name === "TimeoutError" ? new Error("逾時") : e));
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
