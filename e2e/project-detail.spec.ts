import { test, expect } from "@playwright/test";

// 作品卡片 → 詳細頁走的是 <ViewTransition> 換頁（見 projects/[slug]/template.tsx）。
// 動畫本身不好測，這裡確認的是「換頁後內容真的可見」——舊版 framer 的 opacity:0
// 起始狀態如果殘留、或 view transition 卡住，標題會停在看不見的狀態。
test("點作品卡片進詳細頁，標題可見且可以返回", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("link", { name: /查看「食物辨識助手」/ });
  await card.scrollIntoViewIfNeeded();
  await card.click();

  // dev server 第一次編譯這個路由（加上 React Compiler）可能超過預設 5 秒
  await expect(page).toHaveURL(/\/projects\/foodlens-advisor$/, { timeout: 20_000 });
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveCSS("opacity", "1");

  await page.goBack();
  await expect(page).toHaveURL(/\/$|\/#/);
});
