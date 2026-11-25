import { apiFlights, apiJson } from "@/lib/api/public-api";

// 跟 /flights 頁一樣的資料：航班代碼、機場、距離、次數，沒有日期

export function GET() {
  return apiJson(apiFlights());
}
