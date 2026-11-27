import { test, expect } from "@playwright/test";

// 樣式防呆（TODO C6，2026-11-27）：抓 tsc／lint 抓不到、而且「畫面看起來壞掉」的 bug——例如 2026-07 的「按鈕整個透明」
// （Tailwind v4 的方括號變數寫法編譯成無效 CSS）。淺色、深色各跑一次。
// 不做像素比對：首頁有即時時鐘、天空、3D 背景，桌機跟 A14 的渲染也不同，像素比對會一直誤報；這裡檢查的是「樣式有沒有壞」本身。
//   1. 沒有任何 CSS 規則的屬性值是裸的「--變數名」（編譯壞掉的 var()）
//   2. 頁面標記裡沒有「方括號＋裸變數」的 class（v3 寫法）
//   3. 用強調色當底的按鈕／連結，實際算出來的底色不是透明
//   4. 內文的文字色跟背景色對比 ≥ 4.5（整頁看不見字就是壞了）
const PAGES = ["/", "/blog", "/tools", "/radar", "/colophon"];
const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  for (const path of PAGES) {
    test(`樣式沒壞：${path}（${theme}）`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.waitForLoadState("networkidle");

      const result = await page.evaluate(() => {
        // 1. 裸 --變數 當屬性值
        const bad: string[] = [];
        const walk = (rules: CSSRuleList) => {
          for (const r of Array.from(rules)) {
            if (r instanceof CSSStyleRule) {
              for (const prop of Array.from(r.style)) {
                if (prop.startsWith("--")) continue; // 自訂屬性本身可以是任何值
                // 這些屬性的值本來就是 --開頭的命名（dashed-ident）：捲動時間軸、錨點定位，不是壞掉的 var()
                if (/^(view-timeline|scroll-timeline|animation-timeline|timeline-scope|anchor-name|anchor-scope|position-anchor|position-try)/.test(prop)) continue;
                const v = r.style.getPropertyValue(prop).trim();
                if (/^--[\w-]+$/.test(v)) bad.push(`${r.selectorText} { ${prop}: ${v} }`);
              }
            } else if ("cssRules" in r) {
              walk((r as CSSGroupingRule).cssRules);
            }
          }
        };
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            walk(sheet.cssRules);
          } catch {
            // 跨網域樣式表讀不到，略過
          }
        }

        // 2. 標記裡的方括號裸變數 class
        const bracket = Array.from(document.querySelectorAll("[class]"))
          .map((el) => el.getAttribute("class") ?? "")
          .filter((c) => /(^|\s)[\w:-]+-\[--[\w-]+\]/.test(c))
          .slice(0, 5);

        // 3. 強調色底的元件算出來不是透明
        const transparent = Array.from(document.querySelectorAll<HTMLElement>('[class*="bg-(--accent)"]'))
          // 只看「沒帶變體前綴」的 bg-(--accent)（hover:、group-hover:、aria-… 的不是預設底色），而且要看得到
          .filter((el) => el.classList.contains("bg-(--accent)") && el.offsetParent !== null)
          .filter((el) => {
            const bg = getComputedStyle(el).backgroundColor;
            return bg === "rgba(0, 0, 0, 0)" || bg === "transparent";
          })
          .map((el) => el.outerHTML.slice(0, 100));

        // 4. 內文文字色 vs 背景色對比
        const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
        const lum = ([r, g, b]: number[]) => {
          const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const cs = getComputedStyle(document.body);
        const fg = parse(cs.color);
        const bg = parse(cs.backgroundColor.startsWith("rgba(0, 0, 0, 0)") ? getComputedStyle(document.documentElement).backgroundColor : cs.backgroundColor);
        const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        const contrast = (l1 + 0.05) / (l2 + 0.05);

        return { bad: bad.slice(0, 5), bracket, transparent: transparent.slice(0, 5), contrast };
      });

      expect(result.bad, "CSS 裡有裸的 --變數當屬性值（var() 編譯壞了）").toEqual([]);
      expect(result.bracket, "標記裡有 v3 的方括號變數寫法").toEqual([]);
      expect(result.transparent, "強調色底的元件底色是透明的").toEqual([]);
      expect(result.contrast, "內文文字跟背景對比太低").toBeGreaterThanOrEqual(4.5);
    });
  }
}
