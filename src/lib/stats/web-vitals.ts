import { dataFile, readJsonFile } from "@/lib/data-file";

// 訪客實際的 Web Vitals（/api/web-vitals 收、/api/web-vitals GET 跟 /reports 讀）。2026-11-25 從 route 抽出來，p75 原本寫了兩份。
// 檔案：data/web-vitals.json＝頁面路徑 → 指標 → 最近的數值（每組最多 200 筆）

export type Vitals = Record<string, Record<string, number[]>>;

export const vitalsFile = () => dataFile("WEB_VITALS_FILE", "web-vitals.json");
export const readVitals = (): Vitals => readJsonFile<Vitals>(vitalsFile()) ?? {};

/** 第 75 百分位（Google 判斷 good／poor 用的就是 p75） */
export const p75 = (values: number[]) => values.toSorted((a, b) => a - b)[Math.floor((values.length - 1) * 0.75)];
