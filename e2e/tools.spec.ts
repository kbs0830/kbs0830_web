import { test, expect } from "@playwright/test";

// 小工具（決策表 J 系列，2026-11-24）。子頁面沒有 data-hydrated 標記，用 toPass／自動重試等 hydration。

test("/tools 總覽列出所有工具", async ({ page }) => {
  await page.goto("/tools");
  for (const name of ["日幣換匯比價", "台灣⇄福岡直飛", "福岡穿搭", "機場距離", "日本消費稅", "AI 爬蟲檢查", "UA 是爬蟲嗎", "Tailwind v4 變數檢查", "PowerShell 亂碼檢查"]) {
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

test("可用率徽章（B15）是 SVG", async ({ request }) => {
  const res = await request.get("/api/badge/uptime");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/svg+xml");
  expect(await res.text()).toMatch(/uptime 90d/);
});

test("發文標記 ?ref=（I9）：記錄後從網址拿掉，其他參數保留", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/api/visitor-stats") && r.method() === "POST") sent.push(r.postData() ?? "");
  });
  await page.goto("/tools/japan-tax?yen=500&ref=reddit-selfhosted");
  await expect(page).toHaveURL(/\/tools\/japan-tax\?yen=500/);
  await expect(page).not.toHaveURL(/ref=/);
  await expect.poll(() => sent.some((b) => b.includes('"ref":"ref:reddit-selfhosted"'))).toBe(true);
});

test("Tailwind v4 變數檢查：預設範例找到要改的地方", async ({ page }) => {
  await page.goto("/tools/tailwind-v4-vars");
  await expect(page.getByText(/找到 \d+ 處在 v4 會失效的寫法/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("bg-(--accent)").first()).toBeVisible();
});

test("PowerShell 亂碼檢查：沒有 BOM 的中文 .ps1 → 要修、可以下載", async ({ page }) => {
  await page.goto("/tools/ps1-encoding");
  await page.locator('input[type="file"]').setInputFiles({ name: "deploy.ps1", mimeType: "text/plain", buffer: Buffer.from('Write-Host "部署完成"', "utf8") });
  await expect(page.getByText("要修")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "下載加好 BOM 的版本" })).toBeVisible();
});
