import { expect, test } from "@playwright/test";

// 分享預覽（LINE／Discord／X 貼網址時出現的卡片）。只看 HTML，不用開瀏覽器，所以用 request 不用 gotoReady。
// 2026-11-09 之前子頁面全部繼承首頁的 og:title「PINGWEI LI — Portfolio」，分享哪一頁看起來都一樣。
const meta = (html: string, prop: string) =>
  html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`))?.[1];

for (const path of ["/blog/task-scheduler-72-hours", "/projects/foodlens-advisor", "/now", "/flights", "/hotels", "/stats", "/blog"]) {
  test(`分享卡片跟著頁面走：${path}`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const ogTitle = meta(html, "og:title");
    expect(ogTitle).toBeTruthy();
    expect(ogTitle).not.toBe("PINGWEI LI — Portfolio");
    // 文章頁的 og:title 是純文章標題，其他頁跟 <title> 一樣
    expect(title).toContain(ogTitle!.replace(/&amp;/g, "&"));
    expect(meta(html, "og:url")).toContain(path);
    expect(meta(html, "og:image")).toBeTruthy();
    expect(meta(html, "twitter:title")).toBe(ogTitle);
  });
}

test("文章有自己的分享圖，而且是 PNG", async ({ request }) => {
  const html = await (await request.get("/blog/task-scheduler-72-hours")).text();
  const img = meta(html, "og:image")!;
  expect(img).toContain("/blog/task-scheduler-72-hours/opengraph-image");
  const res = await request.get(new URL(img).pathname + new URL(img).search);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("作品也有自己的分享圖，而且是 PNG", async ({ request }) => {
  const html = await (await request.get("/projects/foodlens-advisor")).text();
  const img = meta(html, "og:image")!;
  expect(img).toContain("/projects/foodlens-advisor/opengraph-image");
  expect(meta(html, "twitter:image")).toContain("/projects/foodlens-advisor/opengraph-image");
  const res = await request.get(new URL(img).pathname + new URL(img).search);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("RSS：每篇文章都在，作者欄位沒有本名", async ({ request }) => {
  const res = await request.get("/feed.xml");
  expect(res.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await res.text();
  expect(xml).toContain("<rss version=\"2.0\"");
  expect(xml).toContain("https://kbs0830.com/blog/task-scheduler-72-hours");
  expect(xml).not.toContain("李秉威");
});
