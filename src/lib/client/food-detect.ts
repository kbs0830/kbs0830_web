// 食物辨識試玩（FoodLens Advisor 作品頁，2026-11-28）的前後處理：全部是純函式，模型推論在元件裡用 onnxruntime-web 跑。
// 模型：YOLOX-S（Megvii，Apache-2.0，COCO 80 類），輸入 640×640、BGR、0–255 不正規化，輸出 [1, 8400, 85]
// ＝每個 anchor 的 (cx, cy, w, h, objectness, 80 類分數)，座標要用格點＋stride 解碼。

export const SIZE = 640;
const STRIDES = [8, 16, 32] as const;
export const THRESHOLD = 0.35;
const IOU = 0.45;

// COCO 裡跟食物有關的類別（其他如 person、chair 不畫）。中文名給畫面用
export const FOOD_CLASSES: Record<string, string> = {
  banana: "香蕉",
  apple: "蘋果",
  sandwich: "三明治／漢堡",
  orange: "柳橙",
  broccoli: "花椰菜",
  carrot: "紅蘿蔔",
  hot_dog: "熱狗",
  pizza: "披薩",
  donut: "甜甜圈",
  cake: "蛋糕",
};

export const COCO = "person bicycle car motorcycle airplane bus train truck boat traffic_light fire_hydrant stop_sign parking_meter bench bird cat dog horse sheep cow elephant bear zebra giraffe backpack umbrella handbag tie suitcase frisbee skis snowboard sports_ball kite baseball_bat baseball_glove skateboard surfboard tennis_racket bottle wine_glass cup fork knife spoon bowl banana apple sandwich orange broccoli carrot hot_dog pizza donut cake chair couch potted_plant bed dining_table toilet tv laptop mouse remote keyboard cell_phone microwave oven toaster sink refrigerator book clock vase scissors teddy_bear hair_drier toothbrush".split(" ");

export type Box = { x: number; y: number; w: number; h: number; label: string; score: number };

/** 原圖要縮成多大才塞得進 640×640（等比例）；ratio 之後用來把框換回原圖座標 */
export function fit(width: number, height: number) {
  const ratio = Math.min(SIZE / width, SIZE / height);
  return { ratio, nw: Math.max(1, Math.round(width * ratio)), nh: Math.max(1, Math.round(height * ratio)) };
}

/** 把縮好的 RGBA 像素（nw×nh）轉成模型要的 CHW float32（BGR、0–255），右下用灰色 114 補成正方形 */
export function toInput(scaled: Uint8ClampedArray, nw: number, nh: number) {
  const plane = SIZE * SIZE;
  const out = new Float32Array(3 * plane).fill(114);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const s = (y * nw + x) * 4;
      const d = y * SIZE + x;
      out[d] = scaled[s + 2]; // B
      out[plane + d] = scaled[s + 1]; // G
      out[2 * plane + d] = scaled[s]; // R
    }
  }
  return out;
}

/** 解碼 YOLOX 輸出：只留食物類別、分數過門檻，座標換回原圖尺寸，最後做 NMS */
export function decode(output: Float32Array, ratio: number, threshold = THRESHOLD): Box[] {
  const found: Box[] = [];
  let a = 0;
  for (const stride of STRIDES) {
    const n = SIZE / stride;
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++, a++) {
        const o = a * 85;
        const obj = output[o + 4];
        if (obj < threshold) continue;
        let best = -1;
        let bestScore = 0;
        for (let c = 0; c < 80; c++) {
          const s = obj * output[o + 5 + c];
          if (s > bestScore) {
            bestScore = s;
            best = c;
          }
        }
        if (best < 0 || bestScore < threshold || !(COCO[best] in FOOD_CLASSES)) continue;
        const cx = (output[o] + gx) * stride;
        const cy = (output[o + 1] + gy) * stride;
        const w = Math.exp(output[o + 2]) * stride;
        const h = Math.exp(output[o + 3]) * stride;
        found.push({ x: (cx - w / 2) / ratio, y: (cy - h / 2) / ratio, w: w / ratio, h: h / ratio, label: COCO[best], score: bestScore });
      }
    }
  }
  return nms(found);
}

export function iou(a: Box, b: Box) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

/** 同一類別、重疊太多的框只留分數最高的 */
export function nms(boxes: Box[], limit = IOU): Box[] {
  const sorted = boxes.toSorted((p, q) => q.score - p.score);
  const kept: Box[] = [];
  for (const b of sorted) {
    if (kept.every((k) => k.label !== b.label || iou(k, b) < limit)) kept.push(b);
  }
  return kept;
}

/** 每種食物數幾個：給畫面下方的摘要用 */
export function tally(boxes: Box[]): { label: string; zh: string; count: number }[] {
  const m = new Map<string, number>();
  for (const b of boxes) m.set(b.label, (m.get(b.label) ?? 0) + 1);
  return [...m].map(([label, count]) => ({ label, zh: FOOD_CLASSES[label] ?? label, count })).toSorted((a, b) => b.count - a.count);
}
