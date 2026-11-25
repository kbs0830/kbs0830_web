import { describe, expect, it } from "vitest";
import { checkTailwindVars } from "./tailwind-vars";

// 範例用拼接：這支檔案 Tailwind 會掃，寫成字面值會編出壞掉的 CSS（見 tailwind-vars.ts 的說明）
const O = "[";
const C = "]";

describe("checkTailwindVars（J14）", () => {
  it("方括號＋裸變數改成小括號，前綴、透明度保留", () => {
    const src = `a bg-${O}--accent${C} hover:text-${O}--muted${C} md:border-${O}--border${C}/50`;
    const { hits, fixed } = checkTailwindVars(src);
    expect(hits.map((h) => h.after)).toEqual(["bg-(--accent)", "hover:text-(--muted)", "md:border-(--border)"]);
    expect(fixed).toBe("a bg-(--accent) hover:text-(--muted) md:border-(--border)/50");
  });
  it("字面值、v4 寫法、var() 不動；行號正確", () => {
    const src = `w-${O}1px${C} text-${O}13px${C}\nbg-(--accent) bg-${O}var(--x)${C}\nfill-${O}--a${C}`;
    const { hits, fixed } = checkTailwindVars(src);
    expect(hits).toEqual([{ line: 3, before: `fill-${O}--a${C}`, after: "fill-(--a)" }]);
    expect(fixed.split("\n")[0]).toBe(`w-${O}1px${C} text-${O}13px${C}`);
  });
});
