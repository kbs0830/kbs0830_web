"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useJson } from "@/lib/hooks";
import type { JpyRate } from "@/lib/jpy-rate";

// 日本消費稅換算（TODO J6，2026-11-24）。全部在瀏覽器算；台幣換算用 /api/jpy-rate 最低的現金賣出（讀不到就不顯示台幣）。
// 稅額的小數一律無條件捨去（日本店家最常見的做法，實際看店家）。

export type TaxMode = "excl" | "incl"; // 標價是「税抜」未稅 or「税込」含稅
export type TaxRate = 10 | 8; // 8% 是外帶食品、飲料（軽減税率）

export function splitTax(price: number, mode: TaxMode, rate: TaxRate) {
  if (!(price > 0)) return null;
  if (mode === "excl") {
    const tax = Math.floor((price * rate) / 100);
    return { excl: price, tax, incl: price + tax };
  }
  const excl = Math.ceil((price * 100) / (100 + rate));
  return { excl, tax: price - excl, incl: price };
}

const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;
const pick = <T extends string | number>(v: string | null, ok: readonly T[], d: T): T => (ok.find((x) => String(x) === v) ?? d);

export default function JapanTax() {
  const params = useSearchParams();
  const [price, setPrice] = useState(() => params.get("yen")?.replace(/[^\d]/g, "") || "1000");
  const [mode, setMode] = useState<TaxMode>(() => pick(params.get("mode"), ["excl", "incl"] as const, "excl"));
  const [rate, setRate] = useState<TaxRate>(() => pick(params.get("rate"), [10, 8] as const, 10));
  // 台幣換算：各銀行最低的現金賣出；讀不到就不顯示台幣
  const jpy = useJson<JpyRate>("/api/jpy-rate");
  const sells = jpy && jpy !== "error" ? jpy.banks.map((b) => b.cashSell).filter((x): x is number => x != null) : [];
  const twdPerYen = sells.length ? Math.min(...sells) : null;

  const sync = (p: string, m: TaxMode, r: TaxRate) => {
    setPrice(p);
    setMode(m);
    setRate(r);
    history.replaceState(null, "", `?yen=${p}&mode=${m}&rate=${r}`);
  };

  const result = splitTax(Number(price), mode, rate);
  const seg = (on: boolean) =>
    `px-3 py-1.5 text-xs font-mono border transition-colors ${on ? "border-(--accent) text-(--accent)" : "border-(--border) text-(--muted) hover:text-(--accent)"}`;

  return (
    <div className="min-h-[360px]">
      <div className="flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
          標價（日圓）
          <input
            inputMode="numeric"
            value={price}
            onChange={(e) => sync(e.target.value.replace(/[^\d]/g, "").slice(0, 9), mode, rate)}
            className="w-40 bg-transparent border border-(--border) rounded-sm px-3 py-2 text-lg text-(--text) font-mono focus:outline-none focus:border-(--accent)"
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[11px] text-(--muted) font-mono tracking-wide mb-2">標價是</legend>
          <div className="flex">
            <button type="button" aria-pressed={mode === "excl"} className={`${seg(mode === "excl")} rounded-l-sm`} onClick={() => sync(price, "excl", rate)}>
              未稅（税抜）
            </button>
            <button type="button" aria-pressed={mode === "incl"} className={`${seg(mode === "incl")} rounded-r-sm -ml-px`} onClick={() => sync(price, "incl", rate)}>
              含稅（税込）
            </button>
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[11px] text-(--muted) font-mono tracking-wide mb-2">稅率</legend>
          <div className="flex">
            <button type="button" aria-pressed={rate === 10} className={`${seg(rate === 10)} rounded-l-sm`} onClick={() => sync(price, mode, 10)}>
              10%
            </button>
            <button type="button" aria-pressed={rate === 8} className={`${seg(rate === 8)} rounded-r-sm -ml-px`} onClick={() => sync(price, mode, 8)}>
              8%（外帶食品）
            </button>
          </div>
        </fieldset>
      </div>

      <div className="mt-10" aria-live="polite">
        {result ? (
          <dl className="grid grid-cols-3 gap-6">
            {(
              [
                ["含稅（要付的錢）", result.incl],
                ["未稅", result.excl],
                [`消費稅 ${rate}%`, result.tax],
              ] as const
            ).map(([term, v], i) => (
              <div key={term}>
                <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{term}</dt>
                <dd className={`mt-1 text-xl font-light font-mono ${i === 0 ? "text-(--accent)" : "text-(--text)"}`}>{yen(v)}</dd>
                {twdPerYen && <dd className="text-[11px] text-(--muted) font-mono">≈ NT${Math.round(v * twdPerYen).toLocaleString("en-US")}</dd>}
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-(--muted) font-light">輸入標價</p>
        )}
      </div>
    </div>
  );
}
