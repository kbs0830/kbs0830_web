// About section 的資料（技能、時間軸、足跡）。畫面在 components/sections/AboutSection.tsx。
// 全部是真實資料，新增/修改前請確認內容屬實（見 CLAUDE.md）。

export const skills = [
  {
    category: "AI · 機器学習",
    categoryEn: "AI / ML",
    items: [
      { name: "Python", level: 5 },
      { name: "YOLOv8", level: 4 },
      { name: "ONNX Runtime Web", level: 3 },
      { name: "TensorFlow.js", level: 3 },
      { name: "Gemini API", level: 4 },
      { name: "高科 iAI API（校內，學校專案用）", level: 2 },
      { name: "Ultralytics", level: 4 },
      { name: "Pydantic v2", level: 3 },
      { name: "Jetson Nano", level: 3 },
      { name: "Raspberry Pi", level: 3 },
      { name: "OpenCV", level: 3 },
    ],
  },
  {
    category: "後端 · バックエンド",
    categoryEn: "Backend",
    items: [
      { name: "FastAPI", level: 4 },
      { name: "Flask", level: 4 },
      { name: "Blueprint 路由", level: 4 },
      { name: "REST API 設計", level: 4 },
      { name: "Google Sheets API", level: 3 },
      { name: "環境変数管理", level: 3 },
      { name: "Render 部署", level: 3 },
    ],
  },
  {
    category: "前端 · フロントエンド",
    categoryEn: "Frontend",
    items: [
      { name: "Next.js 16", level: 4 },
      { name: "React 19", level: 4 },
      { name: "TypeScript", level: 4 },
      { name: "Tailwind CSS v4", level: 4 },
      { name: "Framer Motion", level: 3 },
      { name: "Three.js", level: 3 },
      { name: "React Three Fiber", level: 3 },
      { name: "Vanilla JS (ES6)", level: 4 },
    ],
  },
  {
    category: "工具 · 開発環境",
    categoryEn: "Tools & Environment",
    items: [
      { name: "VSCode", level: 5 },
      { name: "pnpm", level: 4 },
      { name: "Git", level: 4 },
      { name: "Windows 11", level: 5 },
      { name: "Arduino", level: 3 },
      { name: "Gunicorn", level: 3 },
      { name: "LINE Pay API", level: 2 },
      { name: "丙級電腦硬體裝修", level: 3 },
    ],
  },
  {
    category: "学習中 · 探索領域",
    categoryEn: "Currently Learning",
    items: [
      { name: "WebGL Shader", level: 1 },
      { name: "React Three Fiber 進階", level: 2 },
      { name: "Electron 打包部署", level: 1 },
      { name: "エッジ AI 推論", level: 2 },
      { name: "システム設計", level: 2 },
      { name: "日本語 N5", level: 1 },
    ],
  },
];

interface VisitedCountry {
  flag: string;
  country: string;
  countryEn: string;
  cities: string[];
}

// 航班明細 2026-11-05 搬到 lib/travel/flights.ts（/flights 頁），這裡只留國家跟城市。
// 韓國、越南、札幌／名古屋／旭川／石垣是 2026-11-05 依使用者提供的飛行紀錄、經使用者確認後加上的。
export const visitedCountries: VisitedCountry[] = [
  {
    flag: "🇯🇵",
    country: "日本",
    countryEn: "Japan",
    cities: ["福岡", "大阪", "東京", "京都", "札幌", "名古屋", "秋田", "旭川", "沖繩", "石垣"],
  },
  { flag: "🇰🇷", country: "韓國", countryEn: "South Korea", cities: [] },
  { flag: "🇻🇳", country: "越南", countryEn: "Vietnam", cities: ["河內"] },
  { flag: "🇹🇭", country: "泰國", countryEn: "Thailand", cities: ["曼谷"] },
  { flag: "🇭🇰", country: "香港", countryEn: "Hong Kong", cities: [] },
  { flag: "🇺🇸", country: "美國", countryEn: "USA", cities: ["德州"] },
];

export const planningCountries = [
  { flag: "🇸🇬", country: "新加坡", countryEn: "Singapore" },
  { flag: "🇲🇾", country: "馬來西亞", countryEn: "Malaysia" },
];

export const timeline = [
  {
    year: "2021", zh: "進入市立中正高工 資訊科",                      en: "Enrolled at Zhongzheng Hi-Tech — Information",
    detailZh: "從 HTML/CSS、C、Python 基礎課程開始，第一次接觸程式設計。",
    detailEn: "Started with HTML/CSS, C, and Python fundamentals.",
  },
  {
    year: "2022", zh: "加入 FRC 機器人隊",      en: "Joined FRC robotics team",
    detailZh: "學習 CNC 加工與電控配線。",
    detailEn: "Learned CNC machining and control wiring.",
  },
  {
    year: "2023", zh: "自動跟隨機器人 · 全國專題競賽動力機械群佳作",    en: "Won Excellence Award at the national project competition (auto-following robot)",
    detailZh: "以 Jetson Nano ＋ Arduino 打造即時視覺追蹤系統。",
    detailEn: "Built a Jetson Nano + Arduino real-time vision-tracking system.",
  },
  {
    year: "2024", zh: "高工畢業 · 升讀國立高科大 智慧商務系",          en: "Graduated · Enrolled at NKUST Intelligent Commerce",
    detailZh: "從高工資訊科畢業，升讀國立高雄科技大學智慧商務系。",
    detailEn: "Graduated from the vocational IT program and enrolled at NKUST Intelligent Commerce.",
  },
  {
    year: "2025", zh: "完成 FoodLens Advisor & 活動報名系統",              en: "Shipped FoodLens Advisor & event registration system",
    detailZh: "FoodLens Advisor（YOLOv8 ＋ Gemini）與活動報名系統（Flask ＋ LINE Pay）皆完成部署。",
    detailEn: "Shipped FoodLens Advisor (YOLOv8 + Gemini) and a Flask + LINE Pay event registration system.",
  },
  {
    year: "2026", zh: "持續製作中",                                  en: "Still building",
    detailZh: "打磨這個網站、開新專案，同時準備日本語 N5。",
    detailEn: "Polishing this site and starting new projects while preparing for the JLPT N5.",
  },
];

// 2026-11-26 文案統一（TODO N11）：標籤一律兩個中文字＋全形空格，值裡才放日文點綴、分隔一律「 · 」。
// 開發環境那行使用者要拿掉（/uses 有完整清單）；Claude Code 是主力工具，放這裡（TODO N2：副標不放工具名）
export const statusLines = [
  "就讀　國立高科大 智慧商務系 · 三年級（燕巢）· 20 歲",
  "所在　高雄 🇹🇼 ⇄ 福岡 🇯🇵",
  "專長　AI × Web",
  "工具　Claude Code",
  "日語　N5 学習中",
  "興趣　交通運輸 · 鐵道",
  "歡迎　合作 · 技術交流 · 閒聊",
];
