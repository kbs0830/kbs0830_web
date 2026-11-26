import { test, expect } from "@playwright/test";

// 日報／週報／月報（2026-11-25；2026-11-26 搬進站長後台 /admin/reports，TODO G8）。子頁面沒有 data-hydrated，直接 goto；這頁是純 server component。

test("/admin/reports：日報預設今天，可以切週報、月報、前一期", async ({ page }) => {
  await page.goto("/admin/reports");
  const nav = page.getByRole("navigation", { name: "報表期間" });
  await expect(nav.getByRole("link", { name: "日報" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: /真人訪客/ })).toBeVisible();
  await nav.getByRole("link", { name: "週報" }).click();
  await expect(page).toHaveURL(/p=week/);
  await expect(nav.getByText(/（一）– .*（日）/)).toBeVisible();
  await nav.getByRole("link", { name: "月報" }).click();
  await expect(nav.getByText(/\d{4} 年 \d+ 月/)).toBeVisible();
  await nav.getByRole("link", { name: /上個月/ }).click();
  await expect(nav.getByRole("link", { name: /下個月/ })).toBeVisible();
});

test("舊的公開 /reports 回 404；後台版不在 sitemap", async ({ page, request }) => {
  const res = await page.goto("/reports");
  expect(res?.status()).toBe(404);
  expect((await request.get("/reports?p=week")).status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/reports");
  expect(sitemap).not.toContain("/admin");
});

test("/api/reports：本機拿得到純文字版；經過 Cloudflare 的請求 404", async ({ request }) => {
  const res = await request.get("/api/reports?period=week&format=text");
  expect(res.status()).toBe(200);
  expect(await res.text()).toMatch(/^kbs0830\.com 週報：/);
  const viaCf = await request.get("/api/reports?period=week", { headers: { "cf-ipcountry": "TW" } });
  expect(viaCf.status()).toBe(404);
});
