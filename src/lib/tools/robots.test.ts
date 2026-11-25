import { describe, expect, it } from "vitest";
import { isAllowed, parseRobots, verdict } from "@/lib/tools/robots";
import { isPrivateIp, normalizeHost } from "@/lib/tools/safe-fetch";

describe("parseRobots + verdict", () => {
  const txt = [
    "# comment",
    "User-agent: GPTBot",
    "User-agent: CCBot",
    "Disallow: /",
    "",
    "User-agent: ClaudeBot",
    "Disallow: /private/",
    "Allow: /private/ok$",
    "",
    "Sitemap: https://example.com/sitemap.xml",
    "User-agent: *",
    "Disallow:",
  ].join("\n");
  const groups = parseRobots(txt);

  it("連續的 User-agent 是同一組", () => {
    expect(groups[0].agents).toEqual(["gptbot", "ccbot"]);
    expect(verdict(groups, "CCBot")).toEqual({ access: "blocked", via: "specific" });
  });
  it("只擋部分路徑＝partial；名字不分大小寫", () => {
    expect(verdict(groups, "claudebot")).toEqual({ access: "partial", via: "specific" });
  });
  it("沒有專屬的組就用 *；空的 Disallow 等於允許", () => {
    expect(verdict(groups, "PerplexityBot")).toEqual({ access: "allowed", via: "wildcard" });
  });
  it("沒有 robots.txt＝全部允許", () => {
    expect(verdict([], "GPTBot")).toEqual({ access: "allowed", via: "none" });
  });
  it("最長的規則贏、* 跟 $", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /a\nAllow: /a/b\nDisallow: /*.pdf$")[0].rules;
    expect(isAllowed(rules, "/a/x")).toBe(false);
    expect(isAllowed(rules, "/a/b/c")).toBe(true);
    expect(isAllowed(rules, "/doc.pdf")).toBe(false);
    expect(isAllowed(rules, "/doc.pdf?x")).toBe(true);
  });
});

describe("safe-fetch 的檢查", () => {
  it("內網跟保留位址都擋", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.1.1", "172.20.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:192.168.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    // IPv6 包 IPv4 的轉換範圍（NAT64、6to4、Teredo、IPv4-compatible）也要擋，不然 64:ff9b::7f00:1 會連到 127.0.0.1
    for (const ip of ["64:ff9b::7f00:1", "64:ff9b:1::a00:1", "2002:7f00:1::1", "2001:0:4136:e378::1", "::7f00:1", "::ffff:7f00:1", "fec0::1", "100::1", "ff02::1", "192.0.2.1", "198.51.100.7", "240.0.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    expect(isPrivateIp("not-an-ip")).toBe(true);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
  });
  it("網域正規化：去掉 https、路徑；不收 IP、localhost、內網名稱、怪 port", () => {
    expect(normalizeHost("https://Example.com/robots.txt")).toBe("example.com");
    expect(normalizeHost("sub.example.co.jp")).toBe("sub.example.co.jp");
    for (const bad of ["127.0.0.1", "localhost", "printer.local", "x.internal", "example.com:8080", "http://[::1]/", "nodot", ""]) {
      expect(normalizeHost(bad), bad).toBeNull();
    }
  });
});
