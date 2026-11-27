"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

// 「問我」AI 助理（TODO H1，2026-11-27）：POST /api/chat（本機 Ollama gemma3:4b）→ 純文字串流，來源連結在 x-sources 標頭。
// 對話只放在這個頁面的記憶體裡（重新整理就沒了），伺服器不存。
// 冷啟動：模型不在 GPU 上時第一次要等約一分鐘，所以頁面一開就先叫伺服器暖機（/api/chat/warm），等太久會明講在暖機。

type Source = { title: string; href: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

const SUGGESTIONS = ["做過哪些專案？", "會 YOLO 嗎？", "這個網站是怎麼架起來的？", "日語程度如何？"];
const SLOW_MS = 6000;
const MAX_CHARS = 800;

export default function AskChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const ctrlRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/chat/warm", { method: "POST" }).catch(() => {});
    return () => ctrlRef.current?.abort();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [msgs]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setBusy(true);
    setSlow(false);
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const slowTimer = setTimeout(() => setSlow(true), SLOW_MS);
    const patchLast = (fn: (m: Msg) => Msg) => setMsgs((cur) => cur.with(-1, fn(cur.at(-1)!)));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `失敗（${res.status}）`);
      }
      let sources: Source[] = [];
      try {
        sources = JSON.parse(decodeURIComponent(res.headers.get("x-sources") ?? "[]"));
      } catch {}
      clearTimeout(slowTimer);
      setSlow(false);
      patchLast((m) => ({ ...m, sources }));
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        patchLast((m) => ({ ...m, content: m.content + value }));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message || "連不上小助理，晚點再試");
        // 一個字都沒收到的空白回答拿掉；有收到一半的留著
        setMsgs((cur) => (cur.at(-1)?.content ? cur : cur.slice(0, -1)));
      }
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setBusy(false);
    }
  };

  const last = msgs.at(-1);
  const waiting = busy && last?.role === "assistant" && !last.content;

  return (
    <div>
      <div className="min-h-[200px] space-y-8" aria-live="polite">
        {msgs.length === 0 && (
          <div>
            <p className="text-sm text-(--muted) font-light">試試看：</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="px-3 py-2 text-sm border border-(--border) rounded-sm text-(--text) hover:border-(--accent) hover:text-(--accent) transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i}>
            <p className="text-[11px] font-mono tracking-wide text-(--muted)">{m.role === "user" ? "你 · You" : "小助理 · Assistant"}</p>
            <p className={`mt-2 whitespace-pre-wrap leading-relaxed font-light ${m.role === "user" ? "text-(--muted)" : "text-(--text)"}`}>
              {m.content || (waiting && i === msgs.length - 1 ? (slow ? "小助理在暖機，第一次要等一分鐘左右…" : "思考中…") : "")}
            </p>
            {m.sources && m.sources.length > 0 && m.content && (
              <p className="mt-3 text-xs text-(--muted) font-mono">
                來源 · Sources：
                {m.sources.map((s, j) => (
                  <span key={s.href}>
                    {j > 0 && "、"}
                    <Link href={s.href as Route} className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
                      {s.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="mt-6 text-sm text-(--warn) font-light">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="mt-10 flex flex-col gap-3"
      >
        <label className="flex flex-col gap-2 text-[11px] text-(--muted) font-mono tracking-wide">
          問一個問題 · Ask
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter 送出、Shift+Enter 換行；注音／日文輸入法選字時的 Enter 不算送出
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={2}
            maxLength={MAX_CHARS}
            placeholder="例：他做過哪些 AI 專案？"
            className="w-full resize-y bg-transparent border border-(--border) rounded-sm px-3 py-2 text-base text-(--text) font-sans font-light tracking-normal focus:outline-none focus:border-(--accent)"
          />
        </label>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-4 py-2 text-sm border border-(--accent) text-(--accent) rounded-sm hover:bg-(--accent-lt) transition-colors disabled:opacity-50"
          >
            {busy ? "回答中…" : "送出"}
          </button>
          {busy && (
            <button type="button" onClick={() => ctrlRef.current?.abort()} className="text-sm text-(--muted) hover:text-(--accent) transition-colors">
              停止
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
