import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __closeDb, listDecisions, recentEvents, saveDecision } from "@/lib/admin/db";
import { parseTodo } from "@/lib/admin/todo";

describe("parseTodo", () => {
  const md = [
    "# TODO",
    "## 🙋 你要動手的",
    "- [ ] **登入 `gh`**（11/25）：桌機跑 `gh auth login`",
    "  - [ ] **縮排的不算**：說明",
    "## ⚙️ 還沒做的點子",
    "**B. 網站功能（🟧／🟩）**",
    "- [ ] **B16. 稀有機型首頁提示** 🟩：雷達收到 747 就提示，說明裡的 🙋 不算",
    "- [ ] **E1. `/hire` 接案頁** ⭐ 🟧 🙋：[make-money](make-money.md) 階段一",
    "- [x] **B1. 做完的不算**：x",
  ].join("\r\n");

  it("編號、大小、🙋、⭐、分區都抓對", () => {
    const items = parseTodo(md);
    expect(items.map((i) => i.id)).toEqual(["t:登入 gh", "B16", "E1"]);
    expect(items[0]).toMatchObject({ section: "你要動手的", needsYou: true, size: null });
    expect(items[1]).toMatchObject({ code: "B16", title: "稀有機型首頁提示", size: "S", needsYou: false, group: "B. 網站功能" });
    expect(items[2]).toMatchObject({ title: "/hire 接案頁", size: "M", needsYou: true, recommended: true, summary: "make-money 階段一" });
  });

  it("真的 TODO.md 解析得出東西，而且 id 不重複", () => {
    const items = parseTodo(fs.readFileSync("TODO.md", "utf8"));
    expect(items.length).toBeGreaterThan(30);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

describe("admin db", () => {
  beforeEach(() => vi.stubEnv("ADMIN_DB_FILE", ":memory:"));
  afterEach(() => { __closeDb(); vi.unstubAllEnvs(); });

  it("存、改、清掉決定，操作都有紀錄", () => {
    expect(saveDecision("B16", "now", "  先做這個 ", 1000)).toEqual({ itemId: "B16", choice: "now", note: "先做這個", updatedAt: 1000 });
    saveDecision("B16", "later", "", 2000);
    expect(listDecisions()).toEqual([{ itemId: "B16", choice: "later", note: "", updatedAt: 2000 }]);
    saveDecision("E1", null, "只有備註", 3000);
    expect(listDecisions().map((d) => d.itemId)).toEqual(["E1", "B16"]);
    expect(saveDecision("B16", null, " ", 4000)).toBeNull();
    expect(listDecisions().map((d) => d.itemId)).toEqual(["E1"]);
    expect(recentEvents().map((e) => e.action)).toEqual(["decision.clear", "decision.set", "decision.set", "decision.set"]);
  });

  it("choice 不是三種之一 → 資料庫擋下", () => {
    expect(() => saveDecision("B16", "maybe" as never, "", 1)).toThrow();
  });
});
