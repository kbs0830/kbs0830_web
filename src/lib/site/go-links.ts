import { GITHUB_URL, REPO_URL } from "@/lib/site/site";

// /go/<代號> 轉址表（TODO E10，2026-11-26）。為了知道「推薦連結、/hire 有沒有人點」：站內放 /go/xxx，伺服器記一次再轉過去。
// 只列自己確定要放的外部連結；以後的聯盟連結（E9）、贊助（Buy me a coffee）、/hire 的外部表單也加在這。
// 代號只能小寫英數與連字號；沒列在這裡的代號回 404。
export const GO_LINKS: Record<string, string> = {
  github: GITHUB_URL,
  repo: REPO_URL,
};

export const isGoCode = (s: string) => /^[a-z0-9-]{1,32}$/.test(s);

/** 代號 → 轉址網址；只認 GO_LINKS 自己的欄位（Object.hasOwn），不會取到 constructor、toString 這類原型上的東西 */
export function goTarget(code: string): string | undefined {
  return isGoCode(code) && Object.hasOwn(GO_LINKS, code) ? GO_LINKS[code] : undefined;
}
