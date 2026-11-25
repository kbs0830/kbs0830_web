import { apiJson, apiNow } from "@/lib/api/public-api";


export function GET() {
  return apiJson(apiNow());
}
