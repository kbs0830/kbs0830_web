import { beforeEach, describe, expect, it } from "vitest";
import { PRESENCE_TTL_MS, isPresenceId, leave, presenceCount, resetPresence, touch } from "@/lib/stats/presence";

describe("presence", () => {
  beforeEach(() => resetPresence());

  it("同一個分頁重複回報只算一次，超過 TTL 沒回報就不算", () => {
    touch("tab-aaaaaaaa", 0);
    touch("tab-aaaaaaaa", 30_000);
    touch("tab-bbbbbbbb", 10_000);
    expect(presenceCount(31_000)).toBe(2);
    expect(presenceCount(10_000 + PRESENCE_TTL_MS + 1)).toBe(1);
    expect(presenceCount(30_000 + PRESENCE_TTL_MS + 1)).toBe(0);
  });

  it("離開（關分頁）馬上扣掉", () => {
    touch("tab-aaaaaaaa", 0);
    leave("tab-aaaaaaaa");
    expect(presenceCount(1)).toBe(0);
  });

  it("滿了先清過期的、還是滿就不收新的", () => {
    for (let i = 0; i < 2000; i++) touch(`tab-${String(i).padStart(8, "0")}`, 0);
    touch("tab-newnewnew", 1000);
    expect(presenceCount(1000)).toBe(2000);
    touch("tab-newnewnew", PRESENCE_TTL_MS + 10);
    expect(presenceCount(PRESENCE_TTL_MS + 10)).toBe(1);
  });

  it("分頁代碼格式", () => {
    expect(isPresenceId("3f2b8c1e-9a4d-4f6b-8e2a-1c5d7e9f0a3b")).toBe(true);
    expect(isPresenceId("short")).toBe(false);
    expect(isPresenceId("<script>alert(1)</script>")).toBe(false);
    expect(isPresenceId(123)).toBe(false);
  });
});
