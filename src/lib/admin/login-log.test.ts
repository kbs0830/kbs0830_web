import { describe, expect, it } from "vitest";
import { deviceSummary, loginSession } from "@/lib/admin/login-log";

describe("login-log", () => {
  it("Cloudflare 登入用 JWT 的 session；本機、家裡 IP 一天一筆（台灣日期）", () => {
    expect(loginSession({ via: "access", email: "a@b.c", session: "sub:123" })).toBe("access:sub:123");
    const twMidnight = Date.UTC(2026, 10, 25, 16, 30); // 台灣 11/26 00:30
    expect(loginSession({ via: "local" }, twMidnight)).toBe("local:2026-11-26");
    expect(loginSession({ via: "ip", ip: "1.2.3.4" }, twMidnight)).toBe("ip:2026-11-26"); // 不存 IP
  });

  it("裝置只留摘要", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    expect(deviceSummary(ua)).toBe("手機 · iOS · Safari");
  });
});
