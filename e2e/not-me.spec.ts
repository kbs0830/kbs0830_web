import { test, expect } from "@playwright/test";

// /stats 的「這個瀏覽器不計入」開關（lib/client/not-me.ts，2026-11-23）。
// 攔截 /api/visitor-stats：只看瀏覽器送了什麼，不讓請求打到伺服器（3200 測試時 server.js 寫的是正式 data/）
test("打開「不計入」後，換頁的回報只帶 notMe；關掉又恢復正常回報", async ({ page }) => {
  const bodies: string[] = [];
  await page.route("**/api/visitor-stats", async (route) => {
    if (route.request().method() === "POST") bodies.push(route.request().postData() ?? "");
    await route.fulfill({ json: { total: 0, countryCount: 0, top: [], raw: null, cloudflare: null, newFeature: null } });
  });

  await page.goto("/stats");
  const toggle = page.getByRole("switch", { name: "這個瀏覽器不計入統計" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");

  await page.goto("/flights");
  await expect.poll(() => bodies.at(-1)).toBe(JSON.stringify({ notMe: true }));

  await page.goto("/stats");
  await expect(toggle).toHaveAttribute("aria-checked", "true"); // 記在 localStorage，重新整理還在
  await toggle.click();
  await page.goto("/now");
  await expect.poll(() => JSON.parse(bodies.at(-1) ?? "{}").path).toBe("/now");
});
