import { describe, expect, it } from "vitest";
import { regionName } from "@/lib/format";

describe("regionName", () => {
  it("正常國碼轉中文", () => {
    expect(regionName("TW")).toBe("台灣");
  });
  it("格式不對不會丟錯，回原字串", () => {
    for (const bad of ["T1", "tw", "TWN", "", "<script>"]) expect(regionName(bad)).toBe(bad);
  });
});
