import { test, expect } from "@playwright/test";

// 小工具（決策表 J 系列，2026-11-24）。子頁面沒有 data-hydrated 標記，用 toPass／自動重試等 hydration。

test("/tools 總覽列出所有工具", async ({ page }) => {
  await page.goto("/tools");
  for (const name of ["日幣換匯比價", "台灣⇄福岡直飛", "福岡穿搭", "機場距離", "日本消費稅", "AI 爬蟲檢查", "UA 是爬蟲嗎"]) {
    await expect(page.getByRole("main").getByRole("link", { name: new RegExp(name) })).toBeVisible();
  }
});

test("機場距離：網址帶的航線直接算出來", async ({ page }) => {
  await page.goto("/tools/airport-distance?from=TPE&to=NRT");
  await expect(page.getByText(/桃園（TPE）→/)).toBeVisible({ timeout: 15_000 });
  // 桃園—成田約 2,180 km
  await expect(page.getByText(/^2,1\d\d km$/)).toBeVisible();
});

test("日本消費稅：未稅 1000 日圓、10% → 含稅 1100", async ({ page }) => {
  await page.goto("/tools/japan-tax?yen=1000&mode=excl&rate=10");
  await expect(page.getByText("¥1,100")).toBeVisible();
  await expect(page.getByText("¥100", { exact: true })).toBeVisible();
});

test("UA 判斷：ClaudeBot 是 AI 爬蟲", async ({ page }) => {
  await page.goto("/tools/user-agent");
  const box = page.getByRole("textbox", { name: "User-Agent" });
  await expect(async () => {
    await box.fill("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)");
    await expect(page.getByText("（ClaudeBot）")).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(page.getByText("AI 爬蟲", { exact: true })).toBeVisible();
});

test("AI 爬蟲檢查：不收內網名稱（防 SSRF）", async ({ request }) => {
  for (const domain of ["localhost", "127.0.0.1", "printer.local", "example.com:8080"]) {
    const res = await request.get(`/api/tools/robots?domain=${encodeURIComponent(domain)}`);
    expect(res.status(), domain).toBe(400);
  }
});
