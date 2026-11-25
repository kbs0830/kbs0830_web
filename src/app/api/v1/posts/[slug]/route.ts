import { getAllPosts } from "@/lib/content/blog";
import { apiJson, apiPost } from "@/lib/api/public-api";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = apiPost((await params).slug);
  return post ? apiJson(post) : apiJson({ error: "not found" }, 404);
}
