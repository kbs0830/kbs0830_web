"use client";

import { useState } from "react";
import { useJson } from "@/lib/hooks";
import type { JpyRate } from "@/lib/jpy-rate";

// 日圓匯率作品頁的「線上版」（TODO D2，2026-11-22）：/api/jpy-rate 的即時牌價、作品的購買決策、近 90 天走勢。
// 決策照作品原本的邏輯：目標匯率＝台幣預算 ÷ 商品日圓價格，銀行現金賣出 ≤ 目標 → 現在就買（lib/jpy-rate.ts 有一樣的函式跟測試）。
// 沒輸入時跟作品一樣只標「最佳／較高」。讀不到資料整塊不顯示。


const fmt = (n: number | null) => (n == null ? "–" : n.toFixed(4));
const hm = (ms: number) => new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);
/** 牌價、走勢都沒有＝這次沒抓到，整塊不顯示（JpyExchange 也用） */
export const usableJpyRate = (r: JpyRate | null | "error"): JpyRate | null | "error" =>
  r && r !== "error" && !r.banks.length && !r.trend.length ? "error" : r;

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

export default function JpyRateLive() {
  const data = usableJpyRate(useJson<JpyRate>("/api/jpy-rate"));
  const [price, setPrice] = useState("");
  const [budget, setBudget] = useState("");

  if (data === "error") return null;

  const banks = data?.banks.filter((b) => b.cashSell != null) ?? [];
  const best = banks.length ? Math.min(...banks.map((b) => b.cashSell!)) : null;
  const p = Number(price);
  const bud = Number(budget);
  const target = p > 0 && bud > 0 ? bud / p : null;

  return (
    <section className="mt-12 min-h-[420px]" aria-busy={data === null}>
      <p className="text-xs tracking-[0.2em] text-(--accent) uppercase font-mono mb-4">
        即時牌價 <span className="text-(--muted) normal-case tracking-normal">· Live Rates</span>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-light">
          <thead>
            <tr className="text-[11px] text-(--muted) font-mono tracking-wide text-left border-b border-(--border)">
              <th className="py-2 font-normal">銀行</th>
              <th className="py-2 font-normal text-right">現金賣出</th>
              <th className="py-2 font-normal text-right">即期賣出</th>
              <th className="py-2 font-normal text-right">判斷</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {data === null
              ? [0, 1].map((i) => (
                  <tr key={i}>
                    <td className="py-3 text-(--muted)" colSpan={4}>
                      讀取中…
                    </td>
                  </tr>
                ))
              : banks.map((b) => {
                  const isBest = best != null && Math.abs(b.cashSell! - best) < 1e-6;
                  const buy = target != null ? b.cashSell! <= target : null;
                  return (
                    <tr key={b.id}>
                      <td className="py-3 text-(--text)">
                        {b.name}
                        {b.stale && <span className="ml-2 text-[11px] text-(--muted) font-mono">（{hm(b.at)} 的資料）</span>}
                      </td>
                      <td className="py-3 text-right font-mono text-(--text)">{fmt(b.cashSell)}</td>
                      <td className="py-3 text-right font-mono text-(--muted)">{fmt(b.spotSell)}</td>
                      <td className="py-3 text-right text-xs">
                        {buy === null ? (
                          <span className={isBest ? "text-(--accent)" : "text-(--muted)"}>{isBest ? "最佳" : "較高"}</span>
                        ) : (
                          <span className={buy ? "text-(--accent)" : "text-(--muted)"}>{buy ? "✓ 現在就買" : "再等等"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-[11px] text-(--muted) font-mono">
          商品價格（日圓）
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="例：12000"
            className="w-36 bg-transparent border border-(--border) rounded-sm px-3 py-2 text-sm text-(--text) font-mono focus:outline-none focus:border-(--accent)"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-(--muted) font-mono">
          台幣預算
          <input
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="例：2500"
            className="w-36 bg-transparent border border-(--border) rounded-sm px-3 py-2 text-sm text-(--text) font-mono focus:outline-none focus:border-(--accent)"
          />
        </label>
        <p className="text-xs text-(--muted) font-mono pb-2" aria-live="polite">
          {target != null ? `目標匯率 ${target.toFixed(4)}：現金賣出低於它就划算` : "輸入價格跟預算，算出能接受的匯率"}
        </p>
      </div>

      {data && data.trend.length > 1 && <Trend points={data.trend} />}

      <p className="text-xs text-(--muted) font-light mt-6 leading-relaxed">
        決策照作品原本的邏輯：預算 ÷ 商品價格＝目標匯率，銀行現金賣出比它低就「現在就買」。作品原本抓 6 家銀行，網站版只放抓得到的台銀（官方 CSV）跟玉山——
        其他 4 家的網頁改版或擋程式，沒有硬爬。牌價 10 分鐘更新一次；走勢是 Yahoo Finance 的市場中價，不是銀行牌價。
      </p>
    </section>
  );
}

export function Trend({ points }: { points: { date: string; rate: number }[] }) {
  const W = 600;
  const H = 120;
  const rates = points.map((p) => p.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const span = max - min || 1e-4;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (r: number) => 8 + (1 - (r - min) / span) * (H - 16);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.rate).toFixed(1)}`).join("");
  const last = points[points.length - 1];
  const lo = points[rates.indexOf(min)];
  const hi = points[rates.indexOf(max)];
  return (
    <figure className="mt-10">
      <figcaption className="text-xs tracking-[0.2em] text-(--accent) uppercase font-mono mb-4">
        近 90 天走勢 <span className="text-(--muted) normal-case tracking-normal">· 90-day trend</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`近 90 天日圓匯率：最低 ${lo.rate}（${md(lo.date)}），最高 ${hi.rate}（${md(hi.date)}），最新 ${last.rate}`}
      >
        <path d={d} fill="none" style={{ stroke: "var(--accent)" }} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <circle cx={x(points.length - 1)} cy={y(last.rate)} r={3} style={{ fill: "var(--accent)" }} />
      </svg>
      <div className="flex justify-between text-[11px] text-(--muted) font-mono mt-2">
        <span>{md(points[0].date)}</span>
        <span>
          最低 {lo.rate.toFixed(4)}（{md(lo.date)}）· 最高 {hi.rate.toFixed(4)}（{md(hi.date)}）· 最新 {last.rate.toFixed(4)}
        </span>
        <span>{md(last.date)}</span>
      </div>
    </figure>
  );
}
