import { describe, expect, it } from "vitest";
import { analyzeCsp, EXAMPLE } from "@/lib/tools/csp";

const sev = (csp: string, s: string, directive?: string) =>
  analyzeCsp(csp).findings.some((f) => f.severity === s && (!directive || f.directive === directive));

describe("analyzeCsp", () => {
  it("拆指令、認得 header 名稱前綴與 Report-Only", () => {
    const r = analyzeCsp("Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data:");
    expect(r.reportOnly).toBe(true);
    expect(r.directives.map((d) => d.name)).toEqual(["default-src", "img-src"]);
    expect(r.directives[1].values).toEqual(["'self'", "data:"]);
  });

  it("<meta> 標籤裡的 content 也能貼", () => {
    const r = analyzeCsp(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'">`);
    expect(r.directives.map((d) => d.name)).toEqual(["default-src", "object-src"]);
  });

  it("script-src 'unsafe-inline' ＝ high；有 nonce 就降成 info", () => {
    expect(sev("script-src 'self' 'unsafe-inline'", "high", "script-src")).toBe(true);
    const withNonce = analyzeCsp("script-src 'nonce-abc' 'strict-dynamic' 'unsafe-inline'");
    expect(withNonce.findings.some((f) => f.severity === "high" && f.directive === "script-src")).toBe(false);
    expect(withNonce.findings.some((f) => f.severity === "good")).toBe(true);
  });

  it("style-src 'unsafe-inline' 只是 low", () => {
    expect(sev("default-src 'self'; style-src 'unsafe-inline'", "low", "style-src")).toBe(true);
    expect(sev("default-src 'self'; style-src 'unsafe-inline'", "high", "style-src")).toBe(false);
  });

  it("unsafe-eval、script-src 的 *、https:、data:、公共 CDN", () => {
    expect(sev("script-src 'unsafe-eval'", "high")).toBe(true);
    expect(sev("script-src *", "high", "script-src")).toBe(true);
    expect(sev("script-src https:", "high", "script-src")).toBe(true);
    expect(sev("script-src data:", "high", "script-src")).toBe(true);
    expect(sev("script-src https://cdn.jsdelivr.net", "medium", "script-src")).toBe(true);
    expect(sev("script-src 'self' https://cdn.jsdelivr.net/npm/foo/", "medium", "script-src")).toBe(false);
  });

  it("img-src 的 data: https: 不算風險", () => {
    const r = analyzeCsp("default-src 'self'; img-src 'self' data: https:");
    expect(r.findings.some((f) => f.directive === "img-src" && f.severity !== "info")).toBe(false);
  });

  it("缺少指令：沒有 default-src／script-src ＝ high；少 base-uri、object-src、frame-ancestors、form-action", () => {
    expect(sev("img-src 'self'", "high")).toBe(true);
    const r = analyzeCsp("default-src 'self'");
    for (const d of ["base-uri", "object-src", "frame-ancestors", "form-action"]) expect(r.findings.some((f) => f.directive === d)).toBe(true);
  });

  it("object-src 'none' 是 good；default-src 'none' 也算擋住 object", () => {
    expect(sev("default-src 'self'; object-src 'none'", "good", "object-src")).toBe(true);
    expect(sev("default-src 'none'", "medium", "object-src")).toBe(false);
  });

  it("重複的指令、不認得的指令、已棄用的指令", () => {
    const r = analyzeCsp("default-src 'self'; script-src 'self'; script-src 'none'; scripts-src 'self'; block-all-mixed-content");
    expect(r.directives.some((d) => d.name === "script-src" && d.duplicate)).toBe(true);
    expect(r.findings.some((f) => /寫了不只一次/.test(f.text))).toBe(true);
    expect(r.findings.some((f) => /不認得的指令/.test(f.text))).toBe(true);
    expect(r.findings.some((f) => /已棄用/.test(f.text))).toBe(true);
  });

  it("strict-dynamic 沒有 nonce／hash ＝ medium", () => {
    expect(sev("script-src 'self' 'strict-dynamic'", "medium", "script-src")).toBe(true);
  });

  it("空字串", () => {
    expect(analyzeCsp("  ").empty).toBe(true);
  });

  it("預設範例至少有一個 high", () => {
    expect(sev(EXAMPLE, "high")).toBe(true);
  });
});
