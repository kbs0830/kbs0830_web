import { expect, test } from "@playwright/test";

// 使用者的規則（CLAUDE.md Key Constraints 1，2026-11-05 再確認）：
// 中文本名「李秉威」AI 跟爬蟲要找得到，但人在網頁上看不到——只能在 JSON-LD、/llms.txt、Markdown 版這種不可見的地方。
// Facebook 連結 2026-11-05 起先隱藏。這支測試擋住「之後改版不小心把它們放回畫面上」。
// 只讀文字、不做互動，所以直接 page.goto（gotoReady 等的 data-hydrated 只有首頁才有）。
const PAGES = ["/", "/resume", "/now", "/uses", "/flights", "/hotels", "/blog", "/blog/task-scheduler-72-hours", "/projects/kbs0830-web"];

for (const path of PAGES) {
  test(`${path}：畫面上看不到本名、也沒有 Facebook 連結`, async ({ page }) => {
    await page.goto(path);
    // innerText 只算真的顯示出來的文字（<script> 裡的 JSON-LD 不算）；<title> 跟 meta description 會出現在搜尋結果，也要檢查
    expect(await page.locator("body").innerText()).not.toContain("李秉威");
    expect(await page.title()).not.toContain("李秉威");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description ?? "").not.toContain("李秉威");
    await expect(page.locator('a[href*="facebook.com"]')).toHaveCount(0);
  });
}

test("首頁的 JSON-LD（不可見）有本名，搜尋引擎跟 AI 才找得到", async ({ page }) => {
  await page.goto("/");
  const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(jsonLd).toContain("李秉威");
});
