import { expect, type Page } from "@playwright/test";

// 前往頁面並等 React hydration 完成（KeyboardShortcuts 掛好監聽後會在 <html> 加
// data-hydrated）。goto 的 load 事件不代表 hydration 完成，太早按鍵/點擊會直接被丟掉——
// 開 Playwright trace 時頁面變慢，這個時間差就會穩定重現。
export async function gotoReady(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "");
}
