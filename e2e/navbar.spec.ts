import { test, expect } from "@playwright/test";

test("NavBar 從透明變成半透明背景（捲動超過 60px 後）", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");

  // 等 hydration 真的完成再開始滾動，避免 Next dev server 第一次編譯路由時的冷啟動
  // 延遲，讓事件在 framer-motion 的 scroll listener 掛上之前就發出去（在完整套件平行
  // 跑的時候實測會偶發失敗，單獨跑不會，時機問題不是邏輯錯誤）。
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  await page.evaluate(() => window.scrollTo(0, 400));
  await expect(header).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("NavBar 桌機版連結可以錨點跳轉到對應 section", async ({ page }) => {
  await page.goto("/");
  // 手機版抽屜選單的連結永遠在 DOM 裡（只是 height:0 收合），桌機視窗下用 .first()
  // 精準抓桌機版那份（JSX 順序上桌機 <ul> 排在抽屜前面）。
  await page.locator("header a", { hasText: "連絡先" }).first().click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});
