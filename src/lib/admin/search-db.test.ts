import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __closeDb, addDone, getDb, logEvent, MARK_CLOSE, MARK_OPEN, searchAdmin } from "@/lib/admin/db";

// 後台全文搜尋（TODO S4）：FTS5 trigram，三個來源用 trigger 跟原表同步
describe("searchAdmin", () => {
  beforeEach(() => vi.stubEnv("ADMIN_DB_FILE", ":memory:"));
  afterEach(() => {
    __closeDb();
    vi.unstubAllEnvs();
  });

  const addTodo = (id: string, title: string, detail = "", status = "open") =>
    getDb()
      .prepare(`INSERT INTO todos (id, title, detail, section, status, sort, created_at, updated_at) VALUES (?, ?, ?, 'x', ?, 1, 1, 1)`)
      .run(id, title, detail, status);

  it("中文任意 3 字以上的片段搜得到，命中處用記號包起來，標明來源", () => {
    addTodo("A1", "住宿紀錄改標題", "把 hotels 頁的搜尋說明改長一點");
    addDone("終端機加指令", "neofetch、uptime、status", "2026-11-26");
    const hits = searchAdmin("宿紀錄");
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ src: "todo", ref: "A1" });
    expect(hits[0].title).toBe(`住${MARK_OPEN}宿紀錄${MARK_CLOSE}改標題`);
    expect(searchAdmin("neofetch")[0]).toMatchObject({ src: "done" });
  });

  it("也搜操作紀錄；來源標籤分待辦的狀態", () => {
    addTodo("B1", "已經做完的事", "", "done");
    addTodo("B2", "決定不做的事", "", "dropped");
    logEvent("todo.done", "B1 已經做完的事");
    const srcs = searchAdmin("做完的").map((h) => h.src).sort();
    expect(srcs).toEqual(["log", "todo:done"]);
    expect(searchAdmin("決定不做")[0].src).toBe("todo:dropped");
  });

  it("原表更新、刪除會同步到索引", () => {
    addTodo("C1", "舊的標題文字", "舊內文");
    expect(searchAdmin("舊的標題")).toHaveLength(1);
    getDb().prepare("UPDATE todos SET title = ? WHERE id = ?").run("全新的標題文字", "C1");
    expect(searchAdmin("舊的標題")).toHaveLength(0);
    expect(searchAdmin("全新的標")).toHaveLength(1);
    getDb().prepare("DELETE FROM todos WHERE id = ?").run("C1");
    expect(searchAdmin("全新的標")).toHaveLength(0);
  });

  it("2 個字的詞退回 LIKE；空字串回空；特殊符號不會當 FTS 語法炸掉", () => {
    addTodo("D1", "雷達圓盤光點", "");
    addDone("雷達日報", "內文", "2026-11-26");
    expect(searchAdmin("雷達").map((h) => h.src).sort()).toEqual(["done", "log", "todo"]); // 新增完成紀錄時也留了一筆操作紀錄（done.add）
    expect(searchAdmin("   ")).toEqual([]);
    expect(() => searchAdmin('"foo" OR * -bar:')).not.toThrow();
    expect(searchAdmin("100%")).toEqual([]);
  });
});
