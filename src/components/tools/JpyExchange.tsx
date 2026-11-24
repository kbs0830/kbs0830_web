"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Trend } from "@/components/ui/JpyRateLive";

// 日幣換匯比價（TODO J1，2026-11-24）：/api/jpy-rate 的台銀、玉山牌價（10 分鐘更新）＋Yahoo 近 90 天市場價。
// 算的都在瀏覽器：輸入的台幣金額只放在網址（?twd=），可以直接分享，不會送到伺服器。

type Bank = { id: string; name: string; cashSell: number | null; spotSell: number | null; at: number; stale: boolean };
type Data = { banks: Bank[]; trend: { date: string; rate: number }[] };

const yen = (n: number) => `¥${Math.floor(n).toLocaleString("en-US")}`;
const rate4 = (n: number | null) => (n == null ? "–" : n.toFixed(4));
const hm = (ms: number) => new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);
const DEFAULT_TWD = "30000";

/** 最新市場價在近 90 天裡的位置：回傳「比幾 % 的日子便宜」（匯率越低＝日幣越便宜） */
export function cheaperThanPct(trend: { rate: number }[]): number | null {
  if (trend.length < 10) return null;
  const last = trend[trend.length - 1].rate;
  return Math.round((trend.filter((p) => p.rate > last).length / trend.length) * 100);
}

export default function JpyExchange() {
  const params = useSearchParams();
  const [twd, setTwd] = useState(() => params.get("twd")?.replace(/[^\d]/g, "") || DEFAULT_TWD);
  const [data, setData] = useState<Data | null | "error">(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/jpy-rate", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: Data) => setData(d.banks.length || d.trend.length ? d : "error"))
      .catch((e) => e.name !== "AbortError" && setData("error"));
    return () => ctrl.abort();
  }, []);

  const onChange = (v: string) => {
    const clean = v.replace(/[^\d]/g, "").slice(0, 9);
    setTwd(clean);
    history.replaceState(null, "", clean ? `?twd=${clean}` : location.pathname);
  };

  if (data === "error") {
    return <p className="text-sm text-(--muted) font-light">銀行牌價暫時讀不到（銀行網站沒有回應），晚點再試。</p>;
  }

  const amount = Number(twd);
  const banks = (data?.banks ?? []).filter((b) => b.cashSell != null || b.spotSell != null);
  const rows = banks.map((b) => ({
    ...b,
    cash: b.cashSell && amount > 0 ? amount / b.cashSell : null,
    spot: b.spotSell && amount > 0 ? amount / b.spotSell : null,
  }));
  const bestCash = Math.max(0, ...rows.map((r) => r.cash ?? 0));
  const bestSpot = Math.max(0, ...rows.map((r) => r.spot ?? 0));
  const pct = data ? cheaperThanPct(data.trend) : null;

  return (
    <div className="min-h-[480px]" aria-busy={data === null}>
      <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
        要換的台幣 · TWD
        <input
          inputMode="numeric"
          value={twd}
          onChange={(e) => onChange(e.target.value)}
          className="w-48 bg-transparent border border-(--border) rounded-sm px-3 py-2 text-lg text-(--text) font-mono focus:outline-none focus:border-(--accent)"
        />
      </label>

      <div className="overflow-x-auto mt-8">
        <table className="w-full text-sm font-light">
          <thead>
            <tr className="text-[11px] text-(--muted) font-mono tracking-wide text-left border-b border-(--border)">
              <th className="py-2 font-normal">銀行</th>
              <th className="py-2 font-normal text-right">換現鈔（櫃台）</th>
              <th className="py-2 font-normal text-right">換到外幣帳戶（即期）</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {data === null ? (
              <tr>
                <td colSpan={3} className="py-3 text-(--muted)">
                  讀取中…
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 text-(--text)">
                    {r.name}
                    {r.stale && <span className="ml-2 text-[11px] text-(--muted) font-mono">（{hm(r.at)} 的資料）</span>}
                  </td>
                  <Cell value={r.cash} best={bestCash} rate={r.cashSell} />
                  <Cell value={r.spot} best={bestSpot} rate={r.spotSell} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pct != null && data && (
        <p className="mt-8 text-sm font-light text-(--text) leading-relaxed" aria-live="polite">
          現在的市場價 <span className="font-mono">{data.trend[data.trend.length - 1].rate.toFixed(4)}</span>，
          比近 90 天裡 <span className="text-(--accent) font-mono">{pct}%</span> 的日子便宜
          {pct >= 70 ? "——算是好時機。" : pct <= 30 ? "——偏貴，不急的話可以再等等。" : "——普普通通。"}
        </p>
      )}

      {data && data.trend.length > 1 && <Trend points={data.trend} />}
    </div>
  );
}

function Cell({ value, best, rate }: { value: number | null; best: number; rate: number | null }) {
  if (value == null) return <td className="py-3 text-right text-(--muted) font-mono">–</td>;
  const isBest = Math.floor(value) === Math.floor(best);
  return (
    <td className="py-3 text-right">
      <span className={`font-mono ${isBest ? "text-(--accent)" : "text-(--text)"}`}>{yen(value)}</span>
      <span className="block text-[11px] text-(--muted) font-mono">
        {isBest ? "最多" : `少 ${yen(best - value)}`} · 牌價 {rate4(rate)}
      </span>
    </td>
  );
}
