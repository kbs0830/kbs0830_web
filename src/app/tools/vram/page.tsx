import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import VramCalc from "@/components/tools/VramCalc";
import ToolNote from "@/components/tools/ToolNote";

// 2026-11-25（TODO J10）：計算全部在瀏覽器，邏輯在 lib/tools/
export const metadata: Metadata = withShare({
  title: "顯卡跑得動幾 B 模型？本機 LLM 顯存計算機：Q4、Q8、FP16 · VRAM — PINGWEI LI",
  description: "選顯卡顯存（8GB、12GB、24GB）、量化跟 context 長度，估算 Qwen、Llama 7B～70B 需要多少 VRAM：模型權重＋KV cache，跑不跑得動一眼看完。",
  alternates: { canonical: "/tools/vram" },
});

export default function Page() {
  return (
    <PageShell backHref="/tools" backLabel="返回小工具" eyebrow="Tools · VRAM" title={<>我的顯卡跑得動幾 B 模型？</>} intro="選顯存、量化跟 context 長度，估算常見本機模型需要多少顯存。">
      <VramCalc />
      <ToolNote>
        <p>權重＝參數量 × 量化的平均位元數 ÷ 8；KV cache＝2 × 層數 × KV head 數 × head 維度 × context × 2 bytes（FP16）；再加約 0.8 GB 執行環境開銷。架構數字取自各模型公開的 config.json。</p>
        <p>只是估算：llama.cpp、Ollama、vLLM 的開銷不一樣，KV cache 也可以量化。這個站的桌機是 RTX 3070（8 GB），實際跑起來的數字之後會另外整理。</p>
      </ToolNote>
    </PageShell>
  );
}
