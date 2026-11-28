"use client";

import { useRef, useState } from "react";
import { FOOD_CLASSES, SIZE, decode, fit, tally, toInput, type Box } from "@/lib/client/food-detect";

// FoodLens Advisor 作品頁的「在你的瀏覽器裡試試看」（2026-11-28）：照片留在這個分頁，用 ONNX Runtime Web（WASM）跑 YOLOX-S。
// ⚠️ 這不是作品原本的模型：原本的 46 類中亞料理模型（milliy-taomlar）公開版只是測試版（212 張訓練圖、mAP50 29.7%），
//    實測 4 張中亞料理照片幾乎一個框都畫不出來，所以這裡用通用的 COCO 模型（只留食物類別）。頁面上照實說明。
// 模型 36 MB 要等訪客按「試試看」才下載（之後走瀏覽器快取）；執行檔放在 /vendor/ort（不加 npm 依賴）。

const MODEL_URL = "/models/food/yolox_s.onnx";
const ORT_URL = "/vendor/ort/ort.wasm.min.mjs";

const SAMPLES = [
  { file: "pizza.jpg", label: "披薩" },
  { file: "donuts.jpg", label: "甜甜圈" },
  { file: "fruit.jpg", label: "水果" },
  { file: "vegetables.jpg", label: "蔬菜" },
  { file: "burger.jpg", label: "漢堡" },
];

// onnxruntime-web 只用到這幾個介面，自己宣告（執行檔是 vendor 進來的，沒有 npm 型別）
type OrtTensor = { data: Float32Array };
type OrtSession = { run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensor>> };
type Ort = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: "float32", data: Float32Array, dims: number[]) => unknown;
  InferenceSession: { create(model: Uint8Array, opts?: object): Promise<OrtSession> };
};

type Phase = { name: "idle" } | { name: "loading"; pct: number | null } | { name: "ready" } | { name: "error"; msg: string };

async function loadModel(onProgress: (pct: number | null) => void): Promise<{ ort: Ort; session: OrtSession }> {
  const ort = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ ORT_URL)) as Ort;
  ort.env.wasm.wasmPaths = "/vendor/ort/";
  ort.env.wasm.numThreads = 1; // 多執行緒要 cross-origin isolation，這個網站沒開
  const res = await fetch(MODEL_URL);
  if (!res.ok || !res.body) throw new Error(`模型下載失敗（HTTP ${res.status}）`);
  const total = Number(res.headers.get("content-length")) || 0;
  const chunks: Uint8Array[] = [];
  let got = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(total ? Math.min(99, Math.round((got / total) * 100)) : null);
  }
  const bytes = new Uint8Array(got);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.length;
  }
  const session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
  return { ort, session };
}

// 一次辨識：縮圖 → 推論 → 解碼（放在元件外：計時用的 performance.now 不能在元件裡呼叫）
async function runDetect(eng: { ort: Ort; session: OrtSession }, source: Blob) {
  const bmp = await createImageBitmap(source);
  const { ratio, nw, nh } = fit(bmp.width, bmp.height);
  const small = document.createElement("canvas");
  small.width = nw;
  small.height = nh;
  const sctx = small.getContext("2d", { willReadFrequently: true })!;
  sctx.drawImage(bmp, 0, 0, nw, nh);
  const input = toInput(sctx.getImageData(0, 0, nw, nh).data, nw, nh);
  const t0 = performance.now();
  const out = await eng.session.run({ images: new eng.ort.Tensor("float32", input, [1, 3, SIZE, SIZE]) });
  const found = decode(out[Object.keys(out)[0]].data, ratio);
  return { bmp, found, ms: Math.round(performance.now() - t0) };
}

export default function FoodDetectDemo() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [boxes, setBoxes] = useState<Box[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [ms, setMs] = useState<number | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<{ ort: Ort; session: OrtSession } | null>(null);

  async function start() {
    setPhase({ name: "loading", pct: 0 });
    try {
      engine.current = await loadModel((pct) => setPhase({ name: "loading", pct }));
      setPhase({ name: "ready" });
    } catch (e) {
      setPhase({ name: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  async function detect(source: Blob) {
    const eng = engine.current;
    const cv = canvas.current;
    if (!eng || !cv) return;
    setBusy(true);
    try {
      const { bmp, found, ms: took } = await runDetect(eng, source);
      setMs(took);
      setBoxes(found);
      draw(cv, bmp, found);
    } catch (e) {
      setPhase({ name: "error", msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function sample(file: string) {
    const res = await fetch(`/image/food-demo/${file}`);
    await detect(await res.blob());
  }

  return (
    <section className="mt-12" aria-busy={busy}>
      <p className="text-xs tracking-[0.2em] text-(--accent) uppercase font-mono mb-4">
        在你的瀏覽器裡試試看 <span className="text-(--muted) normal-case tracking-normal">· Try it in your browser</span>
      </p>
      <p className="text-sm font-light text-(--text) leading-relaxed">
        選一張照片，辨識在<strong className="font-normal">你的瀏覽器裡</strong>跑，照片不會上傳到任何地方。
      </p>

      {phase.name === "idle" && (
        <button type="button" onClick={start} className="mt-4 px-4 py-2 text-sm border border-(--accent) text-(--accent) rounded-full hover:bg-(--accent-light) transition-colors">
          試試看（下載模型 36 MB）
        </button>
      )}
      {phase.name === "loading" && (
        <p className="mt-4 text-sm text-(--muted) font-light" role="status">
          下載並載入模型…{phase.pct !== null && ` ${phase.pct}%`}
        </p>
      )}
      {phase.name === "error" && (
        <p className="mt-4 text-sm text-(--warn)" role="alert">
          無法執行：{phase.msg}（可能是這個瀏覽器不支援 WebAssembly，或記憶體不足）
        </p>
      )}

      {phase.name === "ready" && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.file}
                type="button"
                disabled={busy}
                onClick={() => sample(s.file)}
                className="px-3 py-1.5 text-xs border border-(--border) rounded-full text-(--text) hover:border-(--accent) disabled:opacity-50 transition-colors"
              >
                {s.label}
              </button>
            ))}
            <label className="px-3 py-1.5 text-xs border border-(--accent) text-(--accent) rounded-full cursor-pointer hover:bg-(--accent-light) transition-colors">
              選自己的照片
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) detect(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <canvas ref={canvas} className={`mt-4 w-full h-auto border border-(--border) bg-(--surface) ${boxes ? "" : "hidden"}`} role="img" aria-label="辨識結果：照片上標出辨識到的食物" />
          {boxes && (
            <p className="mt-3 text-sm font-light text-(--text)" role="status">
              {boxes.length === 0
                ? "沒有辨識到食物。這個模型只認得 10 種：香蕉、蘋果、柳橙、花椰菜、紅蘿蔔、三明治／漢堡、熱狗、披薩、甜甜圈、蛋糕。"
                : tally(boxes)
                    .map((t) => `${t.zh} ×${t.count}`)
                    .join("、")}
              {ms !== null && <span className="text-xs text-(--muted) font-mono"> · {ms} ms</span>}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 text-xs text-(--muted) font-light leading-relaxed space-y-2">
        <p>
          <strong className="font-normal text-(--text)">這不是作品裡的模型。</strong>
          作品用的是 46 類中亞料理的 YOLOv8，但公開版只是測試版（212 張訓練圖、mAP50 29.7%）。我拿 4 張中亞料理照片實測，用門檻 0.25 一個框都畫不出來，所以這個試玩改用通用的
          YOLOX-S（COCO 80 類，只顯示其中 10 種食物），同樣是 ONNX Runtime Web 在瀏覽器跑。只認得這 10 種，台灣小吃、整桌菜大多認不出來；水果、蔬菜、披薩、甜甜圈這類最準。
        </p>
        <p>
          模型：YOLOX（Megvii，Apache-2.0）、ONNX Runtime Web（MIT）。作品原模型：
          <a className="underline underline-offset-4" href="https://huggingface.co/UzDataLab/milliy-taomlar-detector" target="_blank" rel="noopener noreferrer">
            UzDataLab Milliy Taomlar Detector
          </a>
          （CC BY 4.0）。
        </p>
        <details>
          <summary className="cursor-pointer">示範照片出處</summary>
          <ul className="mt-2 space-y-1 font-mono text-[11px]">
            <li>披薩：Shisma，CC BY 4.0（Wikimedia Commons，Margherita pizza on plate）</li>
            <li>甜甜圈：Liz DeCoster，CC BY 2.0（Box of Duck Donuts 1）</li>
            <li>水果：Yosarian，CC BY-SA 3.0（Fruit bowl）</li>
            <li>蔬菜：Tomwsulcer，CC0（Vegetable platter including carrots broccoli cauliflower）</li>
            <li>漢堡：عمرو，CC BY-SA 4.0（Hamburger with beef bacon）</li>
          </ul>
        </details>
        <p>可辨識：{Object.values(FOOD_CLASSES).join("、")}。</p>
      </div>
    </section>
  );
}

// 把照片縮到最寬 960 畫在 canvas 上，再疊辨識框
function draw(cv: HTMLCanvasElement, bmp: ImageBitmap, boxes: Box[]) {
  const k = Math.min(1, 960 / bmp.width);
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2d5a8e";
  ctx.lineWidth = 2;
  ctx.strokeStyle = accent;
  ctx.font = "13px ui-monospace, monospace";
  for (const b of boxes) {
    const x = b.x * k;
    const y = b.y * k;
    ctx.strokeRect(x, y, b.w * k, b.h * k);
    const text = `${FOOD_CLASSES[b.label]} ${Math.round(b.score * 100)}%`;
    const tw = ctx.measureText(text).width + 8;
    const ty = Math.max(0, y - 18);
    ctx.fillStyle = accent;
    ctx.fillRect(x, ty, tw, 18);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x + 4, ty + 13);
  }
}
