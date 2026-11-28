import { describe, expect, it } from "vitest";
import { COCO, SIZE, decode, fit, iou, nms, tally, toInput } from "./food-detect";

describe("fit／toInput", () => {
  it("等比例縮到 640 內，補 114 灰、通道順序是 BGR", () => {
    expect(fit(1280, 640)).toMatchObject({ ratio: 0.5, nw: 640, nh: 320 });
    const rgba = new Uint8ClampedArray([10, 20, 30, 255]); // 1 個像素：R10 G20 B30
    const input = toInput(rgba, 1, 1);
    const plane = SIZE * SIZE;
    expect([input[0], input[plane], input[2 * plane]]).toEqual([30, 20, 10]);
    expect(input[1]).toBe(114);
  });
});

describe("decode", () => {
  const out = () => new Float32Array(8400 * 85);
  const put = (o: Float32Array, anchor: number, cls: string, score: number, wh = Math.log(4)) => {
    const b = anchor * 85;
    o[b + 2] = wh; // exp(log 4) × stride
    o[b + 3] = wh;
    o[b + 4] = score;
    o[b + 5 + COCO.indexOf(cls)] = 1;
  };

  it("格點＋stride 解碼、換回原圖座標；非食物類別（person）不留", () => {
    const o = out();
    put(o, 0, "pizza", 0.9); // 第一個 anchor：stride 8、格點 (0,0) → 中心 (0,0)，寬高 32
    put(o, 1, "person", 0.95);
    const got = decode(o, 0.5);
    expect(got).toHaveLength(1);
    expect(got[0].label).toBe("pizza");
    expect([got[0].w, got[0].h, got[0].x, got[0].y].map((n) => Math.round(n))).toEqual([64, 64, -32, -32]);
  });

  it("分數低於門檻不留", () => {
    const o = out();
    put(o, 0, "donut", 0.2);
    expect(decode(o, 1)).toEqual([]);
  });
});

describe("nms／tally", () => {
  const b = (x: number, label: string, score: number) => ({ x, y: 0, w: 10, h: 10, label, score });
  it("同類別重疊只留高分；不同類別都留", () => {
    expect(iou(b(0, "a", 1), b(0, "a", 1))).toBe(1);
    const kept = nms([b(0, "apple", 0.6), b(1, "apple", 0.9), b(0, "orange", 0.5), b(50, "apple", 0.7)]);
    expect(kept.map((k) => [k.label, k.score])).toEqual([["apple", 0.9], ["apple", 0.7], ["orange", 0.5]]);
  });
  it("tally 依數量排序並附中文", () => {
    expect(tally([b(0, "pizza", 1), b(20, "donut", 1), b(40, "donut", 1)])).toEqual([
      { label: "donut", zh: "甜甜圈", count: 2 },
      { label: "pizza", zh: "披薩", count: 1 },
    ]);
  });
});
