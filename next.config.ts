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

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
    const pages = ["/", "/resume", "/now", "/uses", "/flights", "/hotels", "/blog", "/blog/:slug", "/projects/:slug"];
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
