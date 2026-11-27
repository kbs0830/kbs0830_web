import { test, expect, type Page } from "@playwright/test";

// 效能預算（TODO C7，2026-11-27）：量「正式 build」的首頁、記事列表、工具頁傳輸量（壓縮後）跟 LCP，退步超過預算就失敗。
// 只在正式 build 才有意義：CI 的 E2E 跑的是 `next dev`（沒壓縮、沒 minify，數字大好幾倍），所以預設跳過。
// 手動／驗證 3200 時帶 PERF_BUDGET=1：
//   PERF_BUDGET=1 node node_modules/@playwright/test/cli.js test -c playwright.local-3200.config.ts perf-budget
// 預算＝2026-11-27 在正式 build 量到的數字再放寬約 30%（量法：performance resource timing 的 encodedBodySize，單位 KB）。
// LCP 在本機沒有網路延遲、不降速，量到首頁約 1.3 秒；預算 2.5 秒（Google「良好」的門檻）。
// 預算要調大請寫理由（新增什麼功能換來多少 KB），不要為了讓測試過就默默調高。
test.skip(!process.env.PERF_BUDGET, "只量正式 build：設 PERF_BUDGET=1 才跑");

type Budget = { js: number; css: number; font: number; html: number; requests: number; lcp?: number };
const PAGES: { path: string; budget: Budget }[] = [
  // 量到（桌機）：js 452、css 116、font 440、html 93、53 個請求、LCP 1360ms
  { path: "/", budget: { js: 600, css: 150, font: 600, html: 125, requests: 70, lcp: 2500 } },
  // 量到：js 212、css 116、font 100、html 22、39 個請求
  { path: "/blog", budget: { js: 280, css: 150, font: 200, html: 40, requests: 52 } },
  // 量到：js 196、css 116、font 351、html 15、34 個請求
  { path: "/tools/jpy", budget: { js: 260, css: 150, font: 480, html: 30, requests: 46 } },
];

async function measure(page: Page, path: string) {
  await page.addInitScript(() => {
    (window as unknown as { __lcp: number }).__lcp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) (window as unknown as { __lcp: number }).__lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const es = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const kb = (f: (e: PerformanceResourceTiming) => boolean) => Math.round(es.filter(f).reduce((n, e) => n + e.encodedBodySize, 0) / 1024);
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return {
      js: kb((e) => e.name.endsWith(".js") || e.initiatorType === "script"),
      css: kb((e) => e.name.endsWith(".css")),
      font: kb((e) => /\.(woff2?|ttf)/.test(e.name)),
      html: Math.round(nav.encodedBodySize / 1024),
      requests: es.length,
      lcp: Math.round((window as unknown as { __lcp: number }).__lcp),
    };
  });
}

for (const { path, budget } of PAGES) {
  test(`效能預算：${path}`, async ({ page }) => {
    const m = await measure(page, path);
    const over = (Object.keys(budget) as (keyof Budget)[]).filter((k) => budget[k] !== undefined && m[k] > (budget[k] as number));
    expect(over, `超過預算：${over.map((k) => `${k} ${m[k]} > ${budget[k]}`).join("、")}（量到 ${JSON.stringify(m)}）`).toEqual([]);
  });
}
