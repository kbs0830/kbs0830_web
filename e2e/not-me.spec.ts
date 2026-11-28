import { test, expect } from "@playwright/test";

// 「這個瀏覽器不計入」（lib/client/not-me.ts）：2026-11-28 起打開後台就自動開啟（AutoNotMe），開關搬到 /admin/traffic。
// 攔截 /api/visitor-stats：只看瀏覽器送了什麼，不讓請求打到伺服器（3200 測試時 server.js 寫的是正式 data/）
test("打開後台就自動不計入：換頁的回報只帶 notMe；手動關掉又恢復正常回報", async ({ page }) => {
  const bodies: string[] = [];
  await page.route("**/api/visitor-stats", async (route) => {
    if (route.request().method() === "POST") bodies.push(route.request().postData() ?? "");
    await route.fulfill({ json: { total: 0, countryCount: 0, top: [], raw: null, cloudflare: null, newFeature: null } });
  });

  await page.goto("/admin/traffic");
  const toggle = page.getByRole("switch", { name: "這個瀏覽器不計入統計" });
  await expect(toggle).toHaveAttribute("aria-checked", "true"); // 沒按過，進後台就自動開了

  await page.goto("/flights");
  await expect.poll(() => bodies.at(-1)).toBe(JSON.stringify({ notMe: true }));

  await page.goto("/admin/traffic");
  await expect(toggle).toHaveAttribute("aria-checked", "true"); // 記在 localStorage，重新整理還在
  await toggle.click(); // 手動關掉
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await page.goto("/admin/traffic");
  await expect(toggle).toHaveAttribute("aria-checked", "false"); // 同一個分頁不會又被自動打開
  await page.goto("/now");
  await expect.poll(() => JSON.parse(bodies.at(-1) ?? "{}").path).toBe("/now");
});

test("公開的 /stats 不再有開關（搬進後台了）", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByRole("switch", { name: "這個瀏覽器不計入統計" })).toHaveCount(0);
});
