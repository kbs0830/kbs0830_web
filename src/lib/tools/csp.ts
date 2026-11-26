// CSP 標頭解讀的邏輯（TODO J16，2026-11-26，畫面在 components/tools/CspAnalyzer.tsx）。
// 貼上 Content-Security-Policy（可以連 header 名稱一起貼）→ 拆成逐條指令、每條講人話、標出常見風險、給修改建議。
// 全部在瀏覽器裡跑，不送出去。風險判斷只看寫法，不會真的去驗證網址存不存在。

export type Severity = "high" | "medium" | "low" | "info" | "good";
export type Finding = { severity: Severity; directive?: string; text: string; fix?: string };
export type Directive = { name: string; values: string[]; explain: string; duplicate: boolean };
export type CspResult = { directives: Directive[]; findings: Finding[]; reportOnly: boolean; empty: boolean };

const EXPLAIN: Record<string, string> = {
  "default-src": "其他「-src」指令沒寫時的預設來源（fallback）",
  "script-src": "JavaScript 可以從哪裡載入、能不能執行行內腳本",
  "script-src-elem": "<script> 標籤的來源（比 script-src 更細）",
  "script-src-attr": "onclick 這類行內事件處理器",
  "style-src": "CSS 可以從哪裡載入、能不能用行內 <style>",
  "style-src-elem": "<style>、<link rel=stylesheet> 的來源",
  "style-src-attr": "style=\"…\" 行內樣式屬性",
  "img-src": "圖片來源",
  "font-src": "字型來源",
  "connect-src": "fetch、XHR、WebSocket、EventSource 能連去哪裡",
  "media-src": "<audio>、<video> 來源",
  "object-src": "<object>、<embed>、<applet>（Flash 時代的外掛）來源",
  "frame-src": "<iframe> 能嵌入哪些網址",
  "child-src": "iframe 與 Web Worker 的來源（舊式 fallback）",
  "worker-src": "Worker、SharedWorker、ServiceWorker 的來源",
  "manifest-src": "Web App Manifest 來源",
  "prefetch-src": "預先抓取的來源（已被棄用，瀏覽器多半不支援）",
  "base-uri": "<base> 標籤能設定的基底網址（防止被改寫相對路徑）",
  "form-action": "表單能送出到哪裡",
  "frame-ancestors": "誰可以把這個頁面放進 iframe（防點擊劫持，取代 X-Frame-Options）",
  sandbox: "把頁面關進沙箱，限制表單、腳本、彈窗等",
  "report-uri": "違規報告送到哪個網址（舊寫法，仍被廣泛使用）",
  "report-to": "違規報告送到哪個 Reporting-Endpoints 群組（新寫法）",
  "upgrade-insecure-requests": "把頁面裡的 http:// 資源自動升級成 https://",
  "block-all-mixed-content": "擋掉混合內容（已棄用，upgrade-insecure-requests 就夠）",
  "require-trusted-types-for": "要求把資料寫進危險的 DOM API 前必須經過 Trusted Types",
  "trusted-types": "允許哪些 Trusted Types 政策名稱",
  "plugin-types": "允許哪些外掛 MIME（已移除）",
  "navigate-to": "頁面能導向哪裡（已移除，沒有瀏覽器實作）",
  referrer: "舊的 Referrer 設定（已移除，改用 Referrer-Policy 標頭）",
};

const FETCH = new Set([
  "default-src", "script-src", "script-src-elem", "script-src-attr", "style-src", "style-src-elem", "style-src-attr",
  "img-src", "font-src", "connect-src", "media-src", "object-src", "frame-src", "child-src", "worker-src", "manifest-src", "prefetch-src",
]);
const SCRIPT = new Set(["default-src", "script-src", "script-src-elem"]);
const DEPRECATED: Record<string, string> = {
  "block-all-mixed-content": "已棄用：用 upgrade-insecure-requests 就夠了",
  "plugin-types": "已從規格移除，瀏覽器會忽略",
  "navigate-to": "已從規格移除，沒有瀏覽器支援",
  referrer: "已移除：改用 Referrer-Policy 標頭",
  "prefetch-src": "已棄用，瀏覽器多半忽略",
};

const has = (values: string[], kw: string) => values.some((v) => v.toLowerCase() === `'${kw}'`);
const hasNonceOrHash = (values: string[]) => values.some((v) => /^'(nonce-|sha(256|384|512)-)/i.test(v));

const SCHEME_NOTE: Record<string, string> = {
  "https:": "任何 HTTPS 網站的腳本都能載入，包括攻擊者的網站",
  "http:": "未加密的 http 來源，可以被中間人換掉內容",
  "data:": "data: 網址可以內嵌任意腳本，是常見的 XSS 繞過",
  "blob:": "blob: 網址可以由頁面裡的程式產生，注入的程式碼能借它執行",
  "filesystem:": "filesystem: 網址可以被注入的程式碼寫入內容再執行",
};

export function analyzeCsp(input: string): CspResult {
  let text = input.trim();
  // 連 header 名稱一起貼：Content-Security-Policy: …／Content-Security-Policy-Report-Only: …／<meta … content="…">
  const headerMatch = /^content-security-policy(-report-only)?\s*:\s*/i.exec(text);
  let reportOnly = false;
  if (headerMatch) {
    reportOnly = !!headerMatch[1];
    text = text.slice(headerMatch[0].length);
  }
  const meta = /content\s*=\s*(["'])([\s\S]*?)\1/i.exec(text);
  if (meta && /<meta/i.test(text)) text = meta[2];

  const seen = new Set<string>();
  const directives: Directive[] = [];
  for (const part of text.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const name = tokens[0].toLowerCase();
    const duplicate = seen.has(name);
    seen.add(name);
    directives.push({ name, values: tokens.slice(1), explain: EXPLAIN[name] ?? "不認得這條指令（拼錯了，或是太新／實驗中的指令）", duplicate });
  }

  const findings: Finding[] = [];
  if (directives.length === 0) return { directives, findings, reportOnly, empty: true };
  const first = new Map<string, Directive>();
  for (const d of directives) if (!first.has(d.name)) first.set(d.name, d);
  const effective = (name: string) => first.get(name) ?? (FETCH.has(name) ? first.get("default-src") : undefined);

  if (reportOnly) {
    findings.push({ severity: "info", text: "這是 Report-Only：只會回報違規，不會真的擋。調到不再有報告之後，改成正式的 Content-Security-Policy。" });
  }

  for (const d of directives) {
    if (d.duplicate) findings.push({ severity: "medium", directive: d.name, text: `${d.name} 寫了不只一次：瀏覽器只認第一個，後面的會被忽略。`, fix: "合併成一條。" });
    if (!(d.name in EXPLAIN)) findings.push({ severity: "low", directive: d.name, text: `不認得的指令「${d.name}」，瀏覽器會直接略過。`, fix: "檢查拼字（常見：把 script-src 寫成 scripts-src）。" });
    if (DEPRECATED[d.name]) findings.push({ severity: "low", directive: d.name, text: DEPRECATED[d.name] });
    if ((d.name === "frame-ancestors" || d.name === "sandbox") && reportOnly) {
      findings.push({ severity: "info", directive: d.name, text: `${d.name} 在 Report-Only 或 <meta> 裡不會生效，要放在正式的 HTTP 標頭。` });
    }
  }

  for (const [name, d] of first) {
    if (!FETCH.has(name)) continue;
    const v = d.values;
    const inScript = SCRIPT.has(name);
    const strict = has(v, "strict-dynamic");
    const protectedByNonce = hasNonceOrHash(v);

    if (has(v, "unsafe-inline")) {
      if (inScript && protectedByNonce) {
        findings.push({ severity: "info", directive: name, text: "'unsafe-inline' 跟 nonce／hash 同時出現：支援 nonce 的瀏覽器會忽略 'unsafe-inline'，只留給舊瀏覽器當退路。" });
      } else if (inScript) {
        findings.push({ severity: "high", directive: name, text: "'unsafe-inline' 允許任何行內腳本執行，XSS 注入的 <script> 也會被放行，等於 script-src 形同虛設。", fix: "改用 nonce（每次請求產生一個隨機值，寫在 <script nonce=…> 與標頭裡）或 hash，並加上 'strict-dynamic'。" });
      } else if (name.startsWith("style-src")) {
        findings.push({ severity: "low", directive: name, text: "'unsafe-inline' 讓行內樣式都能用。風險比腳本小（主要是被拿來洩漏資料或假造畫面），很多框架暫時拿不掉。", fix: "能的話改用 nonce／hash；Next.js、CSS-in-JS 常需要先接受它。" });
      } else {
        findings.push({ severity: "medium", directive: name, text: `${name} 用了 'unsafe-inline'，通常不需要。` });
      }
    }
    if (inScript && has(v, "unsafe-eval")) {
      findings.push({ severity: "high", directive: name, text: "'unsafe-eval' 允許 eval()、new Function()、字串形式的 setTimeout，注入的字串也能被當程式執行。", fix: "找出誰在用 eval（有些函式庫的 build 版本會），換成不用 eval 的版本；WebAssembly 改用 'wasm-unsafe-eval'。" });
    }
    if (has(v, "unsafe-hashes")) findings.push({ severity: "low", directive: name, text: "'unsafe-hashes' 讓特定 hash 的行內事件處理器（onclick）能執行，範圍比 'unsafe-inline' 小，但仍是弱點。" });
    if (v.includes("*")) {
      const bad = inScript || name === "object-src";
      findings.push({ severity: bad ? "high" : "low", directive: name, text: `${name} 用了「*」：幾乎任何網址都能載入${inScript ? "，攻擊者放在別處的腳本也行" : ""}。`, fix: "列出真正會用到的網域。" });
    }
    for (const scheme of ["https:", "http:", "data:", "blob:", "filesystem:"]) {
      if (!v.some((x) => x.toLowerCase() === scheme)) continue;
      if (inScript || name === "object-src") {
        findings.push({ severity: "high", directive: name, text: `${name} 允許整個「${scheme}」協定：${SCHEME_NOTE[scheme]}。`, fix: "改成明確的網域，或用 nonce／hash 搭配 'strict-dynamic'。" });
      } else if (scheme === "http:") {
        findings.push({ severity: "medium", directive: name, text: `${name} 允許 http:（未加密），會造成混合內容、可被竄改。`, fix: "改成 https:，並考慮加 upgrade-insecure-requests。" });
      }
    }
    if (inScript) {
      for (const x of v) {
        if (/^(https?:\/\/)?\*\./i.test(x)) {
          findings.push({ severity: "medium", directive: name, text: `${x} 是萬用子網域：該網域下任何子網域（含可被別人註冊或接管的）都能提供腳本。`, fix: "改成具體的主機名稱。" });
        }
        if (/^https?:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|ajax\.googleapis\.com)\/?$/i.test(x)) {
          findings.push({ severity: "medium", directive: name, text: `${x} 是公共 CDN：任何人上傳到上面的腳本都能被你的頁面載入（有已知的 CSP 繞過）。`, fix: "加上路徑（https://cdn.example/你的套件/），或用 hash（SRI）鎖定檔案。" });
        }
      }
      if (strict && !protectedByNonce) {
        findings.push({ severity: "medium", directive: name, text: "'strict-dynamic' 沒有搭配 nonce 或 hash：它會讓「來源白名單」失效，沒有 nonce／hash 就沒有任何腳本被信任。", fix: "補上 'nonce-…' 或 'sha256-…'。" });
      }
    }
  }

  // 缺少的指令
  const scriptEff = effective("script-src");
  if (!first.has("default-src") && !first.has("script-src")) {
    findings.push({ severity: "high", text: "沒有 default-src 也沒有 script-src：腳本來源完全不受限，CSP 對 XSS 幾乎沒保護。", fix: "至少加 default-src 'self'，再為 script-src 設 nonce／hash。" });
  } else if (!first.has("script-src")) {
    findings.push({ severity: "info", directive: "script-src", text: "沒有單獨寫 script-src，腳本沿用 default-src 的規則。" });
  }
  const objectEff = effective("object-src");
  if (objectEff && has(objectEff.values, "none")) {
    findings.push({ severity: "good", directive: "object-src", text: "object-src 'none'（或由 default-src 'none' 涵蓋）：不允許外掛內容，很好。" });
  } else {
    findings.push({ severity: "medium", directive: "object-src", text: "沒有擋掉 object-src：外掛內容（<object>、<embed>）會沿用 default-src，通常比需要的寬。", fix: "加上 object-src 'none'。" });
  }
  if (!first.has("base-uri")) findings.push({ severity: "medium", directive: "base-uri", text: "沒有 base-uri：注入一個 <base href> 就能把頁面裡所有相對路徑的腳本改去攻擊者的網站（base-uri 不會沿用 default-src）。", fix: "加上 base-uri 'self'（或 'none'）。" });
  if (!first.has("frame-ancestors") && !reportOnly) findings.push({ severity: "low", directive: "frame-ancestors", text: "沒有 frame-ancestors：任何網站都能把你的頁面放進 iframe（點擊劫持）。frame-ancestors 不會沿用 default-src。", fix: "不需要被嵌入就寫 frame-ancestors 'none'；只給自己用寫 'self'。" });
  if (!first.has("form-action")) findings.push({ severity: "low", directive: "form-action", text: "沒有 form-action：被注入的表單可以把資料送去任何網址（form-action 不會沿用 default-src）。", fix: "加上 form-action 'self'。" });
  if (!first.has("upgrade-insecure-requests") && !first.has("block-all-mixed-content")) {
    findings.push({ severity: "info", text: "沒有 upgrade-insecure-requests：頁面裡殘留的 http:// 資源不會自動升級成 https://。" });
  }
  if (!first.has("report-uri") && !first.has("report-to")) {
    findings.push({ severity: "info", text: "沒有 report-uri／report-to：瀏覽器擋到東西不會通知你。調整政策的時候建議先開 Report-Only 並接收報告。" });
  }
  if (scriptEff && hasNonceOrHash(scriptEff.values) && has(scriptEff.values, "strict-dynamic") && !has(scriptEff.values, "unsafe-eval")) {
    findings.push({ severity: "good", directive: first.has("script-src") ? "script-src" : "default-src", text: "nonce／hash 搭配 'strict-dynamic'：這是現在建議的「嚴格 CSP」寫法。" });
  }

  const order: Severity[] = ["high", "medium", "low", "info", "good"];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  return { directives, findings, reportOnly, empty: false };
}

export const EXAMPLE = [
  "default-src 'self';",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;",
  "style-src 'self' 'unsafe-inline';",
  "img-src 'self' data: https:;",
  "connect-src 'self' https://api.example.com;",
  "frame-ancestors 'self'",
].join("\n");
