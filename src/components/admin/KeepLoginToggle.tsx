"use client";
import { useEffect, useState } from "react";

// 「維持登入」開關（TODO G6，2026-11-26，使用者：「記得加一個維持登入的按鈕」）。
// 開＝登入維持 30 天、關＝1 天；改的是 Cloudflare Access 的設定，下次登入才生效（現在這次登入不會被踢出去）。
// 打開頁面時才去問現在的值（不拖慢後台頁面），讀不到就整個不顯示。
// 換分頁時這個元件會重新掛載：問過一次就記在 module 裡，同一個分頁內不再重問（伺服器那邊也記 10 分鐘）
let known: boolean | null = null;

export default function KeepLoginToggle() {
  const [keep, setKeepState] = useState<boolean | null>(known);
  const setKeep = (v: boolean) => {
    known = v;
    setKeepState(v);
  };
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (known !== null) return;
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/admin/session", { signal: ac.signal });
        if (r.ok) setKeep(((await r.json()) as { keep: boolean }).keep);
      } catch {}
    })();
    return () => ac.abort();
  }, []);

  if (keep === null) return null;

  const toggle = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keep: !keep }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setKeep(((await r.json()) as { keep: boolean }).keep);
      setMsg("下次登入生效");
    } catch (e) {
      setMsg(`沒改成（${e instanceof Error ? e.message : "?"}）`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={keep}
        disabled={busy}
        onClick={toggle}
        className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-full border border-(--border) text-(--text) hover:border-(--accent) disabled:opacity-60 transition-colors"
      >
        <span aria-hidden className={`relative h-4 w-7 rounded-full transition-colors ${keep ? "bg-(--ok)" : "bg-(--border)"}`}>
          <span className={`absolute top-0.5 size-3 rounded-full bg-(--bg) transition-[left] ${keep ? "left-3.5" : "left-0.5"}`} />
        </span>
        維持登入 {keep ? "30 天" : "1 天"}
      </button>
      {msg && <span role="status" className="text-[11px] text-(--muted)">{msg}</span>}
    </span>
  );
}
