import { apiJson, apiProfile } from "@/lib/api/public-api";


export function GET() {
  return apiJson(apiProfile());
}
