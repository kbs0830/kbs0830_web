import { describe, expect, it } from "vitest";
import { fuse, hrefMatches, rank, uniquePages, CITE_SIMILARITY, MIN_SIMILARITY } from "./retrieve";
import type { Chunk } from "./knowledge";

const c = (id: string): Chunk => ({ id, title: id, href: `/${id}`, text: id });
const [a, b, d, e] = [c("a"), c("b"), c("d"), c("e")];

describe("fuse（兩份排名合併）", () => {
  it("兩邊都排前面的最前面，只出現一邊的也留得下來", () => {
    expect(fuse([a, b], [b, d], 3).map((x) => x.id)).toEqual(["b", "a", "d"]);
  });
  it("遵守上限、兩邊都空就空", () => {
    expect(fuse([a, b, d, e], [], 2)).toHaveLength(2);
    expect(fuse([], [], 3)).toEqual([]);
  });
});

describe("rank（語意相似度）", () => {
  it("依內積排序、低於門檻的不要", () => {
    const vecs = [[1, 0], [0.8, 0.6], [0, 1]];
    const out = rank([1, 0], vecs, [a, b, d], 3);
    expect(out.map((x) => x.chunk.id)).toEqual(["a", "b"]); // d 的相似度 0 < 門檻
    expect(out[0].score).toBeCloseTo(1);
    expect(CITE_SIMILARITY).toBeGreaterThan(MIN_SIMILARITY); // 掛名「來源」比放進提示嚴
  });
});

const page = (href: string, title = href): Chunk => ({ id: href, title, href, text: title });

describe("hrefMatches（網址比對，給打錯字的 404 用）", () => {
  const posts = [page("/blog/tunnel-down-four-days"), page("/blog/task-scheduler-72-hours"), page("/projects/kbs0830-web")];
  it("打錯一個字，其他字對得上就找得到", () => {
    expect(hrefMatches("tunnel dwon four days", posts).map((x) => x.href)).toEqual(["/blog/tunnel-down-four-days"]);
  });
  it("只有一個字符合不算（除非問題本來就只有一個字）", () => {
    expect(hrefMatches("four seasons", posts)).toEqual([]);
    expect(hrefMatches("scheduler", posts).map((x) => x.href)).toEqual(["/blog/task-scheduler-72-hours"]);
  });
  it("中文、太短的字不產生比對", () => {
    expect(hrefMatches("網站 的 to", posts)).toEqual([]);
  });
});

describe("uniquePages", () => {
  it("同一頁只留一筆、遵守上限、標題只取「 · 」前面", () => {
    const out = uniquePages([page("/a", "甲 · 段一"), page("/a", "甲 · 段二"), page("/b"), page("/c")], 2);
    expect(out).toEqual([{ title: "甲", href: "/a" }, { title: "/b", href: "/b" }]);
  });
});
