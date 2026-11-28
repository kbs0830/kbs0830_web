import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "drafts-"));
  process.env.BLOG_DRAFTS_DIR = dir;
  process.env.ADMIN_DB_FILE = ":memory:";
});
afterEach(() => {
  delete process.env.BLOG_DRAFTS_DIR;
  delete process.env.ADMIN_DB_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

const write = (slug: string, title: string) => fs.writeFileSync(path.join(dir, `${slug}.mdx`), `---\ntitle: "${title}"\ntitleEn: "T"\ndescription: "d"\ntags: ["a", "b"]\n---\n\n內文\n`);

describe("部落格草稿審批", () => {
  it("列出草稿（預設待審）、去掉 frontmatter、略過非 mdx 與怪檔名", async () => {
    const { listDrafts } = await import("./blog-drafts");
    write("first-draft", "第一篇");
    fs.writeFileSync(path.join(dir, "notes.txt"), "x");
    fs.writeFileSync(path.join(dir, "Bad Name.mdx"), "x");
    const got = listDrafts();
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ slug: "first-draft", title: "第一篇", tags: ["a", "b"], body: "內文", status: "pending", note: "" });
  });

  it("核准／退回會存下來，之後可以改；不存在的草稿或亂 slug 不接受", async () => {
    const { listDrafts, reviewDraft } = await import("./blog-drafts");
    write("a-post", "A");
    expect(reviewDraft("a-post", "approved", "發布")).toMatchObject({ status: "approved" });
    expect(listDrafts()[0]).toMatchObject({ status: "approved", note: "發布" });
    reviewDraft("a-post", "rejected", "太長");
    expect(listDrafts()[0]).toMatchObject({ status: "rejected", note: "太長" });
    expect(reviewDraft("ghost", "approved", "")).toBeNull();
    expect(reviewDraft("../etc/passwd", "approved", "")).toBeNull();
  });

  it("沒有草稿資料夾回空陣列", async () => {
    const { listDrafts } = await import("./blog-drafts");
    fs.rmSync(dir, { recursive: true, force: true });
    expect(listDrafts()).toEqual([]);
  });
});
