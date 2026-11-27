import { describe, expect, it } from "vitest";
import { getAllPosts } from "@/lib/content/blog";
import { breadcrumbLd, webApplicationLd } from "@/lib/site/json-ld";
import { POST_TOOLS, postsForTool, toolsForPost } from "@/lib/site/related";
import { TOOL_PAGES } from "@/lib/site/site-map";

describe("文章 ↔ 工具對應表（V8）", () => {
  it("對應表裡的文章、工具都真的存在（改名、刪掉會在這裡抓到）", () => {
    const slugs = new Set(getAllPosts().map((p) => p.slug));
    const tools = new Set<string>(TOOL_PAGES.map((t) => t.href));
    for (const [slug, hrefs] of Object.entries(POST_TOOLS)) {
      expect(slugs.has(slug), `文章 ${slug} 不存在`).toBe(true);
      for (const h of hrefs) expect(tools.has(h), `工具 ${h} 不在 TOOL_PAGES`).toBe(true);
    }
  });

  it("兩個方向查得到彼此", () => {
    expect(toolsForPost("tailwind-v4-bracket-var")).toEqual(["/tools/tailwind-v4-vars"]);
    expect(postsForTool("/tools/ps1-encoding")).toEqual(["task-scheduler-72-hours"]);
    expect(postsForTool("/tools/user-agent").sort()).toEqual(["ci-polluted-stats", "visitor-stats-bot-pollution"]);
    expect(toolsForPost("no-such-post")).toEqual([]);
  });
});

describe("結構化資料（V7）", () => {
  it("麵包屑：位置從 1 開始、網址是完整的", () => {
    const ld = breadcrumbLd([
      { name: "首頁", path: "" },
      { name: "小工具", path: "/tools" },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "首頁", item: "https://kbs0830.com" },
      { "@type": "ListItem", position: 2, name: "小工具", item: "https://kbs0830.com/tools" },
    ]);
  });

  it("WebApplication：免費、不含人名", () => {
    const ld = webApplicationLd({ name: "CSP 標頭解讀", description: "說明", path: "/tools/csp" });
    expect(ld).toMatchObject({ "@type": "WebApplication", isAccessibleForFree: true, url: "https://kbs0830.com/tools/csp", offers: { price: "0" } });
    expect(JSON.stringify(ld)).not.toContain("李秉威");
  });
});
