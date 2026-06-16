export interface Project {
  slug: string;
  title: string;
  titleJa: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  tags: string[];
  github?: string;
  highlight: string;
  highlightZh: string;
  status: "完成" | "製作中" | "學習記録" | "課程専題";
  isPersonal?: boolean;
}

export const projects: Project[] = [
  // ── 個人專案 ─────────────────────────────────
  {
    slug: "foodlens-advisor",
    title: "FoodLens Advisor",
    titleJa: "フードレンズ",
    titleZh: "食物辨識助手",
    description:
      "Browser-side YOLOv8 (ONNX Runtime) detects food in-device; only text labels are sent to Gemini for dietary analysis. Thin client + cloud brain architecture.",
    descriptionZh:
      "瀏覽器端 YOLOv8（ONNX Runtime）辨識食物，影像不離裝置；僅傳送文字標籤至 Gemini 進行營養分析。薄客戶端＋雲端大腦架構，隱私優先。",
    tags: ["Python", "FastAPI", "YOLOv8", "ONNX Runtime", "Gemini API", "TensorFlow.js"],
    github: "https://github.com/kbs0830/FoodLens-Advisor",
    highlight: "Token cost ~300–1000× lower vs. image-based AI",
    highlightZh: "Token 成本降低約 300～1000 倍，影像不上傳",
    status: "完成",
    isPersonal: true,
  },
  {
    slug: "yartix-ticketing",
    title: "YARTIX Ticketing",
    titleJa: "チケットシステム",
    titleZh: "購票系統",
    description:
      "Event registration and ticketing platform for a cultural event organizer. Handles registration, LINE & email payment confirmation, Google Sheets storage, and retry queue.",
    descriptionZh:
      "文化活動線上報名售票平台。支援 LINE／Email 付款確認、Google Sheets 資料儲存、Email 重試機制，部署至 Render。",
    tags: ["Python", "Flask", "JavaScript", "Google Sheets API", "LINE Pay", "Gunicorn"],
    github: "https://github.com/kbs0830/YARTIX-TICKETING-TEST",
    highlight: "Full registration flow: form → payment → email notification",
    highlightZh: "完整報名流程：填表 → 付款確認 → Email 通知",
    status: "完成",
    isPersonal: true,
  },

  {
    slug: "frc-robot",
    title: "FRC Robot Team",
    titleJa: "ロボット競技団",
    titleZh: "FRC 機器人競技",
    description:
      "FIRST Robotics Competition team member. Built Raspberry Pi vision system, LabVIEW programming, CNC machining and argon welding. Team won National Championship Alliance 2023.",
    descriptionZh:
      "參與 FIRST Robotics Competition 機器人競賽。團隊榮獲 2023 年全國冠軍聯盟。",
    tags: ["Python", "Raspberry Pi", "LabVIEW", "CNC", "FRC"],
    github: "",
    highlight: "National Championship Alliance — FRC 2023",
    highlightZh: "2023 FRC · 全國冠軍聯盟",
    status: "完成",
    isPersonal: true,
  },
  {
    slug: "auto-following-robot",
    title: "Auto-Following Robot",
    titleJa: "自動追従ロボット",
    titleZh: "自動跟隨機器人",
    description:
      "Jetson Nano + Python vision system with Arduino relay-driven chassis. Real-time object tracking via camera. Won Excellence Award at the 2024 National Special Projects Competition (動力機械群).",
    descriptionZh:
      "Jetson Nano 搭配 Python 即時辨識系統，透過 Arduino 繼電器驅動底盤追蹤目標。參加 2024 年全國專題競賽，獲動力機械群全國佳作。",
    tags: ["Python", "Jetson Nano", "Arduino", "OpenCV", "Raspberry Pi"],
    github: "",
    highlight: "2024 National Special Projects Competition — Excellence Award",
    highlightZh: "2024 全國專題競賽 · 動力機械群全國佳作",
    status: "完成",
    isPersonal: true,
  },

  // ── 課程専題 ─────────────────────────────────
  {
    slug: "yen-rate-analyzer",
    title: "JPY Rate Analyzer",
    titleJa: "円相場分析システム",
    titleZh: "日圓匯率分析系統",
    description:
      "Real-time JPY monitoring platform. Parallel crawlers scrape multiple banks; Yahoo Finance fills historical data. LKG fallback ensures HA. Purchase decision engine outputs 'buy now / wait' advice.",
    descriptionZh:
      "即時日圓匯率監控平台。配置驅動並行爬蟲抓取多家銀行資料，Yahoo Finance 補全歷史走勢，LKG 回退確保高可用。購買力決策引擎直接輸出「現在就買／再等等」建議。",
    tags: ["Python", "Flask", "SQLite", "BeautifulSoup4", "Pandas", "Matplotlib", "Yahoo Finance API"],
    github: "https://github.com/kbs0830/school",
    highlight: "LKG fallback + purchase decision engine (actionable insight)",
    highlightZh: "LKG 容錯回退 ＋ 可執行購買建議（非僅資料展示）",
    status: "課程専題",
  },
  {
    slug: "expense-tracker",
    title: "Personal Finance Tracker",
    titleJa: "家計簿アプリ",
    titleZh: "個人記帳分析系統",
    description:
      "Desktop expense tracker built with PyQt5 + SQLite. Supports budget management, consumption pattern charts, and multi-category analysis. Group project for 程式設計(三).",
    descriptionZh:
      "PyQt5 桌機記帳應用，整合 SQLite 儲存。支援預算管理、消費圖表分析、多類別統計。程式設計（三）小組期末専題。",
    tags: ["Python", "PyQt5", "SQLite", "Matplotlib", "資料視覺化"],
    github: "https://github.com/kbs0830/school",
    highlight: "Desktop GUI with real-time chart rendering",
    highlightZh: "桌機 GUI ＋ 即時圖表渲染，完整 CRUD 操作",
    status: "課程専題",
  },
  {
    slug: "school",
    title: "Learning Records",
    titleJa: "学習記録",
    titleZh: "課程學習記録",
    description:
      "Coursework spanning HTML/CSS/PHP, Python, databases, big data, AI & deep learning, and investment analysis — organised by semester.",
    descriptionZh:
      "涵蓋 HTML／CSS／PHP、Python 程式設計二三、資料庫、大數據倉儲、人工智慧與深度學習、投資決策應用等課程，依學期整理。",
    tags: ["HTML/CSS", "PHP", "Python", "SQL", "PyQt5", "Flask", "Orange", "深度學習"],
    github: "https://github.com/kbs0830/school",
    highlight: "Organised learning journey from web basics to AI applications",
    highlightZh: "從網頁基礎到 AI 應用的完整學習歷程記録",
    status: "學習記録",
  },
];

export const personalProjects = projects.filter((p) => p.isPersonal);
export const courseProjects = projects.filter((p) => !p.isPersonal);
