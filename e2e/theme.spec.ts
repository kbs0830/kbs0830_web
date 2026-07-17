import { test, expect } from "@playwright/test";

test("暗色模式切換：切換 html[data-theme] 並寫入 localStorage", async ({ page }) => {
  await page.goto("/");

  const initialTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(["light", "dark"]).toContain(initialTheme);

  const toggle = page.locator('header button[aria-label*="切換"]').first();
  await toggle.click();

  const nextTheme = initialTheme === "dark" ? "light" : "dark";
  await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);

  const stored = await page.evaluate(() => localStorage.getItem("theme"));
  expect(stored).toBe(nextTheme);

  // 重新整理後應該記住剛剛切換的主題，不會被 matchMedia 的預設值蓋掉
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", nextTheme);
});
