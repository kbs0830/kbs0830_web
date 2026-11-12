"use client";

import { useEffect, useId, useState } from "react";
import { mermaidConfig } from "@/lib/mermaid-config";

// 瀏覽器端即時渲染，只當 ArchitectureDiagram 的備援：架構圖還沒被 scripts/render-diagrams.mjs
// 預先畫成 SVG 時才會用到（例如剛改了圖、本機開發沒跑腳本）。mermaid 用動態 import，
// 正常情況下這個 chunk 根本不會被下載。
export default function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize(mermaidConfig(document.documentElement.getAttribute("data-theme") === "dark"));
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        // chunk 載不到或圖語法錯：都當成畫不出來
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (failed) return null;

  if (!svg) {
    return (
      <div className="my-2 rounded-sm border border-(--border) bg-(--surface) p-4">
        <p className="text-xs text-(--muted) font-light">載入架構圖…</p>
      </div>
    );
  }

  return (
    <div
      className="my-2 overflow-x-auto rounded-sm border border-(--border) bg-(--surface) p-4 [&_svg]:mx-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
