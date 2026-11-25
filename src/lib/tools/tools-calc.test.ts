import { describe, expect, it } from "vitest";
import { MODEL_PRESETS, estimateVram, fitVerdict } from "@/lib/tools/vram";
import { breakEvenMonths, powerCost } from "@/lib/tools/power-cost";
import { TW_TO_JP, toJapaneseKanji } from "@/lib/tools/kanji-jp";

describe("vram", () => {
  const llama8b = MODEL_PRESETS.find((m) => m.id === "llama3.1-8b")!;
  it("Llama 3.1 8B 的 KV cache：每個 token 128 KB，8K context ≈ 1 GB", () => {
    expect(estimateVram(llama8b, 16, 8192).kvCache).toBeCloseTo(1, 5);
  });
  it("FP16 權重 ≈ 參數量 × 2 bytes", () => {
    expect(estimateVram(llama8b, 16, 0).weights).toBeCloseTo((8e9 * 2) / 1024 ** 3, 5);
  });
  it("判斷夠不夠", () => {
    expect(fitVerdict(6, 8)).toBe("fits");
    expect(fitVerdict(7.8, 8)).toBe("tight");
    expect(fitVerdict(10, 8)).toBe("offload");
    expect(fitVerdict(20, 8)).toBe("no");
  });
});

describe("power-cost", () => {
  it("100W 整天開、每度 3 元：一個月 72 度、216 元", () => {
    const r = powerCost(100, 24, 3)!;
    expect(r.kwhPerMonth).toBeCloseTo(72);
    expect(r.perMonth).toBeCloseTo(216);
    expect(r.perYear).toBeCloseTo(2592);
  });
  it("輸入不合理回 null", () => {
    expect(powerCost(0, 24, 3)).toBeNull();
  });
  it("回本月數", () => {
    expect(breakEvenMonths(0, 200, 300)).toBe(0);
    expect(breakEvenMonths(1000, 200, 300)).toBe(10);
    expect(breakEvenMonths(1000, 300, 300)).toBeNull();
  });
});

describe("kanji-jp", () => {
  it("表格兩兩成對、沒有空白或重複對到自己", () => {
    for (const [tw, jp] of TW_TO_JP) {
      expect(tw).not.toBe(jp);
      expect(/\s/.test(tw + jp)).toBe(false);
    }
    expect(TW_TO_JP.size).toBeGreaterThan(200);
  });
  it("學習發展 → 学習発展，標出換掉的字", () => {
    const r = toJapaneseKanji("學習發展");
    expect(r.map((x) => x.jp).join("")).toBe("学習発展");
    expect(r.filter((x) => x.changed).map((x) => x.ch)).toEqual(["學", "發"]);
  });
  it("常見字抽查", () => {
    expect(toJapaneseKanji("國際機場").map((x) => x.jp).join("")).toBe("国際機場");
    expect(toJapaneseKanji("鐵道車站").map((x) => x.jp).join("")).toBe("鉄道車站");
    expect(toJapaneseKanji("說明").map((x) => x.jp).join("")).toBe("説明");
  });
});
