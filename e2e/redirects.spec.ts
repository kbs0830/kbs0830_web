import { test, expect } from "@playwright/test";

// 隱藏作品的舊網址轉到有提到它的頁面、不拿 404（TODO R1，2026-11-27）；規則在 next.config.ts，從 projects.ts 的 hidden＋hiddenRedirect 產生
test("隱藏的作品（frc-robot）舊網址 308 轉到有提到它的頁面", async ({ request }) => {
  const res = await request.get("/projects/frc-robot", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toBe("/projects/auto-following-robot");
});

test("/site.webmanifest 轉到 /manifest.webmanifest；隱藏的作品不在 sitemap", async ({ request }) => {
  const res = await request.get("/site.webmanifest", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers().location).toBe("/manifest.webmanifest");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("frc-robot");
});

test("真的不存在的作品網址還是 404", async ({ request }) => {
  expect((await request.get("/projects/no-such-project")).status()).toBe(404);
});
