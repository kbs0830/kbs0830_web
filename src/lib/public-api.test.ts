import { describe, expect, it } from "vitest";
import { apiFlights, apiNow, apiPost, apiPosts, apiProfile, apiProject, apiProjects, searchSite } from "./public-api";
import { openapi, schemas } from "./openapi";

const required = (name: keyof typeof schemas): string[] => {
  const s = schemas[name] as { required?: readonly string[]; allOf?: readonly { required?: readonly string[]; $ref?: string }[] };
  if (s.required) return [...s.required];
  return (s.allOf ?? []).flatMap((part) => (part.$ref ? required(part.$ref.split("/").pop() as keyof typeof schemas) : [...(part.required ?? [])]));
};

describe("公開 API 的資料", () => {
  it("作品清單、篩 tag、單一作品", () => {
    const all = apiProjects();
    expect(all.length).toBeGreaterThan(5);
    expect(apiProjects("python").every((p) => p.tags.some((t) => t.toLowerCase() === "python"))).toBe(true);
    expect(apiProject("foodlens-advisor")?.sections.length).toBeGreaterThan(0);
    expect(apiProject("不存在")).toBeNull();
  });

  it("文章清單不含全文，單篇有全文", () => {
    const posts = apiPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).not.toHaveProperty("content");
    expect(apiPost(posts[0].slug)?.content.length).toBeGreaterThan(100);
  });

  it("搜尋作品跟文章", () => {
    const r = searchSite("YOLOv8");
    expect(r.projects.some((p) => p.slug === "foodlens-advisor")).toBe(true);
    expect(searchSite("   ")).toEqual({ projects: [], posts: [] });
  });

  it("隱私：任何回應都沒有本名、信箱、日期以外的航班細節", () => {
    const everything = JSON.stringify([apiProfile(), apiProjects(), apiPosts(), apiNow(), apiFlights()]);
    expect(everything).not.toContain("李秉威");
    expect(everything).not.toMatch(/@gmail\.com/);
    expect(JSON.stringify(apiFlights())).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("OpenAPI 規格跟實際回應一致", () => {
  it("每個 schema 的 required 欄位，真的資料都有", () => {
    const samples: [keyof typeof schemas, object][] = [
      ["Project", apiProjects()[0]],
      ["ProjectDetail", apiProject("foodlens-advisor")!],
      ["Post", apiPosts()[0]],
      ["PostFull", apiPost(apiPosts()[0].slug)!],
      ["Profile", apiProfile()],
      ["Now", apiNow()],
      ["Flights", apiFlights()],
    ];
    for (const [name, data] of samples) for (const key of required(name)) expect(data, `${name}.${key}`).toHaveProperty(key);
  });

  it("每個 path 都有 operationId", () => {
    for (const [path, ops] of Object.entries(openapi.paths)) expect((ops as { get: { operationId: string } }).get.operationId, path).toBeTruthy();
  });
});
