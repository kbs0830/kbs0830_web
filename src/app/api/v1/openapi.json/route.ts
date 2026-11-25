import { apiJson } from "@/lib/api/public-api";
import { openapi } from "@/lib/api/openapi";

// OpenAPI 3.1 規格（TODO A10）；內容在 lib/api/openapi.ts

export function GET() {
  return apiJson(openapi);
}
