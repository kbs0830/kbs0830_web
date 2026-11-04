import type { MermaidConfig } from "mermaid";

// 架構圖的 mermaid 設定。scripts/render-diagrams.mjs（部署前預先畫成 SVG）跟
// MermaidDiagram（還沒預先畫好時的瀏覽器端備援）共用，兩邊畫出來才會一樣。
// 改這裡會讓 diagramKey 變掉，部署時自動重畫全部架構圖。
export function mermaidConfig(dark: boolean): MermaidConfig {
  return {
    startOnLoad: false,
    theme: dark ? "dark" : "neutral",
    themeVariables: {
      primaryColor: dark ? "#1a2a3a" : "#e8f0f8",
      primaryBorderColor: dark ? "#6295cc" : "#2d5a8e",
      primaryTextColor: dark ? "#e8e6e1" : "#1a1a1a",
      lineColor: dark ? "#6295cc" : "#2d5a8e",
      // 執行時解析成 next/font 載入的 Geist Mono（預先渲染時腳本也用同一套字量文字寬度）
      fontFamily: "var(--font-mono), monospace",
      fontSize: "13px",
    },
    securityLevel: "strict",
  };
}
