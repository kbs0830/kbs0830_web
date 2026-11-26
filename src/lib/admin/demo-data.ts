import type { ViewModel } from "@/components/admin/AdminView";
import type { Decision } from "@/lib/admin/db";
import type { TodoItem } from "@/lib/admin/todo";

// 訪客參觀（/demo/admin，TODO G4）用的範例資料。全部是編的、只示範畫面長怎樣：
// 不放真的訪客數、IP、信箱、告警內容、待辦（真的待辦有私人計畫），也不放雷達位置。
// 時間用固定的範例日期（頁面是靜態的，build 時就排好）。

const t = (md: string, hm: string) => `2026-${md}T${hm}:00+08:00`;

export const demoOverview: ViewModel = {
  tiles: [
    { label: "今天訪客", value: "37", tone: "info" },
    { label: "現在線上", value: "2", tone: "info" },
    { label: "上次部署", value: "成功", sub: "11/26 16:20", tone: "ok" },
    { label: "自家雷達", value: "在線・6 架", sub: "樹莓派 58.2°C", tone: "ok" },
    { label: "30 天可用率", value: "99.98%", tone: "ok" },
    { label: "記憶體", value: "168 MB" },
    { label: "下一封週報", value: "11/30 09:00" },
    { label: "下一封月報", value: "12/1 09:00" },
  ],
  blocks: [
    {
      kind: "log",
      title: "最近的告警",
      en: "Alerts",
      rows: [
        { time: t("11-26", "01:51"), text: "開機通知（範例）", tone: "ok" },
        { time: t("11-13", "01:47"), text: "外網連不到，watchdog 自動重啟 Tunnel 後恢復（範例）", tone: "warn" },
        { time: t("11-04", "23:36"), text: "網站重啟後恢復正常（範例）", tone: "ok" },
      ],
    },
    {
      kind: "log",
      title: "登入紀錄",
      en: "Logins",
      limit: 4,
      rows: [
        { time: t("11-26", "16:44"), text: "Cloudflare 登入 · 手機 · iOS · Safari · 台灣 · 6 頁（範例）", tone: "ok" },
        { time: t("11-26", "02:14"), text: "家裡網路 · 桌機 · Windows · Chrome · 台灣 · 23 頁（範例）", tone: "ok" },
        { time: t("11-25", "22:10"), text: "桌機本機 · 桌機 · Windows · Chrome · 4 頁（範例）", tone: "ok" },
      ],
    },
  ],
};

export const demoOps: ViewModel = {
  tiles: [
    { label: "線上 build 槽", value: ".next-a", tone: "info" },
    { label: "這次啟動多久", value: "3 天" },
    { label: "上次備份", value: "11/26 03:00", tone: "ok" },
    { label: "90 天部署／退回", value: "228／1", tone: "warn" },
  ],
  blocks: [
    {
      kind: "log",
      title: "部署",
      en: "Deploys",
      limit: 6,
      rows: [
        ["11-26", "16:20", "成功・31 秒"], ["11-26", "02:59", "成功・33 秒"], ["11-26", "02:43", "成功・30 秒"],
        ["11-26", "02:23", "成功・32 秒"], ["11-26", "02:13", "成功・31 秒"], ["11-25", "23:29", "成功・30 秒"],
        ["11-25", "21:02", "退回上一版・45 秒"], ["11-25", "20:51", "成功・29 秒"],
      ].map(([md, hm, text]) => ({ time: t(md, hm), text, tone: text.startsWith("退回") ? ("warn" as const) : ("ok" as const) })),
    },
    {
      kind: "log",
      title: "重啟紀錄",
      en: "Restarts",
      limit: 5,
      rows: [
        { time: t("11-13", "01:47"), text: "Tunnel・watchdog 自動救回", tone: "ok" },
        { time: t("11-04", "23:36"), text: "網站・watchdog 自動救回", tone: "ok" },
        { time: t("11-03", "22:01"), text: "Tunnel・要人處理", tone: "warn" },
      ],
    },
    {
      kind: "log",
      title: "watchdog 告警",
      en: "Watchdog",
      limit: 6,
      rows: [
        { time: t("11-13", "01:47"), text: "外網檢查失敗：首頁 30 秒沒回應（範例）", tone: "warn" },
        { time: t("11-04", "23:36"), text: "網站重啟後恢復正常（範例）", tone: "ok" },
      ],
    },
  ],
};

export const demoMail: ViewModel = {
  tiles: [
    { label: "最後寄出的週報", value: "2026-11-23", tone: "ok" },
    { label: "最後寄出的月報", value: "2026-11", tone: "ok" },
    { label: "下一封週報", value: "11/30 09:00", tone: "info" },
    { label: "下一封月報", value: "12/1 09:00", tone: "info" },
  ],
  blocks: [
    {
      kind: "log",
      title: "寄送紀錄",
      en: "History",
      rows: [
        { time: t("11-23", "09:02"), text: "週報：sent", tone: "ok" },
        { time: t("11-16", "09:01"), text: "週報：sent", tone: "ok" },
        { time: t("11-01", "09:03"), text: "月報：sent", tone: "ok" },
      ],
    },
  ],
};

export const demoTraffic: ViewModel = {
  tiles: [
    { label: "真人造訪", value: "214", tone: "info" },
    { label: "瀏覽頁數", value: "631", tone: "info" },
    { label: "全部請求（含機器人）", value: "4,820" },
    { label: "404", value: "96", tone: "warn" },
  ],
  blocks: [
    { kind: "share", title: "誰在打網站", en: "Raw traffic", total: 4820, entries: [["瀏覽器", 1310], ["AI 爬蟲", 1580], ["搜尋引擎", 1120], ["其他機器人", 810]], note: "機器人前幾名：GPTBot、ClaudeBot、Googlebot、bingbot（範例）" },
    { kind: "share", title: "熱門頁面", en: "Pages", total: 631, entries: [["首頁", 240], ["製作物", 118], ["文章列表", 86], ["雷達", 64], ["本站構造", 41]] },
    { kind: "share", title: "來源", en: "Referrers", total: 214, entries: [["直接開", 92], ["Google", 61], ["GitHub", 33], ["社群", 28]] },
    { kind: "share", title: "404 網址", en: "Not found", total: 96, entries: [["/wp-login.php", 41], ["/.env", 30], ["/admin.php", 14]], note: "其中掃描器（找 .env、wp-admin 這類）91 次。" },
  ],
};

const item = (p: Partial<TodoItem> & Pick<TodoItem, "id" | "title" | "section" | "detail">): TodoItem => ({
  code: null, group: null, size: null, needsYou: false, recommended: false, status: "open",
  summary: p.detail.split("\n")[0].replace(/^（[^）]*）：?/, ""),
  ...p,
});

export const demoTodos: TodoItem[] = [
  item({ id: "D1", code: "D1", title: "首頁加一個季節小彩蛋", section: "還沒做的點子", group: "B. 網站功能", size: "S", recommended: true,
    detail: "（範例）冬天首頁偶爾飄幾片雪，不影響閱讀。\n- 做法：沿用首頁天空同步的天氣資料，只有真的冷的時候才出現\n- 手機版要量 30fps" }),
  item({ id: "D2", code: "D2", title: "作品頁加「技術選擇的理由」", section: "還沒做的點子", group: "B. 網站功能", size: "M",
    detail: "（範例）每個作品多一段：為什麼選這個框架、遇到什麼坑。\n- 先挑 3 個作品寫\n- 寫完放進文章系列" }),
  item({ id: "D3", code: "D3", title: "每月外部連結檢查", section: "還沒做的點子", group: "C. 維運", size: "S",
    detail: "（範例）每月跑一次，作品的 GitHub 連結、文章引用的網址壞掉就寄信。" }),
  item({ id: "D4", title: "提供作品截圖", section: "你要決定或提供素材的", needsYou: true,
    detail: "（範例）有兩個作品還是示意圖，換成真機截圖會更有說服力。" }),
];

export const demoDecisions: Decision[] = [
  { itemId: "D1", choice: "now", note: "", updatedAt: Date.UTC(2026, 10, 26, 6) },
  { itemId: "D2", choice: "later", note: "等期末後", updatedAt: Date.UTC(2026, 10, 26, 6) },
];

// 樹莓派分頁的範例：24 小時、每 5 分鐘一筆，溫度白天高晚上低、CPU 跟著飛機量起伏（數字是編的）
const piStart = Date.UTC(2026, 10, 25, 8); // 11/25 16:00（台灣）
const piHist = Array.from({ length: 288 }, (_, i) => {
  const hour = (16 + i / 12) % 24;
  const day = Math.sin(((hour - 8) / 24) * Math.PI * 2);
  const wobble = Math.sin(i / 7) * 0.6 + Math.sin(i / 2.3) * 0.2;
  return { t: piStart + i * 300_000, c: +(57 + day * 4 + wobble).toFixed(1), cpu: Math.round(22 + day * 8 + wobble * 3), mem: Math.round(17 + wobble) };
});

export const demoPi: ViewModel = {
  tiles: [
    { label: "狀態", value: "開機 3 天", sub: "更新 11/26 16:00", tone: "ok" },
    { label: "溫度", value: "58.2°C", sub: "24 小時最高 61.4°C", tone: "ok" },
    { label: "CPU 使用率", value: "24%", sub: "負載 0.98 / 1.02 / 0.95（4 核）", tone: "info" },
    { label: "記憶體", value: "17%", sub: "用 152／906 MB", tone: "info" },
    { label: "供電", value: "正常", sub: "get_throttled 0x0・核心 1.34 V", tone: "ok" },
    { label: "記憶卡", value: "正常", sub: "檔案系統 clean・累計寫入 41 GB", tone: "ok" },
    { label: "儲存空間", value: "23%", sub: "用 3.1 GB／14.0 GB", tone: "info" },
    { label: "Wi-Fi 訊號", value: "-62 dBm", sub: "普通", tone: "info" },
  ],
  blocks: [
    { kind: "log", title: "現在的問題", en: "Alerts", rows: [], empty: "沒有問題。溫度 75°C 以上、供電不足、記憶卡錯誤、空間 90% 以上、記憶體剩不到 80 MB、SSH 一小時連不上，會寄信通知。" },
    { kind: "series", title: "溫度", en: "Temperature", unit: "°C", warn: 75, min: 30, max: 85, points: piHist.map((p) => [p.t, p.c]) },
    { kind: "series", title: "CPU 使用率", en: "CPU", unit: "%", min: 0, max: 100, points: piHist.map((p) => [p.t, p.cpu]) },
    { kind: "series", title: "記憶體使用率", en: "Memory", unit: "%", min: 0, max: 100, points: piHist.map((p) => [p.t, p.mem]) },
    {
      kind: "facts",
      title: "硬體與系統",
      en: "System",
      rows: [
        ["型號", "Raspberry Pi 3 Model B（範例）"],
        ["系統", "Debian GNU/Linux 12 (bookworm)"],
        ["CPU 時脈", "1200 MHz"],
        ["記憶卡", "16 GB（範例）"],
        ["接收程式", "fr24feed 執行中"],
        ["多久讀一次", "每 5 分鐘（SSH，唯讀）"],
      ],
    },
  ],
};
