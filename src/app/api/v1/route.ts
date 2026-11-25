import { API_BASE, apiJson } from "@/lib/api/public-api";
import { SITE_URL } from "@/lib/site/site";

// 公開 JSON API 的入口（TODO A10，2026-11-21）：列出所有端點。資料說明見 lib/api/public-api.ts、文件在 /developers

export function GET() {
  return apiJson({
    name: "kbs0830.com public API",
    version: "1",
    docs: `${SITE_URL}/developers`,
    openapi: `${API_BASE}/openapi.json`,
    endpoints: {
      profile: `${API_BASE}/profile`,
      projects: `${API_BASE}/projects`,
      project: `${API_BASE}/projects/{slug}`,
      posts: `${API_BASE}/posts`,
      post: `${API_BASE}/posts/{slug}`,
      now: `${API_BASE}/now`,
      flights: `${API_BASE}/flights`,
    },
  });
}
