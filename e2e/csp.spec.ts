import { expect, test } from "@playwright/test";

// CSP 正式開（2026-11-09）之後，任何頁面有東西被擋就失敗。被擋的資源瀏覽器會發 securitypolicyviolation 事件，
// 在頁面一開始就掛監聽收集起來。每頁捲到底，讓延遲載入的圖片（GitHub 熱力圖、作品截圖）也載到。
// 新增外部資源忘了加進 next.config.ts 的 CSP，這支會擋下來。
test("sitemap 每一頁都沒有 CSP 違規", async ({ page, request }) => {
  test.setTimeout(240_000);
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __csp: string[] }).__csp.push(`${e.effectiveDirective} ${e.blockedURI || "(inline)"}`);
    });
  });

  const violations: string[] = [];
  for (const path of paths) {
    await page.goto(path);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    await page.waitForLoadState("networkidle");
    const found = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
    violations.push(...found.map((v) => `${decodeURIComponent(path)}：${v}`));
  }
  expect(violations).toEqual([]);
});

test("正式 CSP header 有送出，而且違規會回報", async ({ request }) => {
  const res = await request.get("/");
  const csp = res.headers()["content-security-policy"];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("report-uri /api/csp-report");
  expect(res.headers()["content-security-policy-report-only"]).toBeUndefined();
});
