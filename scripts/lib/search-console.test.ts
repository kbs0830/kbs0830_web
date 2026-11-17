import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { pickSite, signJwt, summarizeInspections, totals, weekRanges } from "./search-console.js";

describe("signJwt", () => {
  it("用服務帳號私鑰簽出驗得過的 RS256 JWT，scope 只有唯讀", () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    const key = {
      client_email: "test@example.iam.gserviceaccount.com",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    };
    const jwt = signJwt(key, 1_700_000_000);
    const [h, c, s] = jwt.split(".");
    expect(crypto.verify("RSA-SHA256", Buffer.from(`${h}.${c}`), publicKey, Buffer.from(s, "base64url"))).toBe(true);
    const claim = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claim).toMatchObject({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
  });
});

describe("pickSite", () => {
  it("網域資源優先，其次網址前置字元；沒驗證的不算", () => {
    expect(
      pickSite([
        { siteUrl: "https://kbs0830.com/", permissionLevel: "siteFullUser" },
        { siteUrl: "sc-domain:kbs0830.com", permissionLevel: "siteRestrictedUser" },
      ]),
    ).toBe("sc-domain:kbs0830.com");
    expect(pickSite([{ siteUrl: "https://kbs0830.com/", permissionLevel: "siteOwner" }])).toBe("https://kbs0830.com/");
    expect(pickSite([{ siteUrl: "sc-domain:kbs0830.com", permissionLevel: "siteUnverifiedUser" }])).toBeNull();
    expect(pickSite([{ siteUrl: "https://example.com/", permissionLevel: "siteOwner" }])).toBeNull();
    expect(pickSite(undefined)).toBeNull();
  });
});

describe("weekRanges", () => {
  it("本週＝3 天前往回 7 天，前一週緊接在前面、不重疊", () => {
    const w = weekRanges(new Date("2026-11-16T01:00:00Z"));
    expect(w.cur).toEqual({ startDate: "2026-11-07", endDate: "2026-11-13" });
    expect(w.prev).toEqual({ startDate: "2026-10-31", endDate: "2026-11-06" });
  });
  it("跨月、跨年都對", () => {
    expect(weekRanges(new Date("2027-01-02T00:00:00Z")).cur).toEqual({ startDate: "2026-12-24", endDate: "2026-12-30" });
  });
});

describe("totals", () => {
  it("沒有資料（新站常見）時是 0，不是 undefined", () => {
    expect(totals({})).toEqual({ clicks: 0, impressions: 0, ctr: 0, position: 0 });
    expect(totals({ rows: [{ clicks: 3, impressions: 40, ctr: 0.075, position: 8.2 }] }).impressions).toBe(40);
  });
});

describe("summarizeInspections", () => {
  it("數已收錄的、各狀態翻成中文、列出沒收錄的路徑", () => {
    const r = summarizeInspections([
      { url: "https://kbs0830.com/", verdict: "PASS", coverageState: "Submitted and indexed" },
      { url: "https://kbs0830.com/blog", verdict: "PASS", coverageState: "Submitted and indexed" },
      { url: "https://kbs0830.com/stats", verdict: "NEUTRAL", coverageState: "Crawled - currently not indexed" },
      { url: "https://kbs0830.com/uses", verdict: "NEUTRAL", coverageState: "Some new state" },
      { url: "https://kbs0830.com/now", error: "429 quota" },
    ]);
    expect(r.total).toBe(5);
    expect(r.indexed).toBe(2);
    expect(r.states).toEqual({
      已提交並建立索引: 2,
      "已檢索 - 尚未建立索引": 1,
      "Some new state": 1,
      查詢失敗: 1,
    });
    expect(r.notIndexed).toEqual(["/stats", "/uses", "/now"]);
  });
});
