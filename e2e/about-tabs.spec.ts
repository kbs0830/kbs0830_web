import { expect, test } from "@playwright/test";
import { gotoReady } from "./helpers";

// About 的分頁（2026-11-05：歷程／技能／活動／足跡原本一路往下排，改成分頁讓首頁短一點）
test("About 分頁：預設顯示歷程，點擊／方向鍵可以切換，收起來的內容仍在 HTML 裡", async ({ page }) => {
  await gotoReady(page, "/");
  const tabs = page.locator("#about [role=tab]");
  await expect(tabs).toHaveCount(4);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

  // 沒選中的面板內容還是在 HTML 裡（搜尋引擎讀得到、Ctrl+F 找得到），只是先藏起來
  const skillsPanel = page.locator("#about [role=tabpanel]").nth(1);
  await expect(skillsPanel).toBeHidden();
  await expect(skillsPanel).toContainText("FastAPI");

  await page.getByRole("tab", { name: /Skills/ }).click();
  await expect(skillsPanel).toBeVisible();
  await expect(page.getByRole("tab", { name: /Skills/ })).toHaveAttribute("aria-selected", "true");

  // ARIA tabs：→ 換到下一頁，焦點跟著移過去
  await page.keyboard.press("ArrowRight");
  const activity = page.getByRole("tab", { name: /Activity/ });
  await expect(activity).toHaveAttribute("aria-selected", "true");
  await expect(activity).toBeFocused();
  await expect(skillsPanel).toBeHidden();
});

// 桌機特效層（DesktopFX）：Playwright 的 Desktop Chrome 有滑鼠、寬螢幕，會啟用
test("桌機特效：游標光圈在作品卡片上顯示「見る」", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-fx", "");
  const card = page.locator("#portfolio [data-fx-card]").first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect(page.locator(".fx-cursor")).toHaveAttribute("data-state", "label");
  await expect(page.locator(".fx-cursor-label")).toHaveText("見る");
});

test("prefers-reduced-motion 時完全不啟用桌機特效", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await gotoReady(page, "/");
  await expect(page.locator(".fx-cursor")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-fx", "");
  await context.close();
});
