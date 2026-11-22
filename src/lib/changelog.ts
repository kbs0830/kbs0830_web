import { execFileSync } from "node:child_process";

// 網站更新紀錄 /changelog（TODO B1，2026-11-21）：從 git 的 `feat` commit 自動產生，跟新功能指示燈
// （deploy.ps1 的 Update-FeatureRelease）同一條規則——commit 訊息照慣例寫，真的是新功能才用 feat。
// build 時跑一次 git log（頁面是靜態的，部署一定是在 repo 裡 build）；讀不到 git 就是空清單，不讓 build 失敗。
//
// commit 訊息原本是寫給自己看的，有些提到本名、通知信箱、金鑰、內部細節。兩層把關：
//   1. OVERRIDES：指定 commit 改寫成給人看的版本，或 null 整則不列
//   2. PRIVATE_PATTERN：保險，之後的 commit 不小心寫到這些字也不會上線（整則不列）
// changelog.test.ts 會拿真的 git log 跑一次，確認公開出去的沒有這些字。

export interface ChangelogEntry {
  sha: string;
  date: string; // YYYY-MM-DD（台灣時間）
  scope: string; // 中文分類
  text: string;
}

/** commit 短 hash → 改寫後的文字；null＝不列 */
export const OVERRIDES: Record<string, string | null> = {
  // 本名相關：只給搜尋引擎／AI 讀的設定，不需要在頁面上講
  bb33d78: null,
  "41ec82d": null,
  // 原文有通知信箱、token、內部評估紀錄
  b9bad56: "提醒信：有日期的待辦到期自動寄信，可附即時檢查結果",
  "42b46c6": "Cloudflare 靜態頁快取，部署切換後自動清快取",
  "9f2d1b6": "CSP 正式開（會擋），被擋的照樣回報",
  "4fbd30d": "Cloudflare 設定寫成腳本（HTTPS、HSTS、www 導向、WAF 擋掃描器）",
  // 原文寫「含權益與效期」，後來依使用者要求拿掉了，照原文會跟頁面對不上
  f115e95: "會籍——飯店／航空／貴賓室／郵輪／租車，只寫計畫名稱跟等級",
};

/** 公開頁面不能出現的字（本名、信箱、內網、金鑰、雷達位置） */
export const PRIVATE_PATTERN =
  /李秉威|本名|real name|alternateName|otemon|@[a-z0-9-]+\.[a-z]|192\.168\.|token|金鑰|secret|password|小港|雷達代碼/i;

const SCOPE_NAMES: Record<string, string> = {
  airports: "機場時刻表",
  api: "API",
  blog: "部落格",
  colophon: "本站構造",
  brand: "網站圖示",
  cloudflare: "Cloudflare",
  flights: "飛行紀錄",
  footer: "頁尾",
  hero: "首頁",
  hotels: "住宿紀錄",
  mobile: "手機版",
  ops: "維運",
  portfolio: "作品集",
  projects: "作品",
  radar: "自家雷達",
  security: "安全性",
  seo: "SEO",
  stats: "訪客分析",
  status: "維運狀態",
  travel: "旅行地球",
  ui: "介面",
};

const FEAT = /^feat(?:\(([^)]+)\))?!?:\s*(.+)$/;

/** `git log --format=%h%x1f%cI%x1f%s` 的輸出 → 公開的更新紀錄（新的在前，跟 git log 同順序） */
export function parseChangelog(raw: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  for (const line of raw.split("\n")) {
    const [sha, time, subject] = line.split("\x1f");
    if (!sha || !time || !subject) continue;
    const m = FEAT.exec(subject.trim());
    if (!m) continue;
    const short = sha.slice(0, 7);
    const override = OVERRIDES[short];
    if (override === null) continue;
    const text = override ?? m[2].trim();
    if (PRIVATE_PATTERN.test(text)) continue;
    entries.push({ sha: short, date: taipeiDate(time), scope: SCOPE_NAMES[m[1] ?? ""] ?? "網站", text });
  }
  return entries;
}

function taipeiDate(iso: string): string {
  // en-CA 的日期格式剛好是 YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date(iso));
}

export function readChangelog(): ChangelogEntry[] {
  // build 時 next.config.ts 先讀好（env 寫死進來）；在產生靜態頁的 worker 裡自己跑 git，
  // CI runner 部署時會拿到空的（2026-11-21 第一次上線就這樣，原因沒查到、錯誤被吞掉）
  const fromBuild = process.env.BUILD_FEAT_LOG;
  if (fromBuild) return parseChangelog(fromBuild);
  // 單元測試、沒有經過 next.config 的情況才直接讀 git
  try {
    // 不經過 cmd.exe（格式字串的 % 不給 shell 碰）
    const raw = execFileSync("git", ["log", "--no-merges", "--format=%h%x1f%cI%x1f%s"], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    return parseChangelog(raw);
  } catch (e) {
    console.warn(`[changelog] git log 失敗：${e instanceof Error ? e.message : e}`);
    return [];
  }
}

/** 依月份分組（YYYY-MM → 那個月的項目），順序跟輸入一樣 */
export function groupByMonth(entries: ChangelogEntry[]): [month: string, items: ChangelogEntry[]][] {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), e]);
  }
  return [...groups.entries()];
}
