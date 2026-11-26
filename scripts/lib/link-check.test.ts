import { describe, expect, it } from "vitest";
import { checkSite, checkUrl, extractExternalLinks } from "./link-check";

const res = (status: number) => ({ status }) as Response;
// 測試用的假 fetch：參數放寬成 unknown，轉成 typeof fetch 傳進去
const asFetch = (f: (url: string, init: RequestInit) => Promise<Response>) => f as unknown as typeof fetch;

describe("extractExternalLinks", () => {
  it("只取 <a href> 的外部 http(s)；站內、mailto、相對路徑、#fragment 重複都排除", () => {
    const html = `
      <a href="https://github.com/kbs0830/x#readme">a</a> <a href='https://github.com/kbs0830/x'>b</a>
      <a class="x" href="/blog">c</a> <a href="mailto:a@b.c">d</a> <a href="https://www.kbs0830.com/now">e</a>
      <a href="https://example.com/?a=1&amp;b=2">f</a> <link href="https://cdn.example/x.css">`;
    expect(extractExternalLinks(html, "kbs0830.com")).toEqual(["https://github.com/kbs0830/x", "https://example.com/?a=1&b=2"]);
  });
});

describe("checkUrl", () => {
  it("2xx 活著；404 壞了；403 擋機器人不算壞；HEAD 被拒改 GET", async () => {
    expect(await checkUrl("https://a", asFetch(async () => res(200)))).toMatchObject({ ok: true, status: 200 });
    expect(await checkUrl("https://a", asFetch(async () => res(404)))).toMatchObject({ ok: false, status: 404 });
    expect(await checkUrl("https://a", asFetch(async () => res(403)))).toMatchObject({ ok: true, status: 403 });
    const methods: string[] = [];
    const r = await checkUrl(
      "https://a",
      asFetch(async (_u, init) => {
        methods.push(String(init.method));
        return res(init.method === "HEAD" ? 405 : 200);
      }),
    );
    expect(r.ok).toBe(true);
    expect(methods).toEqual(["HEAD", "GET"]);
  });
  it("連不上（丟例外）算壞", async () => {
    const r = await checkUrl(
      "https://a",
      asFetch(async () => {
        throw new Error("getaddrinfo ENOTFOUND");
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.note).toContain("ENOTFOUND");
  });
});

describe("checkSite", () => {
  it("讀 sitemap → 逐頁收外部連結 → 只回壞掉的，附出現在哪些頁", async () => {
    const pages: Record<string, string> = {
      "http://l/sitemap.xml": "<loc>https://kbs0830.com/</loc><loc>https://kbs0830.com/blog</loc>",
      "http://l/": '<a href="https://ok.example/">x</a><a href="https://dead.example/gone">y</a>',
      "http://l/blog": '<a href="https://dead.example/gone">z</a>',
    };
    const fetcher = asFetch(async (url: string) => {
      if (url in pages) return { text: async () => pages[url], status: 200 } as unknown as Response;
      return res(url.startsWith("https://dead.example") ? 404 : 200);
    });
    const r = await checkSite({ base: "http://l", siteUrl: "https://kbs0830.com", fetcher });
    expect(r).toMatchObject({ pages: 2, links: 2 });
    expect(r.broken).toEqual([{ url: "https://dead.example/gone", status: 404, pages: ["/", "/blog"] }]);
  });
});
