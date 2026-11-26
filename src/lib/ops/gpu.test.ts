import { describe, expect, it } from "vitest";
import { parseGpu } from "@/lib/ops/gpu";

describe("parseGpu", () => {
  it("nvidia-smi 的 csv 一行 → 數字，名稱拿掉 NVIDIA GeForce 前綴", () => {
    expect(parseGpu("NVIDIA GeForce RTX 3070, 7, 41, 52.18, 2131, 8192\r\n")).toEqual({
      name: "RTX 3070", utilization: 7, tempC: 41, powerW: 52, memUsedMB: 2131, memTotalMB: 8192,
    });
  });
  it("欄位不足或不是數字（例如 [N/A]）→ null", () => {
    expect(parseGpu("")).toBeNull();
    expect(parseGpu("RTX, 1, 2")).toBeNull();
    expect(parseGpu("RTX 3070, 7, 41, [N/A], 2131, 8192")).toBeNull();
  });
});
