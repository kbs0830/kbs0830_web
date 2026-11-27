import { test, expect } from "@playwright/test";

// 福岡每月穿搭（TODO V2，2026-11-27）：/tools/fukuoka-weather/3，12 頁靜態產生，第一句就是答案；數字來自 climate-data.json，不是預報。
test("月份頁：第一句是答案、有建議、有資料來源說明、標題帶搜尋字", async ({ page }) => {
  await page.goto("/tools/fukuoka-weather/1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("福岡 1 月穿搭");
  await expect(page.getByText(/福岡 1 月平均最低 [\d.]+°C、最高 [\d.]+°C，穿「冬季重裝」/)).toBeVisible();
  await expect(page.getByText("這是近 10 年的月平均，不是預報")).toBeVisible();
  await expect(page.getByText(/Open-Meteo/).first()).toBeVisible();
  expect(await page.title()).toContain("福岡 1 月穿搭");
});

test("夏天不硬說比高雄冷；梅雨與颱風的提醒在對的月份", async ({ page }) => {
  await page.goto("/tools/fukuoka-weather/8");
  await expect(page.getByText(/氣溫跟高雄差不多/)).toBeVisible();
  await expect(page.getByText(/颱風/).first()).toBeVisible();
  await page.goto("/tools/fukuoka-weather/6");
  await expect(page.getByText(/梅雨/).first()).toBeVisible();
});

test("不是 1～12 的月份 404；主頁列出 12 個月、sitemap 有 12 頁", async ({ page, request }) => {
  for (const bad of ["0", "13", "03", "abc"]) expect((await request.get(`/tools/fukuoka-weather/${bad}`)).status()).toBe(404);
  await page.goto("/tools/fukuoka-weather");
  await expect(page.getByRole("navigation", { name: "福岡每月穿搭" }).getByRole("link")).toHaveCount(12);
  const xml = await (await request.get("/sitemap.xml")).text();
  expect((xml.match(/\/tools\/fukuoka-weather\/\d+</g) ?? []).length).toBe(12);
});
