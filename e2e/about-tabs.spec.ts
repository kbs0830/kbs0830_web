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

// Hero 名字的滑鼠解碼效果（HeroNameScramble）：Playwright 的 Desktop Chrome 有滑鼠、寬螢幕，會啟用
test("Hero 名字：滑鼠移上去先變亂碼，最後解回 PINGWEI LI", async ({ page }) => {
  await gotoReady(page, "/");
  const name = page.locator("h1");
  await name.hover();
  await expect(name).not.toHaveText("PINGWEI LI", { timeout: 500 });
  await expect(name).toHaveText("PINGWEI LI");
});

test("prefers-reduced-motion 時名字不解碼", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await gotoReady(page, "/");
  const name = page.locator("h1");
  await name.hover();
  await page.waitForTimeout(150);
  await expect(name).toHaveText("PINGWEI LI");
  await context.close();
});
