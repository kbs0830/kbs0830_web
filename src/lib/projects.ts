export interface ProjectDetailSection {
  heading: string;
  headingEn?: string;
  body: string[];
}

export interface ProjectDetail {
  intro: string;
  sections: ProjectDetailSection[];
  context?: string; // 課程/團隊背景等補充說明，不含第三方姓名
}

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
  image?: string;
  detail?: ProjectDetail;
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
    detail: {
      intro:
        "FoodLens Advisor 是一套「瀏覽器端辨識 + 雲端 AI 分析」的輕量飲食助手，採用 Thin Client + Cloud Brain 混合架構：使用者上傳一張食物照片，立即獲得熱量估算、三大營養素分析與個人化飲食建議。",
      sections: [
        {
          heading: "架構管線",
          headingEn: "Pipeline",
          body: [
            "瀏覽器端：ONNX Runtime Web（WASM）執行 YOLOv8 ONNX 模型，偵測中亞料理食物（46 類），輸入 640×640 letterbox，信心度門檻 0.25",
            "備援層：ONNX 偵測結果為零時，自動切換 TensorFlow.js + COCO-SSD（80 類通用食物，CDN 載入）",
            "後端分析：偵測到的食物標籤（純文字，非圖片）POST 到 FastAPI 後端，呼叫 Google Gemini 2.5 Flash Lite 做深度分析",
            "後端備援：FastAPI 端另有 YOLOv8（伺服器端推理）與 ResNet-50 Food-101 分類模型作為多層備援",
          ],
        },
        {
          heading: "技術亮點",
          headingEn: "Highlights",
          body: [
            "圖片全程留在瀏覽器本地，只有文字標籤離開裝置，隱私優先",
            "傳送文字標籤（約 10–30 token）取代圖片 base64（數千 token），大幅降低 API 成本",
            "ONNX → COCO-SSD → Gemini 多層備援鏈，任一層失敗系統仍可繼續運作",
            "前端無框架依賴：純 HTML5 / CSS3 / Vanilla JS，不需要 Node.js 或打包工具",
          ],
        },
        {
          heading: "技術棧",
          headingEn: "Stack",
          body: [
            "前端推理：ONNX Runtime Web（WASM）+ TensorFlow.js COCO-SSD",
            "後端框架：FastAPI + Pydantic v2（型別安全的請求/回應模型）",
            "AI 分析：Google Gemini 2.5 Flash Lite",
            "後端備援模型：Ultralytics YOLOv8、HuggingFace ResNet-50 Food-101",
          ],
        },
      ],
    },
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
    image: "/image/projects/yartix.png",
    detail: {
      intro:
        "為「台灣鐵道文化意象 TWRIC」活動製作的線上報名售票系統，前後端分離架構：後端 Flask API 處理報名、付款與通知邏輯，前端純 HTML/CSS/JS 頁面，部署在 Render（gunicorn 啟動）。",
      sections: [
        {
          heading: "架構",
          headingEn: "Architecture",
          body: [
            "後端（backend/）：Flask API 入口 app.py，拆分 config／registration_service／sheet_service／email_service／models／errors／logging_utils／startup_guard 等模組",
            "前端（frontend/）：templates + static 靜態資源，與後端完全分離",
            "資料儲存：Google Sheets API 即時寫入，非傳統資料庫",
            "部署：Render 免費方案，WSGI 入口 backend.app:app，並保留根目錄 app.py shim 相容舊版 gunicorn 啟動指令",
          ],
        },
        {
          heading: "技術亮點",
          headingEn: "Highlights",
          body: [
            "雙軌付款確認：LINE 私訊或 Email 回覆皆可，並附「帳號後五碼」加速對帳",
            "Email 發送失敗有獨立重試佇列（/api/retry-email-queue），不會靜默丟信",
            "明確的錯誤碼系統：E_VALIDATION、E_SHEET_UNAVAILABLE、E_SHEET_WRITE、E_SMTP_SEND 等，方便追蹤問題發生在哪一層",
            "響應式前端設計，行動裝置參加者選擇器改為下拉式選單操作",
          ],
        },
        {
          heading: "API",
          body: [
            "GET /api/bootstrap — 載入活動設定與剩餘名額",
            "POST /api/register — 送出報名",
            "POST /api/retry-email-queue — 重送失敗付款信",
          ],
        },
      ],
    },
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
    detail: {
      intro:
        "參與 FIRST Robotics Competition（FRC）機器人競賽，負責 Raspberry Pi 視覺系統與 LabVIEW 程式，並參與機構的 CNC 加工與氬焊製作。團隊在 2023 年賽季拿下全國冠軍聯盟。",
      sections: [
        {
          heading: "負責項目",
          headingEn: "Role",
          body: [
            "Raspberry Pi 視覺系統開發",
            "LabVIEW 機器人控制程式",
            "機構製作：CNC 加工、氬焊",
          ],
        },
      ],
      context: "這是實體硬體競賽專案，沒有公開程式碼倉庫，細節以團隊比賽紀錄為主。",
    },
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
    detail: {
      intro:
        "以 Jetson Nano 搭配 Python 建置即時視覺辨識系統，透過 Arduino 繼電器驅動底盤，讓機器人可以即時追蹤鏡頭前的目標移動。參加 2024 年全國專題競賽動力機械群，獲得全國佳作。",
      sections: [
        {
          heading: "系統組成",
          headingEn: "Components",
          body: [
            "Jetson Nano：即時影像辨識運算",
            "OpenCV：目標偵測與追蹤",
            "Arduino：接收辨識結果，透過繼電器驅動底盤馬達",
          ],
        },
      ],
      context: "這是實體硬體競賽專案，沒有公開程式碼倉庫，細節以團隊比賽紀錄為主。",
    },
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
    detail: {
      intro:
        "基於 Python 的即時日圓匯率監控與分析平台，採用配置驅動架構整合多家銀行匯率資訊，透過並行爬蟲抓取最新匯率、SQLite 落盤保存，Flask 提供介面與 REST API，並附商品換算與歷史趨勢圖。「大數據倉儲」課程期末専題。",
      sections: [
        {
          heading: "架構重點",
          headingEn: "Architecture",
          body: [
            "配置驅動爬蟲：銀行資料源定義於獨立 config，新增資料源只需改設定檔，並行抓取提升效率",
            "資料持久化層：Repository Pattern 統一資料存取介面，支援交易管理與一致性保證",
            "業務服務層：整合快取減少網路請求，實作 Last Known Good（LKG）回退策略確保服務可用性",
            "歷史資料補全：整合 Yahoo Finance API 自動回填歷史匯率，支援長期趨勢分析",
          ],
        },
        {
          heading: "購買力決策引擎（創新亮點）",
          headingEn: "Purchase Decision Engine",
          body: [
            "獨創演算法：結合使用者預算與商品目標價格，計算損益平衡點",
            "直接輸出「現在就買／再等等」的可執行建議，而不只是丟一張匯率圖表給使用者自己判斷",
          ],
        },
      ],
      context: "「大數據倉儲」課程期末専題。",
    },
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
    detail: {
      intro:
        "專為大學生設計的桌面端記帳應用：大多數大學生經濟來源依賴每月固定生活費，卻常因聚餐、娛樂課金、通勤等瑣碎開銷導致月底透支。本系統用 PyQt5 圖形介面搭配 SQLite 資料庫與 Matplotlib 視覺化，提供無廣告、輕量化、啟動快速的記帳方案。「程式設計(三)」小組期末専題。",
      sections: [
        {
          heading: "核心理念",
          headingEn: "Design Principles",
          body: [
            "簡潔優先：去除複雜功能，專注核心記帳需求",
            "深色模式優先：預設深色主題，符合現代軟體趨勢",
            "輕量快速：SQLite 資料庫，啟動即用",
            "預算智慧監控：三段式紅綠燈警示（良好／接近／超支），防止超支",
          ],
        },
        {
          heading: "功能特色",
          headingEn: "Features",
          body: [
            "記帳管理：新增／刪除消費記錄（日期、項目、類別、金額），表格化顯示",
            "預算監控：設定月度預算上限，即時顯示消費進度",
            "數據視覺化：圓餅圖即時顯示類別分布，空白資料時優雅顯示",
            "主題切換：深色／淺色模式一鍵切換",
          ],
        },
      ],
      context: "「程式設計(三)」智商二乙 第十一組期末専題，與組員共同完成。",
    },
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
