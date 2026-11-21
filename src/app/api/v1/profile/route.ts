import { apiJson, apiProfile } from "@/lib/public-api";

export const dynamic = "force-static";

export function GET() {
  return apiJson(apiProfile());
}
