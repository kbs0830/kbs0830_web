import { describe, expect, it } from "vitest";
import { buildKnowledge, contextBlock, getCore, getTopical, search, sourcesOf, techLines, techSources, tokenize } from "./knowledge";
import { projects } from "@/lib/content/projects";

// 用真的網站內容測：內容改了、檢索變差會在這裡先發現
const kb = buildKnowledge();

describe("知識庫內容", () => {
  it("有內容，每段都有網址；作品與文章的段落不超過上限的 1.5 倍（基本資料另算，見下面）", () => {
    expect(kb.length).toBeGreaterThan(50);
    for (const c of kb) {
      expect(c.href.startsWith("/")).toBe(true);
      expect(c.text.length).toBeGreaterThan(0);
    }
    for (const c of getTopical()) expect(c.text.length).toBeLessThanOrEqual(1100);
  });

  it("不含中文本名（privacy.spec 的規則；模型讀不到就說不出來）", () => {
    expect(kb.some((c) => `${c.title}${c.text}`.includes("李秉威"))).toBe(false);
  });

  it("不含隱藏作品，也不含後台、雷達位置這類不公開的東西", () => {
    const listed = new Set(projects.map((p) => p.slug));
    for (const c of kb) {
      if (c.id.startsWith("project:")) expect(listed.has(c.id.split(":")[1])).toBe(true);
      expect(c.href.startsWith("/admin")).toBe(false);
    }
  });
});

describe("基本資料（每次都帶）", () => {
  it("包含學歷、足跡、日語程度與聯絡方式，且不跟作品／文章重複", () => {
    const text = getCore().map((c) => c.text).join("\n");
    expect(text).toContain("智慧商務");
    expect(text).toContain("福岡");
    expect(text).toContain("日語 N5");
    expect(text).toContain("foodlens-advisor"); // 作品清單：問「哪些專案／用過 X 的專案」直接從這裡答
    expect(text).toContain("github.com/kbs0830");
    expect(getTopical().some((c) => c.id.startsWith("about:") || c.id.startsWith("resume:"))).toBe(false);
  });

  it("基本資料不會太大（每次提問都要塞進去）", () => {
    expect(getCore().reduce((n, c) => n + c.text.length, 0)).toBeLessThan(3000);
  });
});

describe("tokenize", () => {
  it("中文取相鄰兩字、英數取單字、單字元英文略過", () => {
    expect(tokenize("YOLO 部署a")).toEqual(["yolo", "部署"]);
    expect(tokenize("Next.js")).toEqual(["next.js"]);
    expect(tokenize("做過 Next.js。")).toEqual(["做過", "next.js"]);
  });

  it("疑問詞跟虛詞不產生雙連詞", () => {
    expect(tokenize("他會什麼語言？")).toEqual(["語言"]);
    expect(tokenize("讀哪間大學")).toEqual(["大學"]);
  });
});

describe("search", () => {
  it("問作品會找到那個作品", () => {
    const hit = search("FoodLens Advisor 怎麼辨識食物？");
    expect(hit[0].href).toBe("/projects/foodlens-advisor");
  });

  it("問技術會找到相關文章", () => {
    const hrefs = search("Cloudflare Tunnel 斷線").map((c) => c.href);
    expect(hrefs).toContain("/blog/tunnel-down-four-days");
  });

  it("英文單字比對有前綴：問 YOLO 找得到寫 YOLOv8 的段落", () => {
    expect(search("YOLO").some((c) => c.text.includes("YOLOv8"))).toBe(true);
  });

  it("完全不相關的問題回空陣列", () => {
    // 注意：問題裡的字不能出現在任何文章裡（文章例子提過咖哩飯，這裡就不能用）
    expect(search("玫瑰花要怎麼施肥？").length).toBe(0);
    expect(search("週末的颱風預報怎麼樣？").length).toBe(0);
    expect(search("")).toEqual([]);
  });

  it("來源同一頁只列一次、最多 3 個", () => {
    const found = search("Next.js 部署 Cloudflare Windows", kb, 8);
    const src = sourcesOf(found);
    expect(src.length).toBeLessThanOrEqual(3);
    expect(new Set(src.map((s) => s.href)).size).toBe(src.length);
  });
});

describe("techLines（哪些作品用了 X，由程式算好）", () => {
  it("Next.js 只有本站；YOLO（前綴）對得到 YOLOv8 的兩個作品", () => {
    expect(techLines("做過哪些 Next.js 專案？")).toEqual(["用到「Next.js」的作品只有這 1 個：個人網站（本站）"]);
    const yolo = techLines("他會 YOLO 部署嗎？").join("\n");
    expect(yolo).toContain("YOLOv8");
    expect(yolo).toContain("食物辨識助手");
    expect(yolo).toContain("自動跟隨機器人");
  });

  it("技術比對到的作品頁可以當來源", () => {
    expect(techSources("Next.js 專案")).toEqual([{ title: "個人網站（本站）", href: "/projects/kbs0830-web" }]);
    expect(techSources("日語程度")).toEqual([]);
  });

  it("沒有技術名詞、或名詞不是任何作品的標籤就不產生", () => {
    expect(techLines("日語程度如何？")).toEqual([]);
    expect(techLines("")).toEqual([]);
    expect(techLines("Kubernetes 怎麼用")).toEqual([]);
  });
});

describe("contextBlock", () => {
  it("沒找到時明講沒有", () => {
    const block = contextBlock(getCore(), []);
    expect(block).toContain("沒有找到相關的作品或文章");
    expect(block).toContain("基本資料");
  });
});
