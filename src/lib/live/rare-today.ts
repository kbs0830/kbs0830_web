import "server-only";
import { dataFile } from "@/lib/data-file";
import { DEX_GROUPS, type DexEntry } from "@/lib/live/aircraft-dex";
import { twDate } from "../../../scripts/lib/tw-time.js";
import { readState } from "../../../scripts/lib/radar.js";

// 今天（台灣日期）自家雷達收到的「珍しい」機型（TODO B16，2026-11-26）。珍しい＝機體図鑑（aircraft-dex.ts）標 rare 的：四發、757、Fokker 50 這類。
// 只回機型（名稱），不回識別碼、時間、數量、座標——跟 /radar 一樣的隱私規則（scripts/lib/radar.js）。

const RARE = new Map<string, DexEntry>(DEX_GROUPS.flatMap((g) => g.entries).filter((e) => e.rare).map((e) => [e.code, e]));

type RadarState = { days?: Record<string, { types?: Record<string, number> }> } | null;

/** 純函式：給雷達狀態跟現在時間，回今天收到的稀有機型（照圖鑑順序） */
export function rareFromState(state: RadarState, now: number): DexEntry[] {
  const types = state?.days?.[twDate(now)]?.types ?? {};
  return [...RARE.values()].filter((e) => (types[e.code] ?? 0) > 0);
}

export function rareToday(now = Date.now()): DexEntry[] {
  return rareFromState(readState(dataFile("RADAR_FILE", "radar.json")), now);
}
