// 伺服器啟動時跑一次（Next.js instrumentation）。目前只用來開背景記錄器：
//   - 小港機場延誤統計（決策表 J3，lib/travel/airport-delay-recorder.ts），每 20 分鐘記一次看板
// build 時不開；設 AIRPORT_DELAY_RECORDER=0 可以關（測試用）。
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.AIRPORT_DELAY_RECORDER === "0") return;
  const { startAirportDelayRecorder } = await import("@/lib/travel/airport-delay-recorder");
  startAirportDelayRecorder();
}
