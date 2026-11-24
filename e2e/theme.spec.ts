import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers";

test("暗色模式切換：切換 html[data-theme] 並寫入 localStorage", async ({ page }) => {
  await gotoReady(page, "/");

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

test("子頁面（PageShell）右上也能切換主題（TODO F1）", async ({ page }) => {
  // 子頁面沒有 data-hydrated 標記（只有首頁的 KeyboardShortcuts 會加），不能用 gotoReady：
  // 點到 hydration 完成、主題真的換掉為止
  await page.goto("/blog");
  const initialTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const expected = initialTheme === "dark" ? "light" : "dark";
  await expect(async () => {
    if ((await page.locator("html").getAttribute("data-theme")) !== expected) {
      await page.getByRole("button", { name: "切換亮色／暗色模式" }).click();
    }
    await expect(page.locator("html")).toHaveAttribute("data-theme", expected, { timeout: 500 });
  }).toPass();
});
