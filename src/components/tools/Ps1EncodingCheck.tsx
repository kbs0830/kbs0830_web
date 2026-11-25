"use client";

import { useState } from "react";
import { inspectPs1, withBom, type Ps1Report } from "@/lib/tools/ps1-encoding";

// PowerShell 中文亂碼檢查（TODO J15，2026-11-25）。用瀏覽器的 File API 讀檔，檔案不上傳。

type Item = { name: string; size: number; report: Ps1Report; bytes: Uint8Array };

const LABEL: Record<Ps1Report["encoding"], string> = {
  "utf8-bom": "UTF-8（有 BOM）",
  "utf16le-bom": "UTF-16 LE（有 BOM）",
  "utf16be-bom": "UTF-16 BE（有 BOM）",
  utf8: "UTF-8（沒有 BOM）",
  "not-utf8": "不是 UTF-8（可能是 Big5／ANSI）",
};

function verdict(r: Ps1Report): { ok: boolean; text: string } {
  if (r.encoding === "not-utf8")
    return { ok: !r.nonAscii, text: r.nonAscii ? "已經是系統語系編碼（例如 Big5）：PowerShell 5.1 讀得懂，但 pwsh 7、Git、編輯器可能顯示亂碼。建議用編輯器另存成「UTF-8 with BOM」。" : "只有英文，哪個版本都讀得懂。" };
  if (r.breaksOn51) return { ok: false, text: "有中文／日文但沒有 BOM：Windows PowerShell 5.1 會用系統語系讀，中文變亂碼、可能直接 parse error。補上 BOM 就好。" };
  if (r.encoding === "utf8") return { ok: true, text: "只有英文，沒有 BOM 也沒關係。" };
  return { ok: true, text: "有 BOM，PowerShell 5.1 跟 7 都讀得對。" };
}

export default function Ps1EncodingCheck() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);

  const read = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = await Promise.all(
      [...files].slice(0, 20).map(async (f) => {
        const bytes = new Uint8Array(await f.arrayBuffer());
        return { name: f.name, size: f.size, report: inspectPs1(bytes), bytes };
      }),
    );
    setItems(next);
  };

  const download = (it: Item) => {
    const url = URL.createObjectURL(new Blob([withBom(it.bytes) as BlobPart], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = it.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[360px]">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void read(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 py-12 px-4 border border-dashed rounded-sm text-center cursor-pointer transition-colors ${dragging ? "border-(--accent) bg-(--accent-lt)" : "border-(--border) hover:border-(--accent)"}`}
      >
        <span className="text-sm text-(--text) font-light">把 .ps1 拖進來，或點這裡選檔案</span>
        <span className="text-[11px] text-(--muted) font-mono">可以一次選多個 · 檔案不會上傳</span>
        <input type="file" accept=".ps1,.psm1,.psd1" multiple className="sr-only" onChange={(e) => void read(e.target.files)} />
      </label>

      {items.length > 0 && (
        <ul className="mt-8 border-y border-(--border) divide-y divide-(--border)" aria-live="polite">
          {items.map((it) => {
            const v = verdict(it.report);
            return (
              <li key={it.name} className="py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-sm text-(--text) min-w-0 [overflow-wrap:anywhere]">{it.name}</span>
                  <span className={`shrink-0 text-xs font-mono ${v.ok ? "text-(--accent)" : "text-(--warn)"}`}>{v.ok ? "OK" : "要修"}</span>
                </div>
                <p className="mt-1 text-[11px] text-(--muted) font-mono">
                  {LABEL[it.report.encoding]} · {it.report.nonAscii ? "有非英文字元" : "只有英文"} · {it.size.toLocaleString("en-US")} bytes
                </p>
                <p className="mt-2 text-sm font-light text-(--text)">{v.text}</p>
                {it.report.fixable && (
                  <button
                    type="button"
                    onClick={() => download(it)}
                    className="mt-3 px-3 py-1.5 text-xs font-mono rounded-sm border border-(--accent) text-(--accent) hover:bg-(--accent) hover:text-(--bg) transition-colors"
                  >
                    下載加好 BOM 的版本
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
