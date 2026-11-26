import { test, expect } from "@playwright/test";

// 站長後台（TODO A1）的門禁：本機放行、經過 Cloudflare（帶 cf-connecting-ip）一律 404，而且不能進 sitemap
const PATHS = ["/admin", "/admin/reports", "/admin/traffic", "/admin/ops", "/admin/mail", "/admin/todo", "/api/admin/me", "/api/admin/decisions"];

test("站長後台：外部請求 404、本機 200、不進 sitemap", async ({ request }) => {
  for (const p of PATHS) {
    expect((await request.get(p, { headers: { "cf-connecting-ip": "203.0.113.9" } })).status(), p).toBe(404);
    expect((await request.get(p, { headers: { "cf-ipcountry": "JP" } })).status(), p).toBe(404);
    const local = await request.get(p);
    expect(local.status(), p).toBe(200);
    expect(local.headers()["x-robots-tag"]).toContain("noindex");
  }
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/admin");
});

// 決策表的寫入 API：只驗「擋得住」（真的寫入在單元測試 todo-db.test.ts；E2E 不寫，免得蓋掉站長的選擇）
test("決策表 POST：外部 404、沒帶 Origin 403、格式錯 400、不存在的項目 404", async ({ request }) => {
  const url = "/api/admin/decisions";
  const ok = { itemId: "__e2e_not_exist__", choice: "now", note: "" };
  expect((await request.post(url, { data: ok, headers: { "cf-connecting-ip": "203.0.113.9", origin: "https://kbs0830.com" } })).status()).toBe(404);
  expect((await request.post(url, { data: ok, headers: { origin: "https://evil.example" } })).status()).toBe(403);
  const local = { origin: "http://localhost:3100" };
  expect((await request.post(url, { data: { ...ok, choice: "maybe" }, headers: local })).status()).toBe(400);
  expect((await request.post(url, { data: ok, headers: local })).status()).toBe(404);
});

// 訪客參觀（TODO G4）：公開、不用登入，資料是範例；決策表按了不打 API
test("訪客參觀 /demo/admin：外部也是 200、有範例提示、不進 sitemap", async ({ request }) => {
  for (const p of ["/demo/admin", "/demo/admin/ops", "/demo/admin/mail", "/demo/admin/traffic", "/demo/admin/todo", "/demo/admin/reports"]) {
    const res = await request.get(p, { headers: { "cf-connecting-ip": "203.0.113.9" } });
    expect(res.status(), p).toBe(200);
    expect(await res.text(), p).toContain("範例資料");
  }
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/demo/admin");
});

test("訪客參觀的決策表：按了有變、但不送出", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => { if (r.method() === "POST" && r.url().includes("/api/admin")) posts.push(r.url()); });
  await page.goto("/demo/admin/todo"); // gotoReady 的 data-hydrated 只有首頁有（KeyboardShortcuts）
  await page.waitForLoadState("networkidle");
  const group = page.getByRole("group", { name: /作品頁加「技術選擇的理由」/ });
  await group.getByRole("button", { name: "先做" }).click();
  await expect(group.getByRole("button", { name: "先做" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toContainText("示範，不會存");
  expect(posts).toEqual([]);
});

// 登入入口（TODO G5）＋維持登入 API 的門禁（G6）
test("/login 分成站長登入跟訪客參觀，首頁有登入按鈕", async ({ page, request }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "登入後台 →" })).toHaveAttribute("href", "/admin");
  await expect(page.getByRole("link", { name: "訪客參觀 →" })).toHaveAttribute("href", "/demo/admin");
  await expect(page.getByText("內網")).toBeVisible();
  const home = await (await request.get("/")).text();
  expect(home).toContain('href="/login"');
});

test("/api/admin/session：外部 404、沒帶 Origin 的 POST 403", async ({ request }) => {
  expect((await request.get("/api/admin/session", { headers: { "cf-connecting-ip": "203.0.113.9" } })).status()).toBe(404);
  expect((await request.post("/api/admin/session", { data: { keep: true }, headers: { origin: "https://evil.example" } })).status()).toBe(403);
});
