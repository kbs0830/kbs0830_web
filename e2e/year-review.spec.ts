import { expect, test } from "@playwright/test";

// 年度回顧 /2026（TODO B18，2026-11-28）：數字都是網站自己讀的，這裡只確認頁面打得開、有各區塊、沒有把不該公開的東西放出來。
test("/2026 年度回顧：有數字區塊，不含本名", async ({ page }) => {
  await page.goto("/2026");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("2026");
  await expect(page.getByText("次部署")).toBeVisible();
  await expect(page.getByText("出過的事")).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text).not.toContain("李秉威");
});
