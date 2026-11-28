import type { NextConfig } from "next";
import { execFileSync, execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { GISCUS } from "./src/lib/site/giscus";
import { hiddenProjectRedirects } from "./src/lib/content/projects";

// 頁尾的「版本＋最後更新時間」：build 當下 HEAD 的 commit（hash 跟 commit 時間）。
// 部署一定是在 git repo 裡 build；萬一讀不到（沒有 git）就顯示 dev，不讓 build 失敗
function gitHead() {
  try {
    const [sha, time] = execSync("git log -1 --format=%H%n%cI", { encoding: "utf8" }).trim().split("\n");
    // 全部 commit 數＋第一個 commit 的時間（/2026 年度回顧用，TODO B18）
    const count = execFileSync("git", ["rev-list", "--count", "HEAD"], { encoding: "utf8", windowsHide: true }).trim();
    const first = execFileSync("git", ["log", "--reverse", "--format=%cI", "--max-parents=0"], { encoding: "utf8", windowsHide: true }).trim().split("\n")[0];
    return { sha, time, count, first };
  } catch {
    return { sha: "", time: "", count: "", first: "" };
  }
}
const head = gitHead();

// /changelog 的資料（lib/ops/changelog.ts）：只留 feat commit 的「短 hash␟時間␟標題」。
// 在這裡讀、用 env 傳給頁面——2026-11-21 第一次上線時頁面自己在產生靜態頁的 worker 裡跑 git log，
// 自己 build 正常、CI runner 部署的 build 卻是空的（next.config 這裡的 git 一直正常），所以改成在這裡讀。
// 第二次（同一天）改到這裡還是空的、也沒有錯誤：git 有跑、但輸出裡找不到 feat 那幾行。
// 改成不經過 cmd.exe 直接執行 git（格式字串裡的 % 不會被 shell 碰到），找不到時把輸出的樣子記進 build log。
function gitFeatLog() {
  try {
    const raw = execFileSync("git", ["log", "--no-merges", "--format=%h%x1f%cI%x1f%s"], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    const lines = raw.split("\n").filter((line) => /\x1ffeat[(!:]/.test(line));
    if (lines.length === 0) {
      console.warn(`[changelog] git log 有輸出但沒有 feat：${raw.split("\n").length} 行，第一行 ${JSON.stringify(raw.split("\n")[0])}`);
    }
    return lines.join("\n");
  } catch (e) {
    console.warn(`[changelog] git log 失敗：${e instanceof Error ? e.message : e}`);
    return "";
  }
}

// dev（next dev、CI 的 E2E）多給兩個：React Fast Refresh 要 eval、熱更新要 websocket。正式站沒有
function contentSecurityPolicy(dev: boolean, extraConnect = "") {
  return [
    "default-src 'self'",
    // static.cloudflareinsights.com：Cloudflare Web Analytics 的 beacon，Cloudflare 在 edge 只對真的瀏覽器插入，
    // 本機、curl、E2E 都看不到——正式開 CSP 後幾分鐘就從 /api/csp-report 抓到它被擋（2026-11-09）
    // 'wasm-unsafe-eval'：只允許編譯 WebAssembly（不開放 eval）。FoodLens 作品頁的瀏覽器端辨識（ONNX Runtime Web）要用
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com${GISCUS ? " https://giscus.app" : ""}${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://ghchart.rshah.org https://i.scdn.co",
    "font-src 'self' data:",
    // cloudflareinsights.com：上面那支 beacon 把數據送回這裡（/cdn-cgi/rum）
    `connect-src 'self' https://cloudflareinsights.com${dev ? " ws: wss:" : ""}${extraConnect}`,
    "worker-src 'self' blob:",
    // 文章留言（lib/site/giscus.ts 有設定才開）：giscus 的 iframe
    ...(GISCUS ? ["frame-src https://giscus.app"] : []),
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

// 在正式站資料夾底下的 git worktree 裡 build／dev／執行（2026-11-28）：Claude Code 的 session worktree
// （.claude/worktrees/<名字>，TODO C14）、部署用的乾淨副本 .live/（TODO C13）。它們沒有自己的 node_modules
// （套件只在正式站資料夾那份，由 deploy.ps1 維護），Node 會往上層找到，但 Turbopack 只在「最近的 lockfile 那層」裡找檔案
// → 報 Could not find the Next.js package。這裡沒有 node_modules 就往上找有 next 的那層當 root；正式站資料夾本身有，不受影響
function findWorktreeRoot(dir: string): string | undefined {
  if (existsSync(path.join(dir, "node_modules"))) return undefined;
  for (let d = path.dirname(dir); d !== path.dirname(d); d = path.dirname(d)) {
    if (existsSync(path.join(d, "node_modules", "next", "package.json"))) return d;
  }
  return undefined;
}
const worktreeRoot = findWorktreeRoot(process.cwd());

// tsconfig.deploy.json 是 gitignore 的副本，平常由 deploy.ps1 建；新開的 worktree／新 clone 沒有，
// build 到 .next-test 會報 tsconfig not found → 沒有就先從 tsconfig.json 複製一份
if (distDir !== ".next" && !existsSync("tsconfig.deploy.json")) copyFileSync("tsconfig.json", "tsconfig.deploy.json");

const nextConfig: NextConfig = {
  // deploy.ps1 輪流 build 到 .next-a / .next-b（線上那槽照常服務），scripts/server.js 依
  // data/next-dist-dir.txt 決定用哪槽。平常（dev、手動 build、E2E）沒設這個變數，一律是 .next
  distDir,
  ...(worktreeRoot && { turbopack: { root: worktreeRoot }, outputFileTracingRoot: worktreeRoot }),
  // 部署 build 時 Next 會把 <distDir>/types 自動寫進 tsconfig 的 include：讓它改那份 gitignore
  // 的副本，不要弄髒 tsconfig.json（VS Code 也就不會去監看、鎖住那兩槽）
  typescript: distDir === ".next" ? undefined : { tsconfigPath: "tsconfig.deploy.json" },
  // React Compiler：自動 memoization，取代手寫 useMemo/useCallback（2026-10 升級加入）
  reactCompiler: true,
  // 不送 x-powered-by: Next.js（2026-11-25 安全檢查：不必告訴別人用什麼框架、哪一版）
  poweredByHeader: false,
  // <Link href> 寫錯路徑（打錯字、頁面改名刪掉）在 tsc／build 就會報錯，不會上線才發現 404
  typedRoutes: true,
  // Cache Components（2026-11-25，TODO C13）：頁面＝build 時畫好的靜態外殼＋<Suspense> 串流補進來的即時資料；
  // 快取改用 "use cache"＋cacheLife，路由的 dynamic／revalidate／dynamicParams 設定不能再用。Next 17 會變預設
  cacheComponents: true,
  // 換頁時先預先載入下一頁的靜態外殼（官方要求跟 cacheComponents 一起明講）
  partialPrefetching: true,
  // next/image 優先給 AVIF（比 WebP 再小 20～30%），不支援的瀏覽器照舊拿 WebP
  images: { formats: ["image/avif", "image/webp"] },
  env: { BUILD_COMMIT_SHA: head.sha, BUILD_COMMIT_TIME: head.time, BUILD_COMMIT_COUNT: head.count, BUILD_FIRST_COMMIT_TIME: head.first, BUILD_FEAT_LOG: gitFeatLog() },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // 直播畫面的塔台音量條（AtcMeter，網址 ?audio=1 才會用到）要讀「音訊輸入」：只有這一頁放行麥克風（只量音量，不錄音不上傳），全站其他頁仍然全關
      {
        source: "/radar/live",
        // connect-src 多放行 ws://localhost:*：音量條連 OBS 內建的 WebSocket 伺服器（localhost:4455）讀混音器音量，只有這一頁
        headers: [
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy(process.env.NODE_ENV !== "production", " ws://localhost:* ws://127.0.0.1:*") },
        ],
      },
      // Service Worker 檔（public/sw.js，TODO B10）：瀏覽器本來就會自己檢查更新，但中間的 Cloudflare 預設會把 .js 快取起來，
      // 改了 sw.js 卻一直拿到舊的。要求每次都回源（不快取）
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "private, no-cache, max-age=0, must-revalidate" }],
      },
    ];
  },
  // Markdown for Agents（lib/content/markdown.ts）：AI 工具帶 `Accept: text/markdown`、或網址加 `.md`，
  // 就改回 app/md 產生的 Markdown 版。靜態設定、在 Next 內部比對，每個請求不用多跑任何程式。
  // 只列有 Markdown 版的頁面，不要寫成 /:path*（會把 /_next、/api 也一起轉走）
  async rewrites() {
    const acceptsMarkdown = [{ type: "header" as const, key: "accept", value: ".*text/markdown.*" }];
    const pages = ["/", "/resume", "/now", "/uses", "/flights", "/hotels", "/travel", "/changelog", "/developers", "/blog", "/blog/:slug", "/blog/tags/:tag", "/projects/:slug"];
    return {
      beforeFiles: [
        ...pages.map((source) => ({
          source,
          has: acceptsMarkdown,
          destination: source === "/" ? "/md" : `/md${source}`,
        })),
        { source: "/index.md", destination: "/md" },
        { source: "/:page(resume|now|uses|flights|hotels|travel|changelog|developers|blog).md", destination: "/md/:page" },
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
      // 隱藏的作品（projects.ts 的 hidden＋hiddenRedirect）：舊網址轉到有提到它的頁面，不拿 404（TODO R1）
      ...hiddenProjectRedirects,
      // 有些瀏覽器／工具照舊慣例要 /site.webmanifest，本站的是 /manifest.webmanifest（app/manifest.ts）
      { source: "/site.webmanifest", destination: "/manifest.webmanifest", permanent: true },
    ];
  },
};

export default nextConfig;
