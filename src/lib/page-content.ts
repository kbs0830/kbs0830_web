// /now、/uses、/resume 的內容資料。頁面（src/app/*/page.tsx）跟 Markdown 版（lib/markdown.ts）共用，
// 只維護這一份。全部是真實資料，改之前先確認屬實（見 CLAUDE.md）。
// ⚠️ 改 resume 那幾段會觸發部署時重印 public/resume.pdf（deploy.ps1 的來源清單有這個檔案）

export const nowItems = [
  "就讀國立高科大 智慧商務系 三年級（燕巢）",
  "持續建構這個個人網站，累積 side project",
  "學習 React Three Fiber 進階、WebGL Shader",
  "研究本地端 ML 推理（edge AI）與 Electron 打包部署",
  "日本語 N5 学習中",
  "維護 FoodLens Advisor 與活動報名系統兩個個人専案",
];

export const usesGroups = [
  {
    title: "硬體 · Hardware",
    items: [
      { name: "Desktop", detail: "i7-12700 + RTX 3070（部署主機，跑 Next.js / YOLOv8 推論）" },
      { name: "Laptop", detail: "Zenbook A14 ARM（日常開發）" },
    ],
  },
  {
    title: "編輯器 · Editor",
    items: [
      { name: "VSCode", detail: "主要編輯器" },
      { name: "Claude Code", detail: "AI 輔助開發" },
    ],
  },
  {
    title: "開發工具 · Dev Tools",
    items: [
      { name: "Git / GitHub", detail: "版本控制" },
      { name: "pnpm", detail: "套件管理" },
      { name: "Windows 11", detail: "作業系統" },
      { name: "Cloudflare Tunnel", detail: "本機部署對外服務" },
      { name: "GitHub Actions (self-hosted)", detail: "CI/CD，push 到 main 自動部署" },
    ],
  },
  {
    title: "技術棧 · Stack",
    items: [
      { name: "Next.js 16 + TypeScript", detail: "本網站" },
      { name: "FastAPI / Flask", detail: "後端 API" },
      { name: "YOLOv8 / ONNX Runtime / Gemini API", detail: "AI 推論" },
      { name: "Tailwind CSS v4 + 原生 CSS 動畫 / View Transitions", detail: "樣式與動畫" },
    ],
  },
];

export const resumeRole = "AI 工程師 · 網頁開發者 / AI Engineer · Web Developer";

export const education = [
  {
    school: "國立高雄科技大學",
    schoolEn: "National Kaohsiung University of Science and Technology",
    program: "智慧商務系",
    period: "2024 – 至今",
  },
  {
    school: "高雄市立中正高級工業職業學校",
    schoolEn: "Kaohsiung Municipal Zhongzheng Vocational High School",
    program: "資訊科",
    period: "2021 – 2024",
  },
];

// 證照（2026-11-09 使用者給的 104 履歷 PDF「資格認證」那段，原文照抄、沒查到發證單位的就不寫）。
// 同一份 PDF 裡的電話、地址、役別、工作經歷、求職條件都不放（使用者只說資格認證可以寫）。
export const certifications = [
  { group: "技術", items: [{ name: "丙級電腦硬體裝修技術士", issuer: "勞動部勞動力發展署技能檢定中心" }, { name: "GTC 全民科技力認證" }, { name: "業餘無線電第三級" }] },
  { group: "語言", items: [{ name: "Duolingo 英語測試", detail: "80 分" }] },
  { group: "其他", items: [{ name: "珠算心算聯合測試五級" }, { name: "普通小型車駕照（手排）", issuer: "交通部公路總局" }, { name: "普通重型機車駕照", issuer: "交通部公路總局" }] },
] satisfies { group: string; items: { name: string; issuer?: string; detail?: string }[] }[];

export const resumeSkillGroups = [
  { label: "AI / 機器学習", items: ["Python", "YOLOv8", "ONNX Runtime", "TensorFlow.js", "Gemini API", "OpenCV"] },
  { label: "後端", items: ["FastAPI", "Flask", "REST API 設計", "Google Sheets API"] },
  { label: "前端", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js / R3F"] },
  { label: "工具", items: ["Git", "Jetson Nano", "Raspberry Pi", "Arduino", "丙級電腦硬體裝修"] },
];

export const resumeFeaturedSlugs = ["foodlens-advisor", "kbs0830-web", "ticketing-system", "frc-robot", "auto-following-robot"];
