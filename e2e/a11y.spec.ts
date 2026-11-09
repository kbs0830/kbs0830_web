import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// 無障礙自動檢查（axe-core，2026-11-09）：WCAG 2.x A／AA 規則，只擋 serious／critical
// （對比度不足、圖片沒 alt、表單沒 label、按鈕沒名字…）。minor／moderate 印出來看就好，不擋。
// 2026-07 的 Lighthouse 對比度問題（部落格有一篇）就是這類，之前靠手動跑才發現。
//
// 開「減少動態效果」：捲動淡入、進場動畫一開始是 opacity 0，axe 會把還沒淡入的字當成對比不足。
const PAGES = ["/", "/blog", "/blog/task-scheduler-72-hours", "/projects/foodlens-advisor", "/resume", "/stats", "/flights", "/hotels"];

for (const path of PAGES) {
  for (const theme of ["light", "dark"] as const) {
    test(`a11y ${theme}：${path}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.waitForLoadState("networkidle");

      const scan = async (label: string) => {
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          // 3D 背景是裝飾用的 canvas，GitHub 熱力圖是第三方 SVG（顏色不是我們決定的）
          .exclude("canvas")
          .exclude('img[src*="ghchart.rshah.org"]')
          .analyze();
        return result.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${label} ${v.id}（${v.impact}）× ${v.nodes.length}：${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      };

      const problems = await scan(path);
      // 首頁 About 的分頁：沒選到的面板是 hidden，axe 不會檢查，要一個一個切過去
      if (path === "/") {
        const tabs = page.getByRole("tab");
        for (let i = 1; i < (await tabs.count()); i++) {
          await tabs.nth(i).click();
          problems.push(...(await scan(`/ 分頁 ${i + 1}`)));
        }
      }
      expect(problems).toEqual([]);
    });
  }
}
