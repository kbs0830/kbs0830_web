import { apiJson, apiProjects } from "@/lib/api/public-api";

// 全部作品（build 時產生；要篩 tag 就自己濾，MCP 的 list_projects 有 tag 參數）

export function GET() {
  return apiJson({ projects: apiProjects() });
}
