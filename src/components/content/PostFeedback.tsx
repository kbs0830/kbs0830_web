"use client";

import { useState, useSyncExternalStore } from "react";

// 記事最後「這篇有幫到你嗎？」（TODO B20，2026-11-28）：一行小字、兩個文字按鈕，點一下就送出，不用登入、不留言。
// 按「沒有」多一步：選一個原因（看不懂／沒解決我的問題／內容過時了），也可以不選直接送。送出後換成「謝謝」（淡入，不跳）。
// 同一篇答過就記在瀏覽器（localStorage），下次不再問；伺服器只記次數，不記誰（/api/feedback）。列印不印。
const REASONS = [
  ["unclear", "看不懂"],
  ["unsolved", "沒解決我的問題"],
  ["outdated", "內容過時了"],
] as const;

type Step = "ask" | "reason" | "thanks";

// 答過了嗎：讀 localStorage（伺服器端渲染時一律當沒答過，水合後才依瀏覽器的紀錄決定要不要顯示，不會有水合不一致）
const noopSubscribe = () => () => {};
const answered = (key: string) => {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false; // localStorage 被擋（無痕模式）：每次都問一次也沒關係
  }
};

const btn =
  "inline-flex items-center min-h-11 px-3 -mx-1 text-sm font-light text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent) transition-colors";

export default function PostFeedback({ slug }: { slug: string }) {
  const [step, setStep] = useState<Step>("ask");
  const key = `fb:${slug}`;

  const answeredBefore = useSyncExternalStore(noopSubscribe, () => answered(key), () => false);

  const send = (helpful: boolean, reason?: string) => {
    fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, helpful, ...(reason ? { reason } : {}) }),
      keepalive: true,
    }).catch(() => {});
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setStep("thanks");
  };

  if (step === "ask" && answeredBefore) return null;
  return (
    <aside aria-label="文章回饋" className="mt-12 pt-6 border-t border-(--border) print:hidden" data-feedback>
      {step === "thanks" ? (
        <p role="status" className="enter-fade text-sm font-light text-(--muted)">
          謝謝你的回饋。
        </p>
      ) : step === "ask" ? (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-light text-(--muted)">
          這篇有幫到你嗎？
          <span className="inline-flex items-center gap-x-4">
            <button type="button" className={btn} onClick={() => send(true)}>
              有
            </button>
            <button type="button" className={btn} onClick={() => setStep("reason")}>
              沒有
            </button>
          </span>
        </p>
      ) : (
        <div className="enter-fade">
          <p className="text-sm font-light text-(--muted) mb-1">不好意思，哪裡不夠好？（選一個，或直接送出）</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {REASONS.map(([value, label]) => (
              <button key={value} type="button" className={btn} onClick={() => send(false, value)}>
                {label}
              </button>
            ))}
            <button type="button" className="inline-flex items-center min-h-11 px-3 text-sm font-light text-(--muted) hover:text-(--text) transition-colors" onClick={() => send(false)}>
              直接送出
            </button>
          </p>
        </div>
      )}
    </aside>
  );
}
