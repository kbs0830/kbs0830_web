import { expect, test } from "@playwright/test";

// sitemap 裡每個網址都要 200（2026-11-09：中文 tag 頁 /blog/tags/隱私 在 build 跟單元測試都過了，上線後才發現 404）。
// 只打 HTML、不開瀏覽器。sitemap 寫的是正式網址，換成測試 server 的路徑再打。
test("sitemap 裡每個網址都是 200", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(paths.length).toBeGreaterThan(20);

  const bad: string[] = [];
  for (const p of paths) {
    const res = await request.get(p);
    if (res.status() !== 200) bad.push(`${res.status()} ${decodeURIComponent(p)}`);
  }
  expect(bad).toEqual([]);
});
