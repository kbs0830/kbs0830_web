import { test, expect } from "@playwright/test";

test("點 Email 按鈕會複製到剪貼簿並顯示「已複製！」toast", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#contact");

  const emailButton = page.locator("button", { hasText: "1394kbs@gmail.com" });
  await emailButton.scrollIntoViewIfNeeded();
  await emailButton.click();

  await expect(page.getByText("已複製！")).toBeVisible();

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe("1394kbs@gmail.com");

  // toast 1.8 秒後應該自動消失
  await expect(page.getByText("已複製！")).not.toBeVisible({ timeout: 3000 });
});
