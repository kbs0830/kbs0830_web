import { apiJson, apiProfile } from "@/lib/api/public-api";

export const dynamic = "force-static";

export function GET() {
  return apiJson(apiProfile());
}
