import { test, expect } from "@playwright/test";

test("按 ? 呼出快捷鍵提示浮窗，再按一次或按 Escape 關閉", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("?");
  await expect(page.getByText("Keyboard Shortcuts")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByText("Keyboard Shortcuts")).not.toBeVisible();
});

test("按 1/2/3 會捲動到對應 section", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("3");
  await expect(page.locator("#contact")).toBeInViewport();

  await page.keyboard.press("1");
  await expect(page.locator("#about")).toBeInViewport();
});

test("在輸入框內按 ? 不會觸發快捷鍵（isTyping 防呆）", async ({ page }) => {
  await page.goto("/");

  // 開啟終端機後輸入框會自動 focus，這時候按 ? 應該被 isTyping() 擋下，
  // 只會打進終端機輸入框，不會同時彈出 KeyboardShortcuts 的提示浮窗。
  await page.keyboard.press("`");
  await expect(page.locator('input[aria-label="終端機指令輸入"]')).toBeFocused();

  await page.keyboard.press("?");

  await expect(page.locator('input[aria-label="終端機指令輸入"]')).toHaveValue("?");
  await expect(page.getByText("Keyboard Shortcuts")).not.toBeVisible();
});
