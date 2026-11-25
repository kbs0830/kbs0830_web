import { createHash } from "node:crypto";
import { mermaidConfig } from "./mermaid-config.ts";

// 預先畫好的架構圖 SVG 檔名：圖的原始碼＋主題設定的雜湊。任何一邊改了 key 就變，
// 舊的 SVG 不會被誤用（ArchitectureDiagram 找不到檔案就退回瀏覽器端即時渲染）。
// 只給 server 端跟 scripts/render-diagrams.mjs 用（node:crypto 不能進 client bundle）。
export function diagramKey(chart: string) {
  return createHash("sha256")
    .update(chart)
    .update(JSON.stringify([mermaidConfig(false), mermaidConfig(true)]))
    .digest("hex")
    .slice(0, 16);
}
