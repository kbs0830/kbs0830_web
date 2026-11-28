import { test, expect } from "@playwright/test";

// 記事最後「這篇有幫到你嗎？」（TODO B20，2026-11-28）。本機測試沒有 cf-ipcountry，API 回 204 但不計數（不會污染正式資料），
// 所以這裡只測畫面流程；計數、擋機器人、擋亂填的邏輯在 src/app/api/feedback/route.test.ts。
test("按「有」→ 謝謝；重新整理後不再問", async ({ page }) => {
  await page.goto("/blog/tailwind-v4-bracket-var");
  const box = page.locator("[data-feedback]");
  await expect(box.getByText("這篇有幫到你嗎？")).toBeVisible();
  await box.getByRole("button", { name: "有", exact: true }).click();
  await expect(box.getByText("謝謝你的回饋。")).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-feedback]")).toHaveCount(0);
});

test("按「沒有」→ 選原因 → 謝謝；其他文章還是會問", async ({ page }) => {
  await page.goto("/blog/tailwind-v4-bracket-var");
  const box = page.locator("[data-feedback]");
  await box.getByRole("button", { name: "沒有", exact: true }).click();
  await expect(box.getByRole("button", { name: "看不懂" })).toBeVisible();
  await expect(box.getByRole("button", { name: "沒解決我的問題" })).toBeVisible();
  await expect(box.getByRole("button", { name: "內容過時了" })).toBeVisible();
  await box.getByRole("button", { name: "看不懂" }).click();
  await expect(box.getByText("謝謝你的回饋。")).toBeVisible();
  await page.goto("/blog/task-scheduler-72-hours");
  await expect(page.locator("[data-feedback]").getByText("這篇有幫到你嗎？")).toBeVisible();
});

test("「沒有」也可以不選原因直接送出", async ({ page }) => {
  await page.goto("/blog/tunnel-down-four-days");
  const box = page.locator("[data-feedback]");
  await box.getByRole("button", { name: "沒有", exact: true }).click();
  await box.getByRole("button", { name: "直接送出" }).click();
  await expect(box.getByText("謝謝你的回饋。")).toBeVisible();
});
