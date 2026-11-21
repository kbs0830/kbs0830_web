import { expect, test } from "@playwright/test";

// 部落格升級（TODO A6，2026-11-21）：全文搜尋、程式碼複製、對應 commit、RSS 全文
// 不用 gotoReady：它等的 data-hydrated 是首頁的 KeyboardShortcuts 加的，文章頁沒有。
// 搜尋框是掛上之後才拿掉 hidden，所以「看得到搜尋框」本身就代表 hydration 完成
test("全文搜尋：中文關鍵字找得到、有片段", async ({ page }) => {
  await page.goto("/blog");
  const box = page.getByRole("searchbox", { name: "搜尋文章" });
  await expect(box).toBeVisible();
  await box.fill("工作排程器");
  const results = page.locator("ul li a[href='/blog/task-scheduler-72-hours']").first();
  await expect(results).toBeVisible();
  await expect(results.locator("mark")).toHaveText("工作排程器");
});

test("程式碼區塊有複製按鈕、文章最後有對應的 commit", async ({ page }) => {
  await page.goto("/blog/task-scheduler-72-hours");
  await expect(page.getByRole("button", { name: "複製程式碼" }).first()).toBeAttached();
  await expect(page.getByRole("link", { name: "8eb23d8" })).toHaveAttribute("href", /github\.com\/kbs0830\/kbs0830_web\/commit\/8eb23d8/);
});

test("RSS 有全文", async ({ request }) => {
  const xml = await (await request.get("/feed.xml")).text();
  expect(xml).toContain("<content:encoded><![CDATA[");
  expect(xml).toContain("<pre><code");
});
