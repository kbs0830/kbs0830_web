import type { NextConfig } from "next";

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
