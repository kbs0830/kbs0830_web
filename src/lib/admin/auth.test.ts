import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { __resetKeyCache, isAdmin, verifyAccessJwt, type AccessConfig } from "@/lib/admin/auth";

const cfg: AccessConfig = { team: "example", aud: "aud-123", email: "owner@example.com" };
const NOW = 1_800_000_000_000;
let priv: CryptoKey;
let jwk: JsonWebKey;

const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

async function sign(claims: Record<string, unknown>, kid = "k1", key = priv) {
  const head = `${enc({ alg: "RS256", kid })}.${enc(claims)}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head));
  return `${head}.${Buffer.from(sig).toString("base64url")}`;
}

const good = () => ({
  iss: "https://example.cloudflareaccess.com", aud: ["aud-123"], email: "Owner@Example.com",
  exp: NOW / 1000 + 600, nbf: NOW / 1000 - 10,
});

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true, ["sign", "verify"],
  );
  priv = pair.privateKey;
  jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" } as JsonWebKey;
});

function mockCerts() {
  const f = vi.fn(async () => new Response(JSON.stringify({ keys: [jwk] })));
  vi.stubGlobal("fetch", f);
  return f;
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); __resetKeyCache(); });

describe("verifyAccessJwt", () => {
  it("簽章、iss、aud、exp、email 都對才過（email 不分大小寫）", async () => {
    mockCerts();
    expect(await verifyAccessJwt(await sign(good()), cfg, NOW)).toBe(true);
  });

  it.each([
    ["aud 不對", { aud: ["other"] }],
    ["iss 不對", { iss: "https://evil.cloudflareaccess.com" }],
    ["過期", { exp: NOW / 1000 - 1 }],
    ["別人的 email", { email: "someone@example.com" }],
  ])("%s → false", async (_, patch) => {
    mockCerts();
    expect(await verifyAccessJwt(await sign({ ...good(), ...patch }), cfg, NOW)).toBe(false);
  });

  it("竄改內容、別把金鑰簽的、亂碼 → false", async () => {
    mockCerts();
    const t = await sign(good());
    const [h, , s] = t.split(".");
    expect(await verifyAccessJwt(`${h}.${enc({ ...good(), email: "x@y.z" })}.${s}`, cfg, NOW)).toBe(false);
    const other = await crypto.subtle.generateKey(
      { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      false, ["sign"],
    );
    expect(await verifyAccessJwt(await sign(good(), "k1", other.privateKey), cfg, NOW)).toBe(false);
    expect(await verifyAccessJwt("not.a.jwt", cfg, NOW)).toBe(false);
  });

  it("公鑰抓不到 → false（不丟例外）", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    expect(await verifyAccessJwt(await sign(good()), cfg, NOW)).toBe(false);
  });

  it("公鑰快取：連續驗兩次只抓一次", async () => {
    const f = mockCerts();
    await verifyAccessJwt(await sign(good()), cfg, NOW);
    await verifyAccessJwt(await sign(good()), cfg, NOW + 1000);
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe("isAdmin", () => {
  const ext = (extra: Record<string, string> = {}) => new Headers({ "cf-connecting-ip": "203.0.113.1", ...extra });

  it("本機（沒有 Cloudflare 標頭）放行", async () => {
    expect(await isAdmin(new Headers())).toBe(true);
  });

  it("外部沒帶 JWT、或 env 沒設 → 擋", async () => {
    expect(await isAdmin(ext())).toBe(false);
    mockCerts();
    expect(await isAdmin(ext({ "cf-access-jwt-assertion": await sign({ ...good(), exp: Date.now() / 1000 + 600 }) }))).toBe(false);
  });

  it("外部帶有效 JWT 且 env 有設 → 放行", async () => {
    vi.stubEnv("CF_ACCESS_TEAM", cfg.team);
    vi.stubEnv("CF_ACCESS_AUD", cfg.aud);
    vi.stubEnv("ADMIN_EMAIL", cfg.email);
    mockCerts();
    const token = await sign({ ...good(), exp: Date.now() / 1000 + 600, nbf: Date.now() / 1000 - 10 });
    expect(await isAdmin(ext({ "cf-access-jwt-assertion": token }))).toBe(true);
  });
});
