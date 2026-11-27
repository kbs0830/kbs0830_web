import "server-only";
import fs from "node:fs";
import path from "node:path";
import { logFile } from "@/lib/data-file";

// 伺服器端錯誤紀錄（TODO Q4，2026-11-27）：Next 的 instrumentation.ts 的 onRequestError 每次頁面 render、API、Server Action 出錯就呼叫。
// 之前這些錯誤只會出現在 logs/server.log，沒人看，除非網站整個掛掉被 watchdog 抓到。
// 一行一筆 JSON 寫到 logs/errors.log：時間、路徑（不含 ? 後面的查詢字串）、方法、哪一類（render／route／action／proxy）、錯誤訊息前 300 字、digest。
// 不記 cookie、header、IP、查詢字串。檔案超過 1MB 就只留最後 500 行。後台 /admin/ops 顯示最近的；watchdog 看到同一種錯誤 1 小時內 5 次以上就寄信。

export type ServerError = { t: string; path: string; method: string; kind: string; message: string; digest?: string };

const file = () => logFile("errors.log");
const MAX_BYTES = 1_000_000;

export function formatServerError(
  err: unknown,
  request: { path: string; method: string },
  context: { routeType?: string },
  now = Date.now(),
): ServerError {
  const message = err instanceof Error ? err.message : String(err);
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : undefined;
  return {
    t: new Date(now).toISOString(),
    path: request.path.split("?")[0].slice(0, 200),
    method: request.method,
    kind: context.routeType ?? "?",
    message: message.replace(/\s+/g, " ").slice(0, 300),
    ...(digest ? { digest } : {}),
  };
}

export function recordServerError(entry: ServerError) {
  try {
    const f = file();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.appendFileSync(f, `${JSON.stringify(entry)}\n`);
    if (fs.statSync(f).size > MAX_BYTES) {
      const lines = fs.readFileSync(f, "utf8").split("\n").filter(Boolean);
      fs.writeFileSync(f, `${lines.slice(-500).join("\n")}\n`);
    }
  } catch {
    // 記錄失敗不能讓請求再出一次錯
  }
}

/** 最近的錯誤（新→舊）。壞掉的行略過 */
export function readServerErrors(limit = 30): ServerError[] {
  try {
    return fs
      .readFileSync(file(), "utf8")
      .split("\n")
      .filter(Boolean)
      .slice(-500)
      .flatMap((l) => {
        try {
          return [JSON.parse(l) as ServerError];
        } catch {
          return [];
        }
      })
      .reverse()
      .slice(0, limit);
  } catch {
    return [];
  }
}
