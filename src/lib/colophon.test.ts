import { describe, expect, it } from "vitest";
import { lastBackupTime } from "./colophon";

describe("colophon", () => {
  it("backup.log 取最後一次成功的時間，失敗的不算", () => {
    const raw = [
      "\uFEFF[2026-11-20T02:01:05+08:00] ===== Backup started =====",
      "[2026-11-20T02:01:10+08:00] ===== Backup succeeded =====",
      "[2026-11-21T02:06:04+08:00] ===== Backup started =====",
      "[2026-11-21T02:06:09+08:00] ===== Backup succeeded =====",
      "[2026-11-22T02:00:00+08:00] ===== Backup FAILED =====",
    ].join("\r\n");
    expect(lastBackupTime(raw)).toBe("2026-11-21T02:06:09+08:00");
    expect(lastBackupTime("")).toBeNull();
  });
});
