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
