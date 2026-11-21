import { apiJson } from "@/lib/public-api";
import { openapi } from "@/lib/openapi";

// OpenAPI 3.1 規格（TODO A10）；內容在 lib/openapi.ts
export const dynamic = "force-static";

export function GET() {
  return apiJson(openapi);
}
