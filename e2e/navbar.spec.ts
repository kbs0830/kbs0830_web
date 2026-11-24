import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers";

test("NavBar 從透明變成半透明背景（捲動超過 60px 後）", async ({ page }) => {
  await gotoReady(page, "/");
  const header = page.locator("header");

  // gotoReady 已經等過 hydration，scroll 監聽一定掛好了
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  await page.evaluate(() => window.scrollTo(0, 400));
  await expect(header).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test("NavBar 桌機版連結可以錨點跳轉到對應 section", async ({ page }) => {
  await gotoReady(page, "/");
  // 手機版抽屜選單的連結永遠在 DOM 裡（只是 height:0 收合），桌機視窗下用 .first()
  // 精準抓桌機版那份（JSX 順序上桌機 <ul> 排在抽屜前面）。
  await page.locator("header a", { hasText: "連絡先" }).first().click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
});

test.describe("手機選單（TODO F4）", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("有常用頁面；Esc、點外面、捲動都會收起", async ({ page }) => {
    await gotoReady(page, "/");
    const menuButton = page.getByRole("button", { name: "選單" });

    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("header").getByRole("link", { name: /技術部落格/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toBeFocused();

    await menuButton.click();
    await page.mouse.click(200, 700);
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await menuButton.click();
    await page.evaluate(() => window.scrollBy(0, 300));
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});
