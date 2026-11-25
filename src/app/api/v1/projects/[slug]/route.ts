import { projects } from "@/lib/content/projects";
import { apiJson, apiProject } from "@/lib/api/public-api";

export const dynamic = "force-static";
export const dynamicParams = false; // 不存在的 slug 直接 404

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const project = apiProject((await params).slug);
  return project ? apiJson(project) : apiJson({ error: "not found" }, 404);
}
