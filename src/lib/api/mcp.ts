// 網站的 MCP 伺服器（/mcp，TODO A9，2026-11-21）：讓 AI 助理（Claude、ChatGPT…）直接查「他做過哪些作品」「最新文章」。
// Streamable HTTP transport、無狀態（不發 Mcp-Session-Id）、唯讀；回應一律 application/json（不開 SSE）。
// 資料跟公開 API 同一份（lib/api/public-api.ts），只有網站上本來就公開的內容。
import { apiFlights, apiNow, apiPost, apiPosts, apiProfile, apiProject, apiProjects, searchSite } from "@/lib/api/public-api";
import { semanticSearch } from "@/lib/ai/retrieve";
import { SITE_URL } from "@/lib/site/site";

export const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "kbs0830", title: "PINGWEI LI · kbs0830.com", version: "1.0.0" };

type Json = Record<string, unknown>;
interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  /** 可以回傳 Promise（語意搜尋要呼叫本機 Ollama） */
  run: (args: Json) => unknown;
}

const slugArg = (what: string) => ({
  type: "object",
  properties: { slug: { type: "string", description: `${what}的 slug（從清單工具拿）` } },
  required: ["slug"],
});
const noArgs = { type: "object", properties: {} };
const asString = (v: unknown) => (typeof v === "string" ? v : undefined);

class ToolError extends Error {}

export const TOOLS: Tool[] = [
  {
    name: "get_profile",
    title: "簡介",
    description: "PINGWEI LI 是誰：身分、所在地、專長、現況、連結。",
    inputSchema: noArgs,
    run: () => apiProfile(),
  },
  {
    name: "list_projects",
    title: "作品清單",
    description: "列出作品（個人專案＋課程專題）：名稱、一句話說明、技術 tag、狀態、網址。可以用 tag（例如 Python、Next.js）或 kind 篩選。",
    inputSchema: {
      type: "object",
      properties: {
        tag: { type: "string", description: "技術 tag，不分大小寫" },
        kind: { type: "string", enum: ["personal", "course"], description: "personal＝個人專案，course＝課程專題" },
      },
    },
    run: (a) => {
      const kind = asString(a.kind);
      return { projects: apiProjects(asString(a.tag)).filter((p) => !kind || p.kind === kind) };
    },
  },
  {
    name: "get_project",
    title: "作品詳細",
    description: "單一作品的完整說明：架構、做了什麼、成果。",
    inputSchema: slugArg("作品"),
    run: (a) => {
      const p = apiProject(asString(a.slug) ?? "");
      if (!p) throw new ToolError(`找不到作品「${String(a.slug)}」，先用 list_projects 查 slug`);
      return p;
    },
  },
  {
    name: "list_posts",
    title: "文章清單",
    description: "技術部落格文章清單（新的在前）：標題、日期、摘要、tag。內容都是實際踩過的坑。",
    inputSchema: { type: "object", properties: { tag: { type: "string", description: "文章 tag，不分大小寫" } } },
    run: (a) => ({ posts: apiPosts(asString(a.tag)) }),
  },
  {
    name: "get_post",
    title: "文章全文",
    description: "單篇文章的全文（Markdown／MDX）。",
    inputSchema: slugArg("文章"),
    run: (a) => {
      const p = apiPost(asString(a.slug) ?? "");
      if (!p) throw new ToolError(`找不到文章「${String(a.slug)}」，先用 list_posts 查 slug`);
      return p;
    },
  },
  {
    name: "search",
    title: "搜尋",
    description: "用關鍵字搜尋作品跟文章（標題、說明、tag、內文）。",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "關鍵字，例如 YOLOv8、Cloudflare" } }, required: ["query"] },
    run: (a) => {
      const q = asString(a.query);
      if (!q?.trim()) throw new ToolError("query 不能是空的");
      return searchSite(q);
    },
  },
  {
    name: "semantic_search",
    title: "語意搜尋",
    description: "用意思搜尋作品跟文章（本站自架的 embedding 模型）。問句、同義詞也找得到，例如「怎麼讓網站不要掛掉」。回傳最相關的頁面標題與路徑；本機 AI 沒開時退回關鍵字。",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "一句話或幾個詞，中英文都可以" } }, required: ["query"] },
    run: async (a) => {
      const q = asString(a.query)?.trim();
      if (!q) throw new ToolError("query 不能是空的");
      const results = await semanticSearch(q.slice(0, 200), 5, AbortSignal.timeout(8000));
      return { query: q, results: results.map((r) => ({ ...r, url: `${SITE_URL}${r.href}` })) };
    },
  },
  {
    name: "get_now",
    title: "現在在做什麼",
    description: "現在在忙什麼、在學什麼（/now 頁）。",
    inputSchema: noArgs,
    run: () => apiNow(),
  },
  {
    name: "get_flight_stats",
    title: "飛行紀錄統計",
    description: "航迷小筆記：搭過的航線、機場、航空公司、總距離（不含日期）。",
    inputSchema: noArgs,
    run: () => apiFlights(),
  },
];

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Json;
}

const result = (id: RpcRequest["id"], r: unknown) => ({ jsonrpc: "2.0", id, result: r });
const error = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

/** 處理一則 JSON-RPC 訊息；通知（沒有 id）回 null＝不用回應 */
export function handleRpc(msg: RpcRequest): object | null | Promise<object | null> {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return error(msg?.id, -32600, "Invalid Request");
  }
  const isNotification = msg.id === undefined;
  if (isNotification) return null; // notifications/initialized、cancelled… 無狀態，不用處理

  switch (msg.method) {
    case "initialize": {
      const asked = asString(msg.params?.protocolVersion);
      return result(msg.id, {
        protocolVersion: asked && SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: `PINGWEI LI（台灣高雄的學生開發者）的個人網站 ${SITE_URL}。可以查作品、技術文章、現況、飛行紀錄統計。全部唯讀、都是網站上公開的內容。`,
      });
    }
    case "ping":
      return result(msg.id, {});
    case "tools/list":
      return result(msg.id, {
        tools: TOOLS.map(({ name, title, description, inputSchema }) => ({
          name,
          title,
          description,
          inputSchema,
          annotations: { title, readOnlyHint: true, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const name = asString(msg.params?.name);
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return error(msg.id, -32602, `Unknown tool: ${String(name)}`);
      const args = (msg.params?.arguments ?? {}) as Json;
      const ok = (data: unknown) =>
        result(msg.id, { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data });
      const fail = (e: unknown) =>
        e instanceof ToolError ? result(msg.id, { content: [{ type: "text", text: e.message }], isError: true }) : error(msg.id, -32603, "Internal error");
      try {
        const data = tool.run(args);
        return data instanceof Promise ? data.then(ok, fail) : ok(data);
      } catch (e) {
        return fail(e);
      }
    }
    default:
      return error(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}
