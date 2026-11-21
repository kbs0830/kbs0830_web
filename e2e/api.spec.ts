import { expect, test } from "@playwright/test";

// 公開 API（/api/v1）跟 MCP（/mcp）：真的打 server，確認狀態碼、CORS、JSON 格式（2026-11-21，TODO A9／A10）
test("API：入口、清單、單筆、不存在的 slug 404、CORS", async ({ request }) => {
  const index = await request.get("/api/v1");
  expect(index.status()).toBe(200);
  expect(index.headers()["access-control-allow-origin"]).toBe("*");
  const { endpoints } = await index.json();
  expect(endpoints.projects).toContain("/api/v1/projects");

  const list = await (await request.get("/api/v1/projects")).json();
  expect(list.projects.length).toBeGreaterThan(5);
  const one = await request.get(`/api/v1/projects/${list.projects[0].slug}`);
  expect(one.status()).toBe(200);
  expect((await one.json()).sections).toBeDefined();
  expect((await request.get("/api/v1/projects/does-not-exist")).status()).toBe(404);

  const posts = await (await request.get("/api/v1/posts")).json();
  const post = await (await request.get(`/api/v1/posts/${posts.posts[0].slug}`)).json();
  expect(post.content.length).toBeGreaterThan(100);

  const spec = await (await request.get("/api/v1/openapi.json")).json();
  expect(spec.openapi).toBe("3.1.0");
  for (const p of ["/profile", "/now", "/flights"]) expect((await request.get(`/api/v1${p}`)).status()).toBe(200);
});

test("MCP：initialize → tools/list → tools/call", async ({ request }) => {
  const rpc = (body: object) => request.post("/mcp", { data: body, headers: { Accept: "application/json, text/event-stream" } });
  const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1" } } });
  expect(init.status()).toBe(200);
  expect((await init.json()).result.protocolVersion).toBe("2025-06-18");
  expect((await rpc({ jsonrpc: "2.0", method: "notifications/initialized" })).status()).toBe(202);
  const tools = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json();
  expect(tools.result.tools.some((t: { name: string }) => t.name === "search")).toBe(true);
  const hit = await (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search", arguments: { query: "Cloudflare" } } })).json();
  expect(hit.result.structuredContent.posts.length + hit.result.structuredContent.projects.length).toBeGreaterThan(0);
  expect((await request.get("/mcp")).status()).toBe(405);
});
