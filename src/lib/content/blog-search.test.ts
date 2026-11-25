import { describe, expect, it } from "vitest";
import { plainText, searchPosts, type IndexedPost } from "@/lib/content/blog-search";
import { getAllPosts } from "@/lib/content/blog";

const index: IndexedPost[] = getAllPosts().map((p) => ({ ...p, text: plainText(p.content) }));

describe("部落格搜尋", () => {
  it("純文字：拿掉 Markdown 標記，程式碼內容留著", () => {
    expect(plainText("## 標題\n\n**粗** 跟 `code` 跟 [連結](/x)\n\n```ps1\nStop-Service X\n```")).toBe("標題 粗 跟 code 跟 連結 Stop-Service X");
  });

  it("中文直接比對，標題命中排前面", () => {
    const hits = searchPosts(index, "工作排程器");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].slug).toBe("task-scheduler-72-hours");
    expect(hits[0].snippet?.match).toBe("工作排程器");
  });

  it("多個詞要全部出現；空字串、找不到回空", () => {
    const both = searchPosts(index, "Tunnel watchdog");
    expect(both.every((h) => {
      const p = index.find((x) => x.slug === h.slug)!;
      const all = `${p.title} ${p.titleEn} ${p.tags.join(" ")} ${p.description} ${p.text}`.toLowerCase();
      return all.includes("tunnel") && all.includes("watchdog");
    })).toBe(true);
    expect(searchPosts(index, "   ")).toEqual([]);
    expect(searchPosts(index, "完全不可能出現的字串zzqq")).toEqual([]);
  });

  it("程式碼裡的指令也搜得到", () => {
    expect(searchPosts(index, "schtasks").some((h) => h.slug === "task-scheduler-72-hours")).toBe(true);
  });
});
