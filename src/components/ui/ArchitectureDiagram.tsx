import fs from "node:fs";
import path from "node:path";
import { diagramKey } from "@/lib/diagram-key";
import MermaidDiagram from "@/components/ui/MermaidDiagram";

// 作品架構圖。Server Component：build 時讀 scripts/render-diagrams.mjs 預先畫好的 SVG
// 直接嵌進 HTML（亮色、暗色兩份都放，globals.css 依 data-theme 只顯示一份），訪客不用下載 mermaid、
// 切換主題也會跟著變。還沒預先畫好（新改的圖、本機開發沒跑腳本）就退回瀏覽器端即時渲染。
const dir = path.join(/* turbopackIgnore: true */ process.cwd(), "src", "generated", "diagrams");

function read(key: string, theme: "light" | "dark") {
  try {
    return fs.readFileSync(path.join(dir, `${key}-${theme}.svg`), "utf8");
  } catch {
    return null;
  }
}

export default function ArchitectureDiagram({ chart }: { chart: string }) {
  const key = diagramKey(chart);
  const light = read(key, "light");
  const dark = read(key, "dark");
  if (!light || !dark) return <MermaidDiagram chart={chart} />;

  return (
    <div className="my-2 overflow-x-auto rounded-sm border border-(--border) bg-(--surface) p-4 [&_svg]:mx-auto">
      <div className="diagram-light" dangerouslySetInnerHTML={{ __html: light }} />
      <div className="diagram-dark" dangerouslySetInnerHTML={{ __html: dark }} />
    </div>
  );
}
