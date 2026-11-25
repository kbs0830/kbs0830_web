// Cache Components 的 <Suspense> 佔位（2026-11-25，TODO C13）：頁面外殼先出現，即時資料串流進來之前顯示這塊。
// 給一個接近實際內容的最小高度，資料進來時版面不會整個往下跳。Server Component、零 JS。
export default function LoadingBlock({ label = "讀取中…", minHeight = 240 }: { label?: string; minHeight?: number }) {
  return (
    <div aria-busy="true" className="flex items-start" style={{ minHeight }}>
      <p className="text-sm text-(--muted) font-light animate-pulse motion-reduce:animate-none">{label}</p>
    </div>
  );
}
