import { test, expect, type Page } from "@playwright/test";
import { gotoReady } from "./helpers";

// 全站快速跳轉（QuickJump，2026-11-23）＋子頁面的頁尾頁面索引（SiteFooter）
const dialog = (page: Page) => page.locator("dialog.quick-jump");
const input = (page: Page) => page.getByRole("textbox", { name: "搜尋頁面、作品、文章" });

test("首頁按 Ctrl+K 打開，搜尋文章、Enter 跳過去，跳完自動關閉", async ({ page }) => {
  await gotoReady(page, "/");
  await page.keyboard.press("Control+k");
  await expect(input(page)).toBeFocused();

  await page.keyboard.type("72 小時");
  const hit = dialog(page).getByRole("link", { name: /72 小時/ });
  await expect(hit).toBeVisible(); // 作品、文章清單是打開時才下載的
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/blog\/task-scheduler-72-hours$/);
  await expect(dialog(page)).not.toBeVisible();
});

test("子頁面右上角「搜尋」也能打開；↑↓ 換選項；跳到首頁區塊", async ({ page }) => {
  await page.goto("/now");
  // 子頁面沒有 data-hydrated 標記：按到 hydration 完成、彈窗真的打開為止
  await expect(async () => {
    await page.getByRole("button", { name: /搜尋/ }).click();
    await expect(dialog(page)).toBeVisible({ timeout: 1000 });
  }).toPass();

  await input(page).fill("連絡先");
  await expect(dialog(page).getByRole("link")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("Esc 關閉；終端機開著時 Ctrl+K 不會疊上去", async ({ page }) => {
  await gotoReady(page, "/");
  await page.keyboard.press("Control+k");
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).not.toBeVisible();

  await page.keyboard.press("`");
  await expect(page.locator('input[aria-label="終端機指令輸入"]')).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(dialog(page)).not.toBeVisible();
});

test("子頁面有頁尾頁面索引，連得到原本沒有站內入口的頁", async ({ page }) => {
  await page.goto("/flights");
  const footerNav = page.getByRole("navigation", { name: "網站頁面" });
  for (const name of ["近況", "開発環境", "旅行地球", "本站構造", "更新紀錄"]) {
    await expect(footerNav.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await footerNav.getByRole("link", { name: /^開発環境/ }).click();
  await expect(page).toHaveURL(/\/uses$/);
});
