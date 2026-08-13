import { test, expect } from "@playwright/test";

// 輸出用 data-testid 定位（不是 getByText），因為 "PINGWEI LI"／"日本語 N5" 這類字串
// 在首頁 Hero／About section 本來就有一份，直接 getByText 會撞到頁面上其他既有內容，
// 造成 Playwright strict-mode 多重匹配報錯。

test("按 ` 呼出終端機，help/ls/cat 指令有對應輸出，Escape 關閉", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("`");
  const input = page.locator('input[aria-label="終端機指令輸入"]');
  const output = page.getByTestId("terminal-output");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();

  await input.fill("help");
  await input.press("Enter");
  await expect(output).toContainText("查看可用指令");

  await input.fill("cat about.txt");
  await input.press("Enter");
  await expect(output).toContainText("PINGWEI LI");

  await input.fill("not-a-real-command");
  await input.press("Enter");
  await expect(output).toContainText("command not found: not-a-real-command");

  await page.keyboard.press("Escape");
  await expect(input).not.toBeVisible();
});

test("clear 指令清空輸出，exit 指令關閉終端機", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("`");
  const input = page.locator('input[aria-label="終端機指令輸入"]');
  const output = page.getByTestId("terminal-output");

  await input.fill("help");
  await input.press("Enter");
  await expect(output).toContainText("查看可用指令");

  await input.fill("clear");
  await input.press("Enter");
  await expect(output).not.toContainText("查看可用指令");

  await input.fill("exit");
  await input.press("Enter");
  await expect(input).not.toBeVisible();
});
