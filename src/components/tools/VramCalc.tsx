"use client";

import { useState } from "react";
import { MODEL_PRESETS, QUANTS, estimateVram, fitVerdict } from "@/lib/tools/vram";

// 顯存估算（TODO J10）。全部在瀏覽器算，不送資料
const VRAMS = [6, 8, 12, 16, 24];
const CONTEXTS = [2048, 4096, 8192, 16384, 32768];
const VERDICT = {
  fits: { text: "跑得動", warn: false },
  tight: { text: "剛好塞得下（context 再長就不夠）", warn: false },
  offload: { text: "塞不下，要分一部分到記憶體（會慢很多）", warn: true },
  no: { text: "跑不動", warn: true },
} as const;

export default function VramCalc() {
  const [vram, setVram] = useState(8);
  const [quant, setQuant] = useState<string>("q4_k_m");
  const [ctx, setCtx] = useState(8192);
  const bits = QUANTS.find((q) => q.id === quant)!.bits;
  const seg = (on: boolean) =>
    `px-3 py-1.5 text-xs font-mono border -ml-px first:ml-0 first:rounded-l-sm last:rounded-r-sm transition-colors ${on ? "border-(--accent) text-(--accent) relative" : "border-(--border) text-(--muted) hover:text-(--accent)"}`;
  const group = <T,>(label: string, items: readonly T[], cur: T, set: (v: T) => void, show: (v: T) => string) => (
    <fieldset>
      <legend className="text-[11px] text-(--muted) font-mono tracking-wide mb-2">{label}</legend>
      <div className="flex flex-wrap">
        {items.map((v) => (
          <button key={String(v)} type="button" aria-pressed={v === cur} className={seg(v === cur)} onClick={() => set(v)}>
            {show(v)}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="space-y-6">
      {group("顯卡顯存", VRAMS, vram, setVram, (v) => `${v} GB`)}
      {group("量化", QUANTS.map((q) => q.id), quant, setQuant, (id) => QUANTS.find((q) => q.id === id)!.name)}
      {group("Context 長度", CONTEXTS, ctx, setCtx, (v) => `${v / 1024}K`)}

      <table className="w-full text-sm font-light mt-8">
        <thead>
          <tr className="text-left text-[11px] text-(--muted) font-mono tracking-wide border-b border-(--border)">
            <th className="py-2 font-normal">模型</th>
            <th className="py-2 font-normal text-right">權重 GB</th>
            <th className="py-2 font-normal text-right">KV cache</th>
            <th className="py-2 font-normal text-right">合計</th>
            <th className="py-2 font-normal pl-4">結果</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border)">
          {MODEL_PRESETS.map((m) => {
            const e = estimateVram(m, bits, ctx);
            const v = VERDICT[fitVerdict(e.total, vram)];
            return (
              <tr key={m.id}>
                <td className="py-2.5">{m.name}</td>
                <td className="py-2.5 text-right font-mono text-xs">{e.weights.toFixed(1)}</td>
                <td className="py-2.5 text-right font-mono text-xs">{e.kvCache.toFixed(1)}</td>
                <td className="py-2.5 text-right font-mono text-xs">{e.total.toFixed(1)}</td>
                <td className={`py-2.5 pl-4 text-[13px] ${v.warn ? "text-(--warn)" : "text-(--text)"}`}>{v.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
