import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers";

const KONAMI_CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

test("輸入正確的 Konami Code 觸發「ようこそ」彩蛋，並在時間到後自動消失", async ({ page }) => {
  await gotoReady(page, "/");

  for (const key of KONAMI_CODE) {
    await page.keyboard.press(key);
  }

  await expect(page.getByText("ようこそ")).toBeVisible();
  // 元件是 3.2s 後關閉 + 0.5s 退場動畫 = 3.7s；原本給 4s 只剩 0.3s 緩衝，dev server
  // 忙的時候會隨機超時，放寬到 6s
  await expect(page.getByText("ようこそ")).not.toBeVisible({ timeout: 6000 });
});

test("按錯鍵序列不會誤觸發彩蛋", async ({ page }) => {
  await gotoReady(page, "/");

  for (const key of ["ArrowUp", "ArrowDown", "ArrowUp", "ArrowLeft", "b", "a"]) {
    await page.keyboard.press(key);
  }

  await expect(page.getByText("ようこそ")).not.toBeVisible();
});
