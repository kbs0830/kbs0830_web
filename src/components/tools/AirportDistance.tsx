"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useJson } from "@/lib/client/hooks";

// 機場距離／航程（TODO J5，2026-11-24）。機場座標是 OurAirports 的公開資料（公共領域），
// 精簡成有定期航班的大中型機場、約 3,200 個（public/data/airports.json，~90 KB gzip），打開這頁才下載。全部在瀏覽器算。

type Row = [iata: string, name: string, city: string, country: string, lat: number, lon: number];
type Airport = { iata: string; name: string; city: string; country: string; lat: number; lon: number };

const EARTH_KM = 6371;
const CRUISE_KMH = 800; // 噴射客機的平均地速，粗估用
const TAXI_H = 0.5; // 起降、滑行多出來的時間

function greatCircleKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** 粗估飛行時間（小時）：距離 ÷ 800 km/h ＋ 0.5 小時；不含風向（往東通常比較快） */
const flightHours = (km: number) => km / CRUISE_KMH + TAXI_H;

const hm = (h: number) => `${Math.floor(h)} 小時 ${Math.round((h % 1) * 60)} 分`;
const clean = (v: string) => v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);

export default function AirportDistance({ zh }: { zh: Record<string, string> }) {
  const params = useSearchParams();
  const [from, setFrom] = useState(() => clean(params.get("from") ?? "") || "KHH");
  const [to, setTo] = useState(() => clean(params.get("to") ?? "") || "FUK");
  const raw = useJson<{ airports: Row[] }>("/data/airports.json");
  const db = useMemo<Map<string, Airport> | null | "error">(
    () => (raw && raw !== "error" ? new Map(raw.airports.map(([iata, name, city, country, lat, lon]) => [iata, { iata, name, city, country, lat, lon }])) : raw),
    [raw],
  );

  const update = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
    if (f.length === 3 && t.length === 3) history.replaceState(null, "", `?from=${f}&to=${t}`);
  };

  if (db === "error") return <p className="text-sm text-(--muted) font-light">機場資料下載失敗，重新整理再試一次。</p>;

  const a = db?.get(from);
  const b = db?.get(to);
  const km = a && b ? greatCircleKm(a, b) : null;
  const label = (x: Airport) => zh[x.iata] ?? x.city ?? x.name;

  return (
    <div className="min-h-[360px]" aria-busy={db === null}>
      <div className="flex flex-wrap items-end gap-4">
        <CodeInput label="出發 · From" value={from} onChange={(v) => update(v, to)} />
        <button
          type="button"
          onClick={() => update(to, from)}
          className="mb-2 text-(--muted) hover:text-(--accent) transition-colors font-mono"
          aria-label="交換出發跟抵達"
        >
          ⇄
        </button>
        <CodeInput label="抵達 · To" value={to} onChange={(v) => update(from, v)} />
      </div>

      <div className="mt-10" aria-live="polite">
        {db === null ? (
          <p className="text-sm text-(--muted) font-light">下載機場資料中…</p>
        ) : !a || !b ? (
          <p className="text-sm text-(--muted) font-light">
            {from.length === 3 && !a ? `找不到 ${from}` : to.length === 3 && !b ? `找不到 ${to}` : "輸入兩個三碼機場代碼（例：TPE、NRT）"}
            ——只收有定期航班的大、中型機場。
          </p>
        ) : (
          <>
            <p className="text-lg font-light text-(--text) leading-relaxed">
              {label(a)}（{a.iata}）→ {label(b)}（{b.iata}）
            </p>
            <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
              <Stat term="大圓距離" value={`${Math.round(km!).toLocaleString("en-US")} km`} sub={`${Math.round(km! / 1.609).toLocaleString("en-US")} mi`} />
              <Stat term="大概飛多久" value={hm(flightHours(km!))} sub="粗估，實際看風向跟航路" />
              <Stat term="地球一圈的" value={`${((km! / 40075) * 100).toFixed(1)}%`} sub="赤道一圈 40,075 km" />
            </dl>
            <p className="mt-8 text-xs text-(--muted) font-light leading-relaxed">
              {a.name}（{a.country}）· {b.name}（{b.country}）
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function CodeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(clean(e.target.value))}
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={3}
        className="w-24 bg-transparent border border-(--border) rounded-sm px-3 py-2 text-lg text-(--text) font-mono uppercase focus:outline-none focus:border-(--accent)"
      />
    </label>
  );
}

function Stat({ term, value, sub }: { term: string; value: string; sub: string }) {
  return (
    <div>
      <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{term}</dt>
      <dd className="mt-1 text-xl font-light text-(--text) font-mono">{value}</dd>
      <dd className="text-[11px] text-(--muted)">{sub}</dd>
    </div>
  );
}
