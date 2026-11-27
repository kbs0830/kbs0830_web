import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// 無障礙掃描補洞（TODO C15，2026-11-27）：a11y.spec.ts 的頁面清單是手寫的 17 頁，sitemap 有九十幾頁，
// 表單最多、最容易出問題的 13 個工具頁一頁都沒掃。這支從 sitemap 產生清單，掃「手寫清單沒掃到的頁」：
//   - 每個種類（/tools/*、/blog/*、/projects/*、/tools/airport-distance/*、/tools/fukuoka-weather/*）各抽最多 2 頁；
//     航線頁 30 個、月份頁 12 個是同一個模板，全掃只是浪費時間
//   - 其餘單獨的頁面（/ask、/tools、/now、/uses…）全掃
// 規則跟 a11y.spec.ts 一樣：WCAG 2.x A／AA，只擋 serious／critical；開「減少動態效果」。
// 每頁只載入一次，在同一頁切 data-theme 淺色、深色各掃一遍（CI 跑 next dev，每頁導覽都要即時編譯，次數減半省很多時間）。
// 新增頁面進 sitemap 就自動被掃，不用記得改測試。
const COVERED = new Set(["/", "/blog", "/blog/task-scheduler-72-hours", "/projects/foodlens-advisor", "/projects/yen-rate-analyzer", "/projects/aqi-classification", "/resume", "/stats", "/flights", "/hotels", "/radar", "/airports", "/changelog", "/status", "/colophon", "/developers", "/travel"]);
const FAMILY_SAMPLE = 2;

/** 同一個模板的頁面歸成一族：/tools/airport-distance/tpe-fuk → /tools/airport-distance/*；/blog/xxx → /blog/* */
function familyOf(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const parent = `/${parts.slice(0, -1).join("/")}`;
  return ["/blog", "/projects", "/tools", "/tools/airport-distance", "/tools/fukuoka-weather"].includes(parent) ? parent : null;
}

test("a11y（sitemap 其餘頁面，淺色＋深色）", async ({ page, request }) => {
  test.setTimeout(900_000);
  const xml = await (await request.get("/sitemap.xml")).text();
  const all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => !COVERED.has(p));
  const seen = new Map<string, number>();
  const paths = all.filter((p) => {
    const fam = familyOf(p);
    if (!fam) return true;
    // /tools 底下：工具頁本身全掃（它們各自是不同的互動），只有 /tools/airport-distance、/tools/fukuoka-weather 的子頁抽樣
    if (fam === "/tools") return true;
    const n = (seen.get(fam) ?? 0) + 1;
    seen.set(fam, n);
    return n <= FAMILY_SAMPLE;
  });
  expect(paths.length).toBeGreaterThan(10);

  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));

  const problems: string[] = [];
  for (const path of paths) {
    await page.goto(path);
    // 有些頁面一直有請求在跑（/ask 的暖機），最多等 15 秒
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("canvas")
        .exclude('img[src*="ghchart.rshah.org"]')
        .analyze();
      problems.push(
        ...result.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${path}（${theme}）${v.id}（${v.impact}）× ${v.nodes.length}：${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
      );
    }
  }
  expect(problems, `掃了 ${paths.length} 頁 × 淺色／深色`).toEqual([]);
});
