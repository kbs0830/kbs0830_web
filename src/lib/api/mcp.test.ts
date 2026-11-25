import { describe, expect, it } from "vitest";
import { SUPPORTED_VERSIONS, TOOLS, handleRpc } from "@/lib/api/mcp";
import { GET, OPTIONS, POST } from "@/app/mcp/route";

// id 傳 null＝通知（不帶 id）；不能用 undefined，會被預設值 1 蓋掉
const call = (method: string, params?: object, id: number | null = 1) =>
  handleRpc({ jsonrpc: "2.0", ...(id === null ? {} : { id }), method, params: params as Record<string, unknown> }) as {
    result?: Record<string, unknown> & { content?: { text: string }[]; isError?: boolean };
    error?: { code: number };
  } | null;

describe("MCP：協定", () => {
  it("initialize 回同一個版本（支援的話），不然給最新的", () => {
    expect(call("initialize", { protocolVersion: "2025-06-18" })?.result?.protocolVersion).toBe("2025-06-18");
    expect(call("initialize", { protocolVersion: "1999-01-01" })?.result?.protocolVersion).toBe(SUPPORTED_VERSIONS[0]);
    expect(call("initialize", {})?.result).toMatchObject({ capabilities: { tools: {} }, serverInfo: { name: "kbs0830" } });
  });

  it("通知不回應、不認識的方法回 -32601、格式錯回 -32600", () => {
    expect(call("notifications/initialized", undefined, null)).toBeNull();
    expect(call("resources/list")?.error?.code).toBe(-32601);
    expect((handleRpc({ id: 1, method: "ping" } as never) as { error: { code: number } }).error.code).toBe(-32600);
    expect(call("ping")?.result).toEqual({});
  });

  it("tools/list：每個工具都有 inputSchema、標成唯讀", () => {
    const tools = call("tools/list")?.result?.tools as { name: string; inputSchema: { type: string }; annotations: { readOnlyHint: boolean } }[];
    expect(tools.map((t) => t.name)).toEqual(TOOLS.map((t) => t.name));
    for (const t of tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.annotations.readOnlyHint).toBe(true);
    }
  });
});

describe("MCP：工具", () => {
  it("list_projects 可以篩 tag 跟 kind", () => {
    const r = call("tools/call", { name: "list_projects", arguments: { kind: "personal" } })?.result;
    const data = r?.structuredContent as { projects: { kind: string }[] };
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.projects.every((p) => p.kind === "personal")).toBe(true);
    expect(JSON.parse(r!.content![0].text)).toEqual(data);
  });

  it("get_post 有全文；找不到回 isError（不是協定錯誤）", () => {
    const list = call("tools/call", { name: "list_posts", arguments: {} })?.result?.structuredContent as { posts: { slug: string }[] };
    const post = call("tools/call", { name: "get_post", arguments: { slug: list.posts[0].slug } })?.result?.structuredContent as { content: string };
    expect(post.content.length).toBeGreaterThan(100);
    const miss = call("tools/call", { name: "get_post", arguments: { slug: "nope" } })?.result;
    expect(miss?.isError).toBe(true);
  });

  it("search 要有 query；不認識的工具回 -32602", () => {
    expect(call("tools/call", { name: "search", arguments: { query: "" } })?.result?.isError).toBe(true);
    expect(call("tools/call", { name: "nope" })?.error?.code).toBe(-32602);
  });
});

describe("MCP：HTTP 端點", () => {
  const post = (body: string) => POST(new Request("https://kbs0830.com/mcp", { method: "POST", body, headers: { "Content-Type": "application/json" } }));

  it("請求回 JSON、通知回 202、壞 JSON 回 400、GET 回 405、OPTIONS 有 CORS", async () => {
    const res = await post(JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/list" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect((await res.json()).id).toBe(7);
    expect((await post(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }))).status).toBe(202);
    expect((await post("{not json")).status).toBe(400);
    expect(GET().status).toBe(405);
    expect(OPTIONS().headers.get("access-control-allow-origin")).toBe("*");
  });
});
