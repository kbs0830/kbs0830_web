import { test, expect } from "@playwright/test";

const KONAMI_CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

test("輸入正確的 Konami Code 觸發「ようこそ」彩蛋，並在時間到後自動消失", async ({ page }) => {
  await page.goto("/");

  for (const key of KONAMI_CODE) {
    await page.keyboard.press(key);
  }

  await expect(page.getByText("ようこそ")).toBeVisible();
  await expect(page.getByText("ようこそ")).not.toBeVisible({ timeout: 4000 });
});

test("按錯鍵序列不會誤觸發彩蛋", async ({ page }) => {
  await page.goto("/");

  for (const key of ["ArrowUp", "ArrowDown", "ArrowUp", "ArrowLeft", "b", "a"]) {
    await page.keyboard.press(key);
  }

  await expect(page.getByText("ようこそ")).not.toBeVisible();
});
