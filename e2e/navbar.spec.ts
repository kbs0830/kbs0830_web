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
    await expect(page.locator("header").getByRole("link", { name: /^記事/ }).first()).toBeVisible();
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

test.describe("手機版：重點顯示、其他收進右上角選單（2026-11-24）", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("作品卡片是精簡版；個人專案只露出精選 2 個、課程專題先顯示 2 個，按了才展開", async ({ page }) => {
    await gotoReady(page, "/");
    const visible = page.locator("#portfolio a[aria-label^='查看']:visible");
    expect((await visible.first().locator("..").boundingBox())!.height).toBeLessThan(220);
    // 2026-11-25：手機上個人專案先露出「個人網站」跟「FR24 雷達站」兩個精選，排在最前面
    await expect(visible.nth(0)).toHaveAttribute("aria-label", /個人網站|FR24/);
    await expect(visible.nth(1)).toHaveAttribute("aria-label", /個人網站|FR24/);

    const before = await visible.count();
    const more = page.getByRole("button", { name: /顯示全部 \d+ 個/ });
    await expect(more).toHaveCount(2);
    await more.first().click();
    await expect(more).toHaveCount(1);
    expect(await visible.count()).toBeGreaterThan(before);
  });

  test("手機頁尾不列頁面；首頁選單裡有全站目錄", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.getByRole("navigation", { name: "網站頁面" })).toBeHidden();
    await page.getByRole("button", { name: "選單" }).click();
    await expect(page.locator("header").getByRole("link", { name: "機場時刻表" })).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "小工具" })).toBeVisible();
  });

  test("子頁面右上角也有選單，點連結會換頁", async ({ page }) => {
    // 子頁面沒有 data-hydrated：點到選單真的打開為止
    await page.goto("/blog");
    const menu = page.getByRole("button", { name: "選單" });
    await expect(async () => {
      if ((await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true", { timeout: 500 });
    }).toPass();
    await page.getByRole("link", { name: "飛行紀錄" }).click();
    await expect(page).toHaveURL(/\/flights$/);
  });
});

test.describe("手機版不能比螢幕寬（2026-11-24：360px 實測被撐到 401px，選單按鈕被擠出畫面）", () => {
  test.use({ viewport: { width: 360, height: 640 } });
  for (const path of ["/", "/blog/task-scheduler-72-hours", "/projects/foodlens-advisor", "/tools/ai-crawlers", "/flights", "/reports?p=week"]) {
    test(`${path} 沒有左右捲動`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    });
  }
});
