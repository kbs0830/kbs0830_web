import { describe, expect, it } from "vitest";
import { markdownPaths, renderMarkdown } from "./markdown";
import { projects } from "./projects";

describe("Markdown for Agents", () => {
  it("每個列出的路徑都產生得出 Markdown，而且帶原始網頁連結", () => {
    for (const path of markdownPaths()) {
      const md = renderMarkdown(path);
      expect(md, path).toBeTruthy();
      expect(md!.startsWith("# "), path).toBe(true);
      expect(md, path).toContain(`原始網頁：https://kbs0830.com${path ? `/${path}` : ""}`);
    }
  });

  it("所有作品、首頁、履歷、now、uses、blog 都有 Markdown 版", () => {
    const paths = markdownPaths();
    for (const p of projects) expect(paths).toContain(`projects/${p.slug}`);
    for (const p of ["", "resume", "now", "uses", "blog"]) expect(paths).toContain(p);
  });

  it("Markdown 版是頁面的同一份可見內容，不能出現中文本名（CLAUDE.md Key Constraints 1）", () => {
    for (const path of markdownPaths()) {
      expect(renderMarkdown(path), path).not.toContain("李秉威");
    }
  });

  it("有架構圖的作品把 Mermaid 原始碼放進 ```mermaid 區塊", () => {
    const withDiagram = projects.find((p) => p.detail?.architectureDiagram)!;
    const md = renderMarkdown(`projects/${withDiagram.slug}`)!;
    expect(md).toContain("```mermaid\n" + withDiagram.detail!.architectureDiagram);
  });

  it("不存在的頁面回 null（route 會回 404）", () => {
    for (const path of ["nope", "projects/nope", "blog/nope", "projects/a/b", "api"]) {
      expect(renderMarkdown(path), path).toBeNull();
    }
  });
});
