import { afterEach, describe, expect, it, vi } from "vitest";
import { KEEP_ON, __resetSessionCache, getSessionDuration, setSessionDuration } from "@/lib/admin/cf-access";

const app = {
  id: "app1", aud: "aud-123", name: "kbs0830 站長後台", type: "self_hosted", domain: "kbs0830.com/admin",
  destinations: [{ type: "public", uri: "kbs0830.com/admin" }], session_duration: "168h",
  allowed_idps: ["g", "otp"], auto_redirect_to_identity: false, app_launcher_visible: false,
  policies: [{ id: "p1", precedence: 1, name: "只放行站長" }],
};

function mockCf() {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const result = url.includes("/zones") ? [{ account: { id: "acc" } }]
      : init?.method === "PUT" ? { ...app, session_duration: (JSON.parse(String(init.body)) as { session_duration: string }).session_duration }
      : [app, { ...app, id: "other", aud: "zzz" }];
    return new Response(JSON.stringify({ success: true, result }));
  }));
  return calls;
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); __resetSessionCache(); });

describe("cf-access（維持登入）", () => {
  it("用 CF_ACCESS_AUD 找到後台的 app，讀登入有效期", async () => {
    vi.stubEnv("CLOUDFLARE_CONFIG_TOKEN", "t");
    vi.stubEnv("CF_ACCESS_AUD", "aud-123");
    mockCf();
    expect(await getSessionDuration()).toBe("168h");
  });

  it("改有效期：原本的登入方式、規則、網址原樣送回，只換 session_duration", async () => {
    vi.stubEnv("CLOUDFLARE_CONFIG_TOKEN", "t");
    vi.stubEnv("CF_ACCESS_AUD", "aud-123");
    const calls = mockCf();
    expect(await setSessionDuration(KEEP_ON)).toBe("720h");
    const put = calls.find((c) => c.method === "PUT")!;
    expect(put.url).toContain("/access/apps/app1");
    expect(put.body).toMatchObject({
      session_duration: "720h", allowed_idps: ["g", "otp"], auto_redirect_to_identity: false,
      destinations: app.destinations, policies: [{ id: "p1", precedence: 1 }],
    });
  });

  it("沒有金鑰 → 丟錯（API 回 502，不會亂改）", async () => {
    vi.stubEnv("CLOUDFLARE_CONFIG_TOKEN", "");
    vi.stubEnv("CF_ACCESS_AUD", "aud-123");
    await expect(getSessionDuration()).rejects.toThrow("CLOUDFLARE_CONFIG_TOKEN");
  });
});
