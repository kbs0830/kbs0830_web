import { test, expect } from "@playwright/test";

// 工具頁的結構化資料、文章 ↔ 工具互相連結（TODO V7、V8，2026-11-27）。子頁面沒有 data-hydrated，直接 goto；這些都是 server 產生的 HTML。

const ldTypes = async (page: import("@playwright/test").Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t)["@type"] as string);

test("工具頁有 WebApplication 跟 BreadcrumbList", async ({ page }) => {
  await page.goto("/tools/csp");
  const types = await ldTypes(page);
  expect(types).toContain("WebApplication");
  expect(types).toContain("BreadcrumbList");
});

test("工具頁最後列相關記事；文章頁最後列相關工具", async ({ page }) => {
  await page.goto("/tools/tailwind-v4-vars");
  await expect(page.getByText("相關記事 · Related posts")).toBeVisible();
  await page.getByRole("link", { name: /Tailwind v4/ }).last().click();
  await expect(page).toHaveURL(/\/blog\/tailwind-v4-bracket-var$/);
  await expect(page.getByText("相關工具 · Related tools")).toBeVisible();
  await expect(page.getByRole("link", { name: /Tailwind v4 變數檢查/ })).toBeVisible();
});

test("沒有對應的工具頁不顯示相關記事", async ({ page }) => {
  await page.goto("/tools/jpy");
  await expect(page.getByText("相關記事 · Related posts")).toHaveCount(0);
});
