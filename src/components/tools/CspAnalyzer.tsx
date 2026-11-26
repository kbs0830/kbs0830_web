"use client";

import { useState } from "react";
import { analyzeCsp, EXAMPLE, type Severity } from "@/lib/tools/csp";

// CSP 標頭解讀（TODO J16，2026-11-26）。比對邏輯在 lib/tools/csp.ts；這支只有畫面。全部在瀏覽器裡跑，貼的內容不會送出去。
// 顏色只用站上既有的：警示（--warn）＝要處理、強調色＝做對了、其餘灰字。

const LABEL: Record<Severity, string> = { high: "高風險", medium: "中風險", low: "低風險", info: "提醒", good: "做對了" };
const TONE: Record<Severity, string> = {
  high: "text-(--warn) border-(--warn)",
  medium: "text-(--warn) border-(--warn)/50",
  low: "text-(--text) border-(--border)",
  info: "text-(--muted) border-(--border)",
  good: "text-(--accent) border-(--accent)",
};

export default function CspAnalyzer() {
  const [src, setSrc] = useState(EXAMPLE);
  const { directives, findings, reportOnly, empty } = analyzeCsp(src);
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;

  return (
    <div className="min-h-[480px]">
      <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
        貼上 Content-Security-Policy（可以連標頭名稱、或整個 meta 標籤一起貼）
        <textarea
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          rows={7}
          spellCheck={false}
          className="w-full rounded-sm border border-(--border) bg-(--bg) px-3 py-2 text-[13px] text-(--text) font-mono leading-relaxed focus:border-(--accent) outline-none"
        />
      </label>

      <div className="mt-8" aria-live="polite">
        {empty ? (
          <p className="text-sm font-light text-(--text)">貼上一段 CSP 看看。</p>
        ) : (
          <>
            <p className="text-sm font-light text-(--text) mb-1">
              {reportOnly ? "Report-Only，" : ""}共 <span className="font-mono">{directives.length}</span> 條指令，
              <span className="font-mono text-(--warn)"> {count("high")}</span> 個高風險、
              <span className="font-mono"> {count("medium")}</span> 個中風險、
              <span className="font-mono"> {count("low")}</span> 個低風險。
            </p>

            <h2 className="mt-8 mb-3 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">風險與建議 · Findings</h2>
            <ul className="space-y-3">
              {findings.map((f, i) => (
                <li key={i} className={`border-l-2 pl-3 ${TONE[f.severity]}`}>
                  <p className="text-sm font-light leading-relaxed text-(--text)">
                    <span className={`mr-2 text-[11px] font-mono ${TONE[f.severity].split(" ")[0]}`}>{LABEL[f.severity]}</span>
                    {f.directive && <span className="mr-2 font-mono text-[12px] text-(--muted)">{f.directive}</span>}
                    {f.text}
                  </p>
                  {f.fix && <p className="mt-0.5 text-xs font-light text-(--muted) leading-relaxed">→ {f.fix}</p>}
                </li>
              ))}
            </ul>

            <h2 className="mt-10 mb-3 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">逐條解讀 · Directives</h2>
            <ul className="border-y border-(--border) divide-y divide-(--border)">
              {directives.map((d, i) => (
                <li key={i} className="py-3">
                  <p className="font-mono text-[13px] text-(--text)">
                    {d.name}
                    {d.duplicate && <span className="ml-2 text-[11px] text-(--warn)">重複，會被忽略</span>}
                  </p>
                  <p className="mt-0.5 text-xs font-light text-(--muted)">{d.explain}</p>
                  {d.values.length > 0 && (
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      {d.values.map((v, j) => (
                        <span key={j} className="px-1.5 py-0.5 rounded-sm bg-(--surface) font-mono text-[12px] text-(--text) [overflow-wrap:anywhere]">
                          {v}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
