import { test, expect } from "@playwright/test";

// 站長後台（TODO A1）的門禁：本機放行、經過 Cloudflare（帶 cf-connecting-ip）一律 404，而且不能進 sitemap
const PATHS = ["/admin", "/admin/reports", "/admin/traffic", "/admin/ops", "/admin/mail", "/api/admin/me"];

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
