"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

// AI 爬蟲檢查（TODO J12，2026-11-24）：輸入網域 → /api/tools/robots 抓對方的 robots.txt 判斷。
// 網址帶 ?domain= 會自動查（方便分享結果）。

type Access = "allowed" | "partial" | "blocked";
type Via = "specific" | "wildcard" | "none";
type Result = {
  host: string;
  robots: { status: number; found: boolean };
  llmsTxt: boolean;
  crawlers: { token: string; owner: string; use: string; ai: boolean; access: Access; via: Via }[];
};

const ACCESS: Record<Access, { zh: string; cls: string }> = {
  allowed: { zh: "允許", cls: "text-(--text)" },
  partial: { zh: "部分擋", cls: "text-(--accent)" },
  blocked: { zh: "擋掉", cls: "text-(--warn)" },
};
const VIA: Record<Via, string> = { specific: "有寫它的名字", wildcard: "套用 *（全部爬蟲）的規則", none: "沒有相關規則" };

export default function AiCrawlers() {
  const params = useSearchParams();
  const [domain, setDomain] = useState(() => params.get("domain") ?? "");
  const [state, setState] = useState<{ loading: boolean; result?: Result; error?: string }>({ loading: false });
  const ctrlRef = useRef<AbortController | null>(null);

  const run = async (d: string) => {
    const q = d.trim();
    if (!q) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setState({ loading: true });
    history.replaceState(null, "", `?domain=${encodeURIComponent(q)}`);
    try {
      const res = await fetch(`/api/tools/robots?domain=${encodeURIComponent(q)}`, { signal: ctrl.signal });
      const json = await res.json();
      setState(res.ok ? { loading: false, result: json as Result } : { loading: false, error: json.error ?? `查詢失敗（${res.status}）` });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setState({ loading: false, error: "連不上伺服器，晚點再試" });
    }
  };

  // 網址帶 ?domain= 進來就直接查一次（只在第一次載入）
  const initial = useRef(params.get("domain"));
  useEffect(() => {
    if (initial.current) void run(initial.current);
    return () => ctrlRef.current?.abort();
  }, []);

  const r = state.result;
  const ai = r?.crawlers.filter((c) => c.ai) ?? [];
  const blockedAi = ai.filter((c) => c.access === "blocked").length;

  return (
    <div className="min-h-[420px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(domain);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
          網域 · Domain
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            autoCapitalize="none"
            spellCheck={false}
            className="w-64 bg-transparent border border-(--border) rounded-sm px-3 py-2 text-base text-(--text) font-mono focus:outline-none focus:border-(--accent)"
          />
        </label>
        <button
          type="submit"
          disabled={state.loading}
          className="mb-px px-4 py-2 text-sm border border-(--accent) text-(--accent) rounded-sm hover:bg-(--accent-lt) transition-colors disabled:opacity-50"
        >
          {state.loading ? "檢查中…" : "檢查"}
        </button>
      </form>

      <div className="mt-10" aria-live="polite">
        {state.error && <p className="text-sm text-(--warn) font-light">{state.error}</p>}
        {r && (
          <>
            <p className="text-lg font-light text-(--text) leading-relaxed">
              <span className="font-mono">{r.host}</span>：
              {!r.robots.found
                ? `沒有 robots.txt（HTTP ${r.robots.status}），所有爬蟲都可以抓。`
                : blockedAi === 0
                  ? "沒有擋任何 AI 爬蟲。"
                  : `擋了 ${blockedAi} 個 AI 爬蟲（共檢查 ${ai.length} 個）。`}
            </p>
            <p className="mt-2 text-xs text-(--muted) font-mono">llms.txt：{r.llmsTxt ? "有" : "沒有"}</p>

            <div className="overflow-x-auto mt-8">
              <table className="w-full text-sm font-light">
                <thead>
                  <tr className="text-[11px] text-(--muted) font-mono tracking-wide text-left border-b border-(--border)">
                    <th className="py-2 pr-3 font-normal">爬蟲</th>
                    <th className="py-2 pr-3 font-normal">誰的、做什麼</th>
                    <th className="py-2 pr-3 font-normal">首頁</th>
                    <th className="py-2 font-normal hidden sm:table-cell">依據</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {r.crawlers.map((c) => (
                    <tr key={c.token}>
                      <td className="py-2.5 pr-3 font-mono text-(--text) whitespace-nowrap">{c.token}</td>
                      <td className="py-2.5 pr-3 text-(--muted)">
                        {c.owner} · {c.use}
                      </td>
                      <td className={`py-2.5 pr-3 whitespace-nowrap ${ACCESS[c.access].cls}`}>{ACCESS[c.access].zh}</td>
                      <td className="py-2.5 text-xs text-(--muted) hidden sm:table-cell">{VIA[c.via]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
