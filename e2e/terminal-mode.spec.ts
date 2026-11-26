import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers";

// 輸出用 data-testid 定位（不是 getByText），因為 "PINGWEI LI"／"日本語 N5" 這類字串
// 在首頁 Hero／About section 本來就有一份，直接 getByText 會撞到頁面上其他既有內容，
// 造成 Playwright strict-mode 多重匹配報錯。

test("按 ` 呼出終端機，help/ls/cat 指令有對應輸出，Escape 關閉", async ({ page }) => {
  await gotoReady(page, "/");

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
  await gotoReady(page, "/");

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

// TODO B2（2026-11-26）：neofetch／uptime／status 打 /api/terminal、blog、history、Tab 補完、↑ 叫回、open 換頁、hero 形狀
test("B2 新指令：neofetch、status、blog、history、Tab、↑、open", async ({ page }) => {
  await gotoReady(page, "/");
  await page.keyboard.press("`");
  const input = page.locator('input[aria-label="終端機指令輸入"]');
  const output = page.getByTestId("terminal-output");
  const run = async (cmd: string) => {
    await input.fill(cmd);
    await input.press("Enter");
  };

  await input.fill("neo");
  await input.press("Tab");
  await expect(input).toHaveValue("neofetch");
  await input.press("Enter");
  await expect(output).toContainText("i7-12700");
  await expect(output).toContainText(/Uptime: +\d/);

  await run("status");
  await expect(output).toContainText("近 30 天");

  await run("blog");
  await expect(output).toContainText("/blog/");

  await run("hero name");
  await expect(output).toContainText("hero webgpu"); // 測試環境是線條版，會提示要換 WebGPU 版

  await run("history");
  await expect(output).toContainText("neofetch");
  await expect(output).toContainText("hero name");

  await input.press("ArrowUp");
  await expect(input).toHaveValue("history");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("hero name");

  await run("open //evil.example");
  await expect(output).toContainText("只能打開站內頁面");

  await run("open /blog");
  await expect(page).toHaveURL(/\/blog$/);
});

test("/api/terminal 只回公開的數字", async ({ request }) => {
  const res = await request.get("/api/terminal");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Object.keys(body).sort()).toEqual(["deploys90", "lastDeploy", "memoryMB", "node", "radar", "rollbacks90", "uptime30", "uptimeSec"]);
});
