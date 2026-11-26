import "server-only";
import { execFileSync } from "node:child_process";

// 「這台機器現在在做什麼」（TODO H7，2026-11-26）：桌機的 RTX 3070 就在網站旁邊，讀 nvidia-smi 的使用率、溫度、功耗、顯存，/colophon 顯示。
// 同步呼叫（readSiteFacts 是同步的），所以結果快取 30 秒、逾時 2 秒；沒有 nvidia-smi（筆電、CI）或失敗就回 null，頁面不顯示這一行。
// 只回彙總數字，不回驅動版本、序號這類細節。

export interface GpuFacts {
  name: string;
  utilization: number; // %
  tempC: number;
  powerW: number;
  memUsedMB: number;
  memTotalMB: number;
}

/** nvidia-smi --query-gpu=name,utilization.gpu,temperature.gpu,power.draw,memory.used,memory.total --format=csv,noheader,nounits 的第一行 */
export function parseGpu(line: string): GpuFacts | null {
  const cols = line.trim().split(/\r?\n/)[0]?.split(",").map((s) => s.trim());
  if (!cols || cols.length < 6) return null;
  const [name, util, temp, power, used, total] = cols;
  const nums = [util, temp, power, used, total].map(Number);
  if (!name || nums.some((n) => !Number.isFinite(n))) return null;
  return {
    name: name.replace(/^NVIDIA\s+(GeForce\s+)?/i, ""),
    utilization: Math.round(nums[0]),
    tempC: Math.round(nums[1]),
    powerW: Math.round(nums[2]),
    memUsedMB: Math.round(nums[3]),
    memTotalMB: Math.round(nums[4]),
  };
}

let cache: { at: number; value: GpuFacts | null } | null = null;

export function readGpu(now = Date.now()): GpuFacts | null {
  if (cache && now - cache.at < 30_000) return cache.value;
  let value: GpuFacts | null = null;
  try {
    const out = execFileSync(
      "nvidia-smi",
      ["--query-gpu=name,utilization.gpu,temperature.gpu,power.draw,memory.used,memory.total", "--format=csv,noheader,nounits"],
      { timeout: 2000, windowsHide: true, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    value = parseGpu(out);
  } catch {}
  cache = { at: now, value };
  return value;
}
