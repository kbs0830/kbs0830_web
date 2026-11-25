import type { DexKind } from "@/lib/live/aircraft-dex";

// 機體図鑑的俯視剪影（Server Component，純 SVG）。六種外形，機頭朝上；顏色用 currentColor（點亮＝強調色、沒收到＝邊框色）
const SHAPES: Record<DexKind, string> = {
  // 窄體：細機身、後掠翼、翼下兩具發動機
  narrow: "M30 4 C32 4 33 7 33 10 L33 24 L54 34 L54 38 L33 33 L33 47 L40 52 L40 55 L30 53 L20 55 L20 52 L27 47 L27 33 L6 38 L6 34 L27 24 L27 10 C27 7 28 4 30 4 Z M15 33 h3 v5 h-3 Z M42 33 h3 v5 h-3 Z",
  // 廣體：粗機身、翼展更長
  wide: "M30 2 C33 2 34.5 6 34.5 10 L34.5 23 L58 34 L58 38.5 L34.5 33 L34.5 48 L43 53 L43 56 L30 54 L17 56 L17 53 L25.5 48 L25.5 33 L2 38.5 L2 34 L25.5 23 L25.5 10 C25.5 6 27 2 30 2 Z M12 31 h3.5 v6 h-3.5 Z M44.5 31 h3.5 v6 h-3.5 Z",
  // 四發：廣體＋每邊兩具發動機、機頭隆起
  jumbo: "M30 1 C34 1 35 6 35 11 L35 22 L59 34 L59 38.5 L35 32 L35 48 L44 53 L44 56 L30 54 L16 56 L16 53 L25 48 L25 32 L1 38.5 L1 34 L25 22 L25 11 C25 6 26 1 30 1 Z M8 33 h3 v5 h-3 Z M16 29 h3 v5 h-3 Z M41 29 h3 v5 h-3 Z M49 33 h3 v5 h-3 Z",
  // 螺旋槳：直翼、高翼、兩個螺旋槳
  prop: "M30 6 C32 6 33 8 33 11 L33 24 L56 25 L56 29 L33 30 L33 47 L41 50 L41 53 L30 52 L19 53 L19 50 L27 47 L27 30 L4 29 L4 25 L27 24 L27 11 C27 8 28 6 30 6 Z M14 20 h2 v10 h-2 Z M44 20 h2 v10 h-2 Z M10 20 h10 v1.5 h-10 Z M40 20 h10 v1.5 h-10 Z",
  // 商務機：短機身、發動機在機尾、T 尾
  biz: "M30 8 C31.6 8 32.5 10 32.5 13 L32.5 27 L50 35 L50 38 L32.5 34 L32.5 47 L39 50 L39 52.5 L30 51 L21 52.5 L21 50 L27.5 47 L27.5 34 L10 38 L10 35 L27.5 27 L27.5 13 C27.5 10 28.4 8 30 8 Z M23.5 38 h2.5 v6 h-2.5 Z M34 38 h2.5 v6 h-2.5 Z",
  // 直升機：圓機身、長尾桁、主旋翼
  heli: "M30 12 C35 12 37 16 37 21 C37 27 34 30 31.5 31 L31.5 50 L36 51 L36 53 L24 53 L24 51 L28.5 50 L28.5 31 C26 30 23 27 23 21 C23 16 25 12 30 12 Z M6 20 L54 20 L54 22 L6 22 Z M29 0 L31 0 L31 42 L29 42 Z",
};

export default function PlaneSilhouette({ kind, className }: { kind: DexKind; className?: string }) {
  return (
    <svg viewBox="0 0 60 58" aria-hidden className={className}>
      <path d={SHAPES[kind]} fill="currentColor" fillRule="nonzero" />
    </svg>
  );
}
