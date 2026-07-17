"use client";

import { useEffect, useId, useState } from "react";

// mermaid 是純瀏覽器端渲染，不需要 SSR，也不需要跟著首頁一起載入——只有
// /projects/[slug] 這種真的有架構圖的頁面才會 import 到這個元件，動態 import
// mermaid 本身可以避免拖慢其他頁面的 bundle。
export default function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("mermaid").then(async (mod) => {
      const mermaid = mod.default;
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? "dark" : "neutral",
        themeVariables: {
          primaryColor: "#e8f0f8",
          primaryBorderColor: "#2d5a8e",
          primaryTextColor: dark ? "#e8e6e1" : "#1a1a1a",
          lineColor: "#2d5a8e",
          fontFamily: "var(--font-mono), monospace",
          fontSize: "13px",
        },
        securityLevel: "strict",
      });
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chart/id 在這個元件的生命週期內不會變
  }, []);

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
