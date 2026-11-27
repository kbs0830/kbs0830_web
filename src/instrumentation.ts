// 伺服器啟動時跑一次（Next.js instrumentation）。目前只用來開背景記錄器：
//   - 小港機場延誤統計（決策表 J3，lib/travel/airport-delay-recorder.ts），每 20 分鐘記一次看板
// build 時不開；設 AIRPORT_DELAY_RECORDER=0 可以關（測試用）。
//   - onRequestError（TODO Q4，2026-11-27）：頁面 render、API、Server Action 在伺服器端出錯時記到 logs/errors.log
//     （lib/ops/server-errors.ts），後台 /admin/ops 看得到、watchdog 同一種錯誤 1 小時內 5 次以上寄信
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.AIRPORT_DELAY_RECORDER === "0") return;
  const { startAirportDelayRecorder } = await import("@/lib/travel/airport-delay-recorder");
  startAirportDelayRecorder();
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routeType?: string },
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { formatServerError, recordServerError } = await import("@/lib/ops/server-errors");
  recordServerError(formatServerError(err, request, context));
}
