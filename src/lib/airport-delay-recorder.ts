import { dataFile, readJsonFile, writeJsonFile } from "./data-file";
import { getBoards } from "./airport-board";
import { recordBoard, type DelayStore } from "./airport-delays";

// 小港延誤統計的記錄器（決策表 J3）：伺服器啟動時由 instrumentation.ts 開，每 20 分鐘記一次小港看板。
// 看板本身有 3 分鐘快取（lib/live-cache），這裡不會多打機場網站。寫檔先寫 .tmp 再改名，寫到一半斷電也不會壞。
// 本機測試（3200）一定要設 AIRPORT_DELAYS_FILE 指到暫存檔，不然會寫進正式的 data/。

const INTERVAL_MS = 20 * 60_000;

const delaysFile = () => dataFile("AIRPORT_DELAYS_FILE", "airport-delays.json");
export const readDelays = () => readJsonFile<DelayStore>(delaysFile());

async function tick() {
  try {
    const { khh } = await getBoards();
    if (!khh?.value.length || khh.stale) return; // 讀不到、或拿到的是舊資料：這一輪不記
    const next = recordBoard(readDelays(), khh.value, Date.now());
    if (!writeJsonFile(delaysFile(), next, { atomic: true })) throw new Error("寫不進去");
  } catch (e) {
    console.warn(`[airport-delays] 記錄失敗：${e instanceof Error ? e.message : e}`);
  }
}

let started = false;
export function startAirportDelayRecorder() {
  if (started) return;
  started = true;
  setTimeout(tick, 60_000).unref(); // 啟動一分鐘後第一次（不跟啟動搶資源）
  setInterval(tick, INTERVAL_MS).unref();
}
