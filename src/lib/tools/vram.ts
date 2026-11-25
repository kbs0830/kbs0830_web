// 「我的顯卡跑得動幾 B 模型？」顯存估算（TODO J10，2026-11-25）。全部是公開的架構數字＋簡單公式，瀏覽器端算。
//   模型權重 ≈ 參數量 × 每個參數的位元數 ÷ 8
//   KV cache ≈ 2（K、V）× 層數 × KV head 數 × head 維度 × context 長度 × 每個值的位元組（FP16＝2）
//   再加執行環境的固定開銷（CUDA context、暫存）約 0.8 GB
// 只是估算：不同推論程式（llama.cpp、vLLM、Ollama）的開銷不一樣，實際以跑起來為準。

export interface ModelPreset {
  id: string;
  name: string;
  paramsB: number; // 參數量（十億）
  layers: number;
  kvHeads: number;
  headDim: number;
}

// 架構數字取自各模型公開的 config.json
export const MODEL_PRESETS: ModelPreset[] = [
  { id: "qwen2.5-7b", name: "Qwen2.5 7B", paramsB: 7.6, layers: 28, kvHeads: 4, headDim: 128 },
  { id: "llama3.1-8b", name: "Llama 3.1 8B", paramsB: 8.0, layers: 32, kvHeads: 8, headDim: 128 },
  { id: "mistral-7b", name: "Mistral 7B", paramsB: 7.2, layers: 32, kvHeads: 8, headDim: 128 },
  { id: "qwen2.5-14b", name: "Qwen2.5 14B", paramsB: 14.8, layers: 48, kvHeads: 8, headDim: 128 },
  { id: "qwen2.5-32b", name: "Qwen2.5 32B", paramsB: 32.8, layers: 64, kvHeads: 8, headDim: 128 },
  { id: "llama3.1-70b", name: "Llama 3.1 70B", paramsB: 70.6, layers: 80, kvHeads: 8, headDim: 128 },
];

// GGUF 常見量化的平均位元數（含 scale 等額外資料，不是整數 4／5／8）
export const QUANTS = [
  { id: "q4_k_m", name: "Q4_K_M", bits: 4.85 },
  { id: "q5_k_m", name: "Q5_K_M", bits: 5.69 },
  { id: "q6_k", name: "Q6_K", bits: 6.56 },
  { id: "q8_0", name: "Q8_0", bits: 8.5 },
  { id: "fp16", name: "FP16", bits: 16 },
] as const;

export const RUNTIME_OVERHEAD_GB = 0.8;
const GB = 1024 ** 3;

export function estimateVram(model: ModelPreset, quantBits: number, context: number) {
  const weights = (model.paramsB * 1e9 * quantBits) / 8 / GB;
  const kvCache = (2 * model.layers * model.kvHeads * model.headDim * context * 2) / GB;
  const total = weights + kvCache + RUNTIME_OVERHEAD_GB;
  return { weights, kvCache, overhead: RUNTIME_OVERHEAD_GB, total };
}

/** 夠不夠：留 10% 餘裕才算「夠」，超過顯存但在 1.5 倍內算「要部分放到記憶體（會慢很多）」 */
export function fitVerdict(totalGb: number, vramGb: number): "fits" | "tight" | "offload" | "no" {
  if (totalGb <= vramGb * 0.9) return "fits";
  if (totalGb <= vramGb) return "tight";
  if (totalGb <= vramGb * 1.5) return "offload";
  return "no";
}
