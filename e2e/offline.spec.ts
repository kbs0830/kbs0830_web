import { test, expect } from "@playwright/test";

// 文章離線閱讀（TODO B10，2026-11-27）：Service Worker（public/sw.js）只在正式 build 註冊，CI 跑的是 `next dev`，所以沒註冊就跳過；
// 驗證時對正式 build 跑（3200／本機專屬 port）。流程：讀一次文章 → SW 接管後再讀一次（這次才會被存起來）→ 斷網 → 同一篇還開得起來；沒讀過的頁顯示離線頁。
test("讀過的文章斷網還打得開；沒讀過的頁顯示離線頁", async ({ page, context }) => {
  await page.goto("/blog/task-scheduler-72-hours");
  const registered = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    // 註冊在頁面閒下來之後，最多等 8 秒
    for (let i = 0; i < 40; i++) {
      if (await navigator.serviceWorker.getRegistration()) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  });
  test.skip(!registered, "Service Worker 只在正式 build 註冊（dev 模式沒有）");

  await page.evaluate(() => navigator.serviceWorker.ready);
  // 讓 SW 接管這個分頁，再讀一次：這次的請求才會經過 SW、被存起來
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.goto("/blog/task-scheduler-72-hours");
  const title = await page.title();
  expect(title.length).toBeGreaterThan(5);

  await context.setOffline(true);
  await page.goto("/blog/task-scheduler-72-hours");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.title()).toBe(title);

  // 沒讀過的文章 → 離線頁
  await page.goto("/blog/css-scroll-driven-navbar-back-to-top").catch(() => {});
  await expect(page.getByRole("heading", { name: /離線中/ })).toBeVisible();
  await context.setOffline(false);
});

test("sw.js 要求每次回源，離線頁存在", async ({ request }) => {
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  expect((await request.get("/offline.html")).status()).toBe(200);
});
