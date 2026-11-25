// Tailwind v4 變數寫法檢查的比對邏輯（TODO J14，2026-11-25，畫面在 components/tools/TailwindVarCheck.tsx）。
// v3 的「方括號＋裸變數」（utility 後面接方括號、裡面直接是 --變數）在 v4 會編譯成無效的 CSS，例如 `background-color: --accent`，
// 瀏覽器直接忽略——這個網站 2026-07 全站 116 處中招（CLAUDE.md「Tailwind v4 CSS 變數語法地雷」）。v4 要寫成小括號。
//
// ⚠️ 這支檔案裡的範例跟正規式都長得像那個錯誤寫法，Tailwind 掃到會真的編出那條壞掉的 CSS：
// globals.css 有 `@source not` 排除這支。這支不要放任何畫面用的 class。

const OPEN = "[";
const CLOSE = "]";

/** utility（可以帶 hover:、md: 這類前綴）-[--變數]，後面可以接 /50 透明度 */
const PATTERN = /((?:[\w-]+:)*[\w-]+-)\[(--[\w-]+)\]/g;

export const EXAMPLE = [
  `<button className="bg-${OPEN}--accent${CLOSE} text-${OPEN}--bg${CLOSE} hover:bg-${OPEN}--accent-lt${CLOSE}">`,
  `  <span className="border-${OPEN}--border${CLOSE}/50 w-${OPEN}1px${CLOSE} text-${OPEN}13px${CLOSE}">ok</span>`,
  `</button>`,
].join("\n");

export type Hit = { line: number; before: string; after: string };

export function checkTailwindVars(src: string): { hits: Hit[]; fixed: string } {
  const hits: Hit[] = [];
  const fixed = src
    .split("\n")
    .map((text, i) =>
      text.replace(PATTERN, (whole, prefix: string, name: string) => {
        const after = `${prefix}(${name})`;
        hits.push({ line: i + 1, before: whole, after });
        return after;
      }),
    )
    .join("\n");
  return { hits, fixed };
}
