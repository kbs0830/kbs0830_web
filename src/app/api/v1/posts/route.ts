import { apiJson, apiPosts } from "@/lib/api/public-api";

// 全部文章（不含全文，全文在 /api/v1/posts/{slug}）
export const dynamic = "force-static";

export function GET() {
  return apiJson({ posts: apiPosts() });
}
