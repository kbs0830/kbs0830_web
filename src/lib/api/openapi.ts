import { API_BASE } from "@/lib/api/public-api";
import { SITE_URL } from "@/lib/site/site";

// /api/v1/openapi.json（TODO A10，2026-11-21）。欄位要跟 lib/api/public-api.ts 回傳的一致——
// openapi.test.ts 會拿真的資料比對 required 欄位，改 API 忘了改這裡會被抓到。

const str = { type: "string" } as const;
const nullableStr = { type: ["string", "null"] } as const;
const int = { type: "integer" } as const;
const strArr = { type: "array", items: str } as const;
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const ok = (schema: object, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notFound = { description: "找不到這個 slug", content: { "application/json": { schema: { type: "object", properties: { error: str } } } } };
const slugParam = { name: "slug", in: "path", required: true, schema: str };

export const schemas = {
  Project: {
    type: "object",
    required: ["slug", "title", "titleZh", "description", "descriptionZh", "highlightZh", "tags", "status", "kind", "url", "github"],
    properties: {
      slug: str,
      title: str,
      titleZh: str,
      description: str,
      descriptionZh: str,
      highlightZh: { ...str, description: "一句話成果" },
      tags: strArr,
      status: { type: "string", enum: ["完成", "製作中", "學習記錄", "課程專題"] },
      kind: { type: "string", enum: ["personal", "course"] },
      url: { ...str, format: "uri" },
      github: nullableStr,
    },
  },
  ProjectDetail: {
    allOf: [
      ref("Project"),
      {
        type: "object",
        required: ["intro", "sections", "context", "image"],
        properties: {
          intro: nullableStr,
          sections: {
            type: "array",
            items: { type: "object", required: ["heading", "headingEn", "items"], properties: { heading: str, headingEn: nullableStr, items: strArr } },
          },
          context: nullableStr,
          image: nullableStr,
        },
      },
    ],
  },
  Post: {
    type: "object",
    required: ["slug", "title", "titleEn", "date", "description", "tags", "series", "readingMinutes", "url", "markdownUrl"],
    properties: {
      slug: str,
      title: str,
      titleEn: str,
      date: { ...str, format: "date" },
      description: str,
      tags: strArr,
      series: nullableStr,
      readingMinutes: int,
      url: { ...str, format: "uri" },
      markdownUrl: { ...str, format: "uri" },
    },
  },
  PostFull: {
    allOf: [ref("Post"), { type: "object", required: ["content"], properties: { content: { ...str, description: "文章 MDX 原文" } } }],
  },
  Profile: {
    type: "object",
    required: ["name", "role", "base", "focus", "status", "links"],
    properties: { name: str, role: str, base: str, focus: strArr, status: strArr, links: { type: "object", additionalProperties: str } },
  },
  Now: { type: "object", required: ["items", "url"], properties: { items: strArr, url: str } },
  Flights: {
    type: "object",
    required: ["flights", "airports", "countries", "km", "earthLaps", "airlines", "routes", "url"],
    properties: {
      flights: int,
      airports: int,
      countries: int,
      km: int,
      earthLaps: { type: "number" },
      airlines: { type: "array", items: { type: "object", properties: { code: str, name: str, flights: int } } },
      routes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            from: { type: "object", properties: { code: str, name: str } },
            to: { type: "object", properties: { code: str, name: str } },
            km: int,
            count: int,
            flightCodes: strArr,
          },
        },
      },
      url: str,
    },
  },
} as const;

export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "kbs0830.com public API",
    version: "1.0.0",
    description:
      "PINGWEI LI 個人網站的公開唯讀 API：作品、文章、現況、飛行紀錄統計。內容跟網站頁面同一份資料，不需要金鑰，任何網域都可以讀（CORS *）。",
    contact: { url: `${SITE_URL}/developers` },
  },
  servers: [{ url: API_BASE }],
  paths: {
    "/profile": { get: { summary: "個人簡介", operationId: "getProfile", responses: { 200: ok(ref("Profile"), "簡介") } } },
    "/projects": {
      get: {
        summary: "全部作品",
        operationId: "listProjects",
        responses: { 200: ok({ type: "object", required: ["projects"], properties: { projects: { type: "array", items: ref("Project") } } }, "作品清單") },
      },
    },
    "/projects/{slug}": {
      get: { summary: "單一作品（含詳細說明）", operationId: "getProject", parameters: [slugParam], responses: { 200: ok(ref("ProjectDetail"), "作品"), 404: notFound } },
    },
    "/posts": {
      get: {
        summary: "全部文章（不含全文）",
        operationId: "listPosts",
        responses: { 200: ok({ type: "object", required: ["posts"], properties: { posts: { type: "array", items: ref("Post") } } }, "文章清單") },
      },
    },
    "/posts/{slug}": {
      get: { summary: "單篇文章（含全文）", operationId: "getPost", parameters: [slugParam], responses: { 200: ok(ref("PostFull"), "文章"), 404: notFound } },
    },
    "/now": { get: { summary: "現在在做什麼", operationId: "getNow", responses: { 200: ok(ref("Now"), "現況") } } },
    "/flights": { get: { summary: "飛行紀錄統計（沒有日期）", operationId: "getFlights", responses: { 200: ok(ref("Flights"), "統計") } } },
  },
  components: { schemas },
} as const;
