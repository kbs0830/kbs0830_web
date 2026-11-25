"use client";

import { useState } from "react";
import { breakEvenMonths, powerCost } from "@/lib/tools/power-cost";
import { nf } from "@/lib/format";

// 家裡電腦架站的電費（TODO J11）。全部在瀏覽器算
const num = (s: string) => Number(s.replace(/[^\d.]/g, ""));

export default function PowerCost() {
  const [watts, setWatts] = useState("80");
  const [hours, setHours] = useState("24");
  const [price, setPrice] = useState("3.5");
  const [vps, setVps] = useState("300");
  const [hw, setHw] = useState("0");
  const r = powerCost(num(watts), Math.min(24, num(hours)), num(price));
  const months = r ? breakEvenMonths(num(hw), r.perMonth, num(vps)) : null;

  const field = (label: string, value: string, set: (v: string) => void, hint: string) => (
    <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
      {label}
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => set(e.target.value.replace(/[^\d.]/g, "").slice(0, 8))}
        className="w-32 bg-transparent border border-(--border) rounded-sm px-3 py-2 text-lg text-(--text) font-mono focus:outline-none focus:border-(--accent)"
      />
      <span className="font-sans font-light">{hint}</span>
    </label>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-6">
        {field("平均耗電（W）", watts, setWatts, "插座電表量最準")}
        {field("每天開幾小時", hours, setHours, "架站通常 24")}
        {field("每度電價（元）", price, setPrice, "帳單總金額 ÷ 度數")}
      </div>
      {r && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden">
          {[
            [`${nf.format(Math.round(r.kwhPerMonth))} 度`, "每月用電"],
            [`NT$${nf.format(Math.round(r.perMonth))}`, "每月電費"],
            [`${nf.format(Math.round(r.kwhPerYear))} 度`, "每年用電"],
            [`NT$${nf.format(Math.round(r.perYear))}`, "每年電費"],
          ].map(([v, l]) => (
            <div key={l} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
              <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{l}</dt>
              <dd className="text-xl font-light text-(--text) font-mono mb-1">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex flex-wrap gap-6 pt-2">
        {field("VPS 月租（元）", vps, setVps, "同等規格的雲端主機")}
        {field("硬體另外花了（元）", hw, setHw, "電腦本來就有就填 0")}
      </div>
      {r && (
        <p className="text-sm font-light text-(--text) leading-relaxed">
          {months === null
            ? "電費比 VPS 月租還貴：單看錢的話租 VPS 比較划算。"
            : months === 0
              ? `每個月比租 VPS 省 NT$${nf.format(Math.round(num(vps) - r.perMonth))}。`
              : `每個月省 NT$${nf.format(Math.round(num(vps) - r.perMonth))}，大約 ${months} 個月把硬體錢省回來。`}
        </p>
      )}
    </div>
  );
}
