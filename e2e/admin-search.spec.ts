import { test, expect } from "@playwright/test";

// 後台全文搜尋（TODO S4，2026-11-27）。測試跑在桌機本機＝免登入的站長身分；資料庫內容每天在變，所以不比對具體結果，
// 只確認：頁面、搜尋框都在；找不到的詞顯示「找不到」；每個後台頁頂端都有搜尋框，送出會到 /admin/search。
test("/admin/search：有搜尋框；找不到的詞顯示找不到", async ({ page }) => {
  await page.goto("/admin/search?q=zzzzqqqq不存在的字串");
  await expect(page.getByRole("heading", { name: "搜尋" })).toBeVisible();
  await expect(page.getByRole("search").first()).toBeVisible();
  await expect(page.getByText(/找不到「zzzzqqqq/)).toBeVisible();
});

test("後台任一頁頂端的搜尋框送出後到 /admin/search?q=", async ({ page }) => {
  await page.goto("/admin/todo");
  const box = page.getByRole("searchbox", { name: /搜尋後台/ });
  await box.fill("測試字串abc");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/admin\/search\?q=/);
  await expect(page.getByText(/找不到「測試字串abc」/)).toBeVisible();
});

test("特殊符號不會讓搜尋壞掉", async ({ page }) => {
  const res = await page.goto("/admin/search?q=" + encodeURIComponent('"foo" OR * -bar:'));
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "搜尋" })).toBeVisible();
});
