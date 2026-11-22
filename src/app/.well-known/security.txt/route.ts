import { SECURITY_EMAIL, SITE_URL } from "@/lib/site";

// /.well-known/security.txt（RFC 9116，TODO B8，2026-11-23）：發現安全問題的人要聯絡誰。
// build 時產生；Expires 是 build 當下 + 180 天，每次部署自動往後延（RFC 建議不超過一年）。
// 這個網站幾乎每天部署，實際上不會過期；真的半年沒部署才會過期（過期只代表聯絡方式「可能過時」，檔案照樣讀得到）。
// 聯絡信箱用系統信箱（使用者指定），不是頁面上的真人信箱。
export const dynamic = "force-static";

const DAY = 24 * 60 * 60 * 1000;

export function GET() {
  const expires = new Date(Date.now() + 180 * DAY).toISOString().replace(/\.\d{3}Z$/, "Z");
  const text = [
    `Contact: mailto:${SECURITY_EMAIL}`,
    `Expires: ${expires}`,
    "Preferred-Languages: zh-TW, en, ja",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    "",
  ].join("\n");
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
