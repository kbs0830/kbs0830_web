import { test, expect } from "@playwright/test";

// 熱門航線距離頁（TODO V3，2026-11-27）：/tools/airport-distance/tpe-fuk，30 頁靜態產生，第一句就是答案。子頁面沒有 data-hydrated，直接 goto。

test("航線頁：第一句是答案、有距離跟時間、標題帶搜尋字、有麵包屑", async ({ page }) => {
  await page.goto("/tools/airport-distance/tpe-fuk");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("台北（桃園）到福岡飛行距離");
  await expect(page.getByText(/台北（桃園，TPE）到福岡（FUK）的直線距離約 1,\d{3} 公里/)).toBeVisible();
  await expect(page.getByText("粗估飛行時間")).toBeVisible();
  expect(await page.title()).toContain("台北（桃園）到福岡飛行距離與時間");
  const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t)["@type"]);
  expect(types).toContain("BreadcrumbList");
});

test("航線頁互相連結：同出發地其他城市、同目的地其他機場；福岡那頁連到今天的直飛班機", async ({ page }) => {
  await page.goto("/tools/airport-distance/khh-fuk");
  await expect(page.getByText("從高雄飛其他日本城市")).toBeVisible();
  await expect(page.getByRole("link", { name: /^台中 / })).toBeVisible();
  await expect(page.getByRole("link", { name: "台灣 ⇄ 福岡直飛班機" })).toBeVisible();
  await page.getByRole("link", { name: /^東京（羽田）/ }).click();
  await expect(page).toHaveURL(/\/tools\/airport-distance\/khh-hnd$/);
  await expect(page.getByRole("link", { name: "台灣 ⇄ 福岡直飛班機" })).toHaveCount(0);
});

test("不存在的航線 404；主工具頁列出 30 條熱門航線；sitemap 有它們", async ({ page, request }) => {
  expect((await page.goto("/tools/airport-distance/fuk-tpe"))?.status()).toBe(404);
  expect((await request.get("/tools/airport-distance/xxx-yyy")).status()).toBe(404);
  await page.goto("/tools/airport-distance");
  await expect(page.getByText("熱門航線 · Popular routes")).toBeVisible();
  expect(await page.locator('a[href^="/tools/airport-distance/"]').count()).toBeGreaterThanOrEqual(30);
  const xml = await (await request.get("/sitemap.xml")).text();
  expect((xml.match(/\/tools\/airport-distance\/[a-z]{3}-[a-z]{3}</g) ?? []).length).toBe(30);
});
