import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// 頁尾的「版本＋最後更新時間」：build 當下 HEAD 的 commit（hash 跟 commit 時間）。
// 部署一定是在 git repo 裡 build；萬一讀不到（沒有 git）就顯示 dev，不讓 build 失敗
function gitHead() {
  try {
    const [sha, time] = execSync("git log -1 --format=%H%n%cI", { encoding: "utf8" }).trim().split("\n");
    return { sha, time };
  } catch {
    return { sha: "", time: "" };
  }
}
const head = gitHead();

// dev（next dev、CI 的 E2E）多給兩個：React Fast Refresh 要 eval、熱更新要 websocket。正式站沒有
function contentSecurityPolicy(dev: boolean) {
  return [
    "default-src 'self'",
    // static.cloudflareinsights.com：Cloudflare Web Analytics 的 beacon，Cloudflare 在 edge 只對真的瀏覽器插入，
    // 本機、curl、E2E 都看不到——正式開 CSP 後幾分鐘就從 /api/csp-report 抓到它被擋（2026-11-09）
    `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://ghchart.rshah.org https://i.scdn.co",
    "font-src 'self' data:",
    // cloudflareinsights.com：上面那支 beacon 把數據送回這裡（/cdn-cgi/rum）
    `connect-src 'self' https://cloudflareinsights.com${dev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Content-Security-Policy（2026-11-09 先 report-only，同一天正式開：全站每一頁用強制模式跑過 E2E、
  // Chrome＋Firefox 都沒有違規，線上回報也是 0 筆）。被擋的東西照樣回報到 /api/csp-report，
  // `curl https://kbs0830.com/api/csp-report` 看得到。新增外部資源（圖片網域、script、API）要加進這裡。
  // 'unsafe-inline'：<head> 的深色模式 inline script、JSON-LD、Next 的 inline hydration script 都需要（要拿掉得改 nonce，頁面會變動態）
  // Cloudflare 的 email 保護會插 /cdn-cgi/scripts/…/email-decode.min.js，同網域，'self' 就涵蓋
  { key: "Content-Security-Policy", value: contentSecurityPolicy(process.env.NODE_ENV !== "production") },
];

const distDir = process.env.NEXT_DIST_DIR || ".next";

const nextConfig: NextConfig = {
  // deploy.ps1 輪流 build 到 .next-a / .next-b（線上那槽照常服務），scripts/server.js 依
  // data/next-dist-dir.txt 決定用哪槽。平常（dev、手動 build、E2E）沒設這個變數，一律是 .next
  distDir,
  // 部署 build 時 Next 會把 <distDir>/types 自動寫進 tsconfig 的 include：讓它改那份 gitignore
  // 的副本，不要弄髒 tsconfig.json（VS Code 也就不會去監看、鎖住那兩槽）
  typescript: distDir === ".next" ? undefined : { tsconfigPath: "tsconfig.deploy.json" },
  // React Compiler：自動 memoization，取代手寫 useMemo/useCallback（2026-10 升級加入）
  reactCompiler: true,
  // <Link href> 寫錯路徑（打錯字、頁面改名刪掉）在 tsc／build 就會報錯，不會上線才發現 404
  typedRoutes: true,
  // next/image 優先給 AVIF（比 WebP 再小 20～30%），不支援的瀏覽器照舊拿 WebP
  images: { formats: ["image/avif", "image/webp"] },
  env: { BUILD_COMMIT_SHA: head.sha, BUILD_COMMIT_TIME: head.time },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // Markdown for Agents（lib/markdown.ts）：AI 工具帶 `Accept: text/markdown`、或網址加 `.md`，
  // 就改回 app/md 產生的 Markdown 版。靜態設定、在 Next 內部比對，每個請求不用多跑任何程式。
  // 只列有 Markdown 版的頁面，不要寫成 /:path*（會把 /_next、/api 也一起轉走）
  async rewrites() {
    const acceptsMarkdown = [{ type: "header" as const, key: "accept", value: ".*text/markdown.*" }];
    const pages = ["/", "/resume", "/now", "/uses", "/flights", "/hotels", "/blog", "/blog/:slug", "/blog/tags/:tag", "/projects/:slug"];
    return {
      beforeFiles: [
        ...pages.map((source) => ({
          source,
          has: acceptsMarkdown,
          destination: source === "/" ? "/md" : `/md${source}`,
        })),
        { source: "/index.md", destination: "/md" },
        { source: "/:page(resume|now|uses|flights|hotels|blog).md", destination: "/md/:page" },
        { source: "/:section(blog|projects)/:slug.md", destination: "/md/:section/:slug" },
        { source: "/blog/tags/:tag.md", destination: "/md/blog/tags/:tag" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        source: "/projects/yartix-ticketing",
        destination: "/projects/ticketing-system",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
