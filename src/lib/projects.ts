export interface ProjectDetailSection {
  heading: string;
  headingEn?: string;
  body: string[];
}

export interface ProjectDetail {
  intro: string;
  sections: ProjectDetailSection[];
  context?: string; // 課程/團隊背景等補充說明，不含第三方姓名
  architectureDiagram?: string; // Mermaid flowchart 語法，內容須對應 sections 裡已經寫的真實架構，不要編造新細節
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
      architectureDiagram: `flowchart TD
  A["使用者上傳照片"] --> B["瀏覽器端<br/>ONNX Runtime Web (YOLOv8)"]
  B -->|"偵測到食物"| D["文字標籤"]
  B -->|"偵測為零"| C["TensorFlow.js<br/>COCO-SSD 備援"]
  C --> D
  D -->|"POST 純文字標籤<br/>圖片不上傳"| E["FastAPI 後端"]
  E --> F["Gemini 2.5 Flash Lite"]
  F --> G["熱量／營養素／飲食建議"]`,
    },
  },
  {
    slug: "ticketing-system",
    title: "Event Registration System",
    titleJa: "イベント受付システム",
    titleZh: "活動報名系統",
    description:
      "Event registration system for a cultural event organizer. Handles registration, LINE & email payment confirmation, Google Sheets storage, and retry queue.",
    descriptionZh:
      "文化活動線上報名系統。支援 LINE／Email 付款確認、Google Sheets 資料儲存、Email 重試機制，部署至 Render。",
    tags: ["Python", "Flask", "JavaScript", "Google Sheets API", "LINE Pay", "Gunicorn"],
    github: "",
    highlight: "Full registration flow: form → payment → email notification",
    highlightZh: "完整報名流程：填表 → 付款確認 → Email 通知",
    status: "完成",
    isPersonal: true,
    detail: {
      intro:
        "為文化活動主辦單位製作的線上報名售票系統，前後端分離架構：後端 Flask API 處理報名、付款與通知邏輯，前端純 HTML/CSS/JS 頁面，部署在 Render（gunicorn 啟動）。",
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
      architectureDiagram: `flowchart TD
  U["訪客"] -->|"填寫報名表單"| F["前端<br/>frontend/ 靜態頁面"]
  F -->|"POST /api/register"| B["Flask API<br/>backend/app.py"]
  B --> R["registration_service"]
  R --> S["sheet_service"]
  S --> G[("Google Sheets")]
  R --> E["email_service"]
  E -->|"付款確認信"| U
  E -.失敗重試.-> Q["/api/retry-email-queue"]`,
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
    image: "/image/projects/frc-robot.jpg",
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
      "Jetson Nano + YOLOv8 real-time person tracking driving a repurposed FRC chassis via Arduino and an H-bridge motor driver. Won Excellence Award at the 2024 National Special Projects Competition (動力機械群).",
    descriptionZh:
      "Jetson Nano 執行 YOLOv8 即時人員辨識，透過 Arduino ＋ H 橋馬達驅動器控制沿用自 FRC 的底盤追蹤目標。參加 2024 年全國專題競賽，獲動力機械群全國佳作。",
    tags: ["Python", "Jetson Nano", "YOLOv8", "OpenCV", "Arduino"],
    github: "",
    highlight: "2024 National Special Projects Competition — Excellence Award",
    highlightZh: "2024 全國專題競賽 · 動力機械群全國佳作",
    status: "完成",
    isPersonal: true,
    image: "/image/projects/auto-following-robot.jpg",
    detail: {
      intro:
        "原始競賽作品名稱為「小跟班（跟隨工具車）」：以 Jetson Nano 執行 YOLOv8 即時物件追蹤辨識人員，透過 GPIO 訊號交由 Arduino 判斷，再用 BTS-7960 馬達驅動器控制沿用自 FRC 的 AM14U5 底盤與 CIM 馬達追蹤目標移動。發想自汽修廠工具車多仰賴人力搬運、易生工安風險，參加 112 學年度全國高級中等學校專業群科專題實作及創意競賽動力機械群，獲得全國佳作。",
      sections: [
        {
          heading: "系統組成",
          headingEn: "Components",
          body: [
            "Jetson Nano 4GB ＋ Logitech C270（720p）：即時影像辨識運算來源",
            "YOLOv8（Ultralytics 訓練、Roboflow 建立資料集）＋ OpenCV：物件偵測與追蹤，輸出辨識框高度／數量／信心值",
            "Arduino UNO ＋ BTS-7960 馬達驅動器（最大電流 43A）：接收 GPIO 訊號並以 PWM 控制底盤",
            "底盤沿用 FRC 競賽用 AndyMark AM14U5 六輪底盤 ＋ AM0255 2.5 吋 CIM 馬達（自由轉速 5310 RPM）＋ 6 吋 HiGrip 輪胎",
          ],
        },
        {
          heading: "辨識與控制邏輯",
          headingEn: "Detection & Control",
          body: [
            "YOLOv8 持續追蹤畫面中人員，輸出辨識框高度 H",
            "H 與預設值 X 比較後，Jetson Nano 透過 GPIO 輸出高／低電位給 Arduino",
            "Arduino 判讀電位：高電位前進、低電位後退、無訊號停止，並用 PWM 訊號控制底盤速度",
            "另設實體停止按鈕，按下即中斷底盤動作",
          ],
        },
        {
          heading: "硬體製作",
          headingEn: "Fabrication",
          body: [
            "上半部收納結構以角鋼／鋼板裁切、鑽孔、點焊自製，分上中下三層收納工具、零部件與空壓機",
            "馬達控制器經過三次迭代：Spark SPX（PWM 不相容 Arduino）→ L298N（電流不足以驅動底盤馬達）→ 最終採用 BTS-7960",
          ],
        },
      ],
      architectureDiagram: `flowchart TD
  C["Logitech C270<br/>攝影機"] --> J["Jetson Nano<br/>YOLOv8 物件追蹤"]
  J -->|"辨識框高度 H"| G["GPIO 輸出<br/>高／低電位"]
  G --> A["Arduino UNO"]
  A -->|"PWM 訊號"| M["BTS-7960<br/>馬達驅動器"]
  M --> D["AM0255 CIM 馬達<br/>+ AM14U5 底盤"]
  A -.按下停止鈕.-> S["停止"]`,
      context: "這是實體硬體競賽專案，沒有公開程式碼倉庫，技術細節整理自實際參賽的競賽作品說明書。",
    },
  },
  {
    // 數字全部有出處：CLAUDE.md（部署／監控／備份章節）、DONE.md、git log。改這裡之前先確認還是真的
    slug: "kbs0830-web",
    title: "kbs0830.com — This Site",
    titleJa: "本サイト",
    titleZh: "個人網站（本站）",
    description:
      "This site, self-hosted on a home desktop and exposed through Cloudflare Tunnel. Push-to-deploy with dual-slot builds and automatic rollback, a watchdog that restarts failed services and sends email alerts, and daily encrypted off-site backups.",
    descriptionZh:
      "就是你正在看的這個網站：不租雲端主機，跑在自己的桌機上，經 Cloudflare Tunnel 對外。push 即部署、健檢失敗自動退回，watchdog 每 5 分鐘巡檢並寄信告警，每日加密異地備份。",
    tags: ["Next.js", "React", "TypeScript", "Cloudflare", "GitHub Actions", "PowerShell"],
    github: "https://github.com/kbs0830/kbs0830_web",
    highlight: "Deploy downtime 5–40 s → 1–2 s, with automatic rollback",
    highlightZh: "部署停站 5～40 秒 → 1～2 秒，健檢失敗自動退回上一版",
    status: "完成",
    isPersonal: true,
    detail: {
      intro:
        "這個網站本身。沒有租雲端主機，跑在家裡的桌機（i7-12700 + RTX 3070）上；家用網路封鎖了對外的 80／443 port，所以用 Cloudflare Tunnel 從桌機往外連。網頁之外，重點是「一個人維運」需要的自動化：部署、監控、告警、備份都不需要人守在旁邊。",
      sections: [
        {
          heading: "架構",
          headingEn: "Architecture",
          body: [
            "訪客 → Cloudflare（DNS、HTTPS、www 導向）→ Cloudflare Tunnel → 桌機上的 Next.js 16",
            "自訂 Node.js server 包住 Next.js，負責 request／error log；開機由 Windows 工作排程器啟動，不需要登入",
            "首頁四個區塊都是 Server Component，只有打字效果、3D 背景、作品篩選這類小互動才送 JavaScript 到瀏覽器",
            "Hero 的 3D 背景用 Three.js + React Three Fiber，只在桌機寬度載入，手機完全不下載",
          ],
        },
        {
          heading: "部署",
          headingEn: "Deploy",
          body: [
            "push 到 main → GitHub Actions self-hosted runner（就在同一台桌機）→ PowerShell 部署腳本",
            "雙槽 build：新版本 build 到沒在線上的那一槽，build 失敗完全不影響線上；切換後檢查首頁與 JS 檔都正常，不正常就自動切回上一槽並寄信",
            "停站時間從 5～40 秒降到 1～2 秒",
            "部署成功後自動通知 Bing（IndexNow）；履歷內容有變就重新產生 PDF 並自動 commit",
          ],
        },
        {
          heading: "維運",
          headingEn: "Operations",
          body: [
            "Watchdog 每 5 分鐘：檢查網站、CI runner 是否還活著，並從外網打一次確認 Tunnel 通；異常自動重啟，修不好寄信通知（同一件事 1 小時內只寄一封）",
            "追過的真實問題：網站每 3 天準時掛一次。比對記憶體 log 排除了 memory leak，最後查到是 Windows 工作排程器預設「執行超過 72 小時強制停止」",
            "每日備份不在 git 裡的設定與憑證：另一顆硬碟保留 30 份，另外用 AES-256 加密推到 GitHub 私有 repo，實際還原測試過",
          ],
        },
        {
          heading: "效能與品質",
          headingEn: "Quality",
          body: [
            "拿掉動畫函式庫（改用 CSS、原生 <dialog>、React View Transitions）並改成 Server Components，手機首頁 JavaScript 從 225 KB 降到 170 KB",
            "作品架構圖改在部署前用 Playwright 預先畫成 SVG，作品頁 JavaScript 從 2.8 MB 降到 565 KB",
            "Lighthouse 無障礙／最佳實務／SEO 三項 100",
            "自架訪客國家統計與真實訪客 Web Vitals：只存國家代碼和數值，不存 IP",
            "Vitest 單元測試＋Playwright E2E；commit 前自動跑 ESLint 與型別檢查",
          ],
        },
      ],
      architectureDiagram: `flowchart TD
  V["訪客"] --> CF["Cloudflare<br/>DNS／HTTPS"]
  CF --> T["Cloudflare Tunnel"]
  T --> S["桌機<br/>Next.js 16"]
  P["git push"] --> R["GitHub Actions<br/>self-hosted runner"]
  R --> D["部署腳本<br/>雙槽 build ＋ 健檢"]
  D -->|"通過"| S
  D -.失敗.-> RB["退回上一版＋寄信"]
  W["Watchdog<br/>每 5 分鐘"] -.異常自動重啟.-> S
  W -.外網檢查.-> CF
  W --> B["每日備份<br/>另一顆硬碟＋GitHub 加密"]`,
    },
  },

  // ── 課程専題 ─────────────────────────────────
  {
    slug: "yen-rate-analyzer",
    title: "JPY Rate Analyzer",
    titleJa: "円相場分析システム",
    titleZh: "日圓匯率分析系統",
    description:
      "Real-time JPY monitoring platform. Parallel crawlers scrape 6 banks; Yahoo Finance fills historical data. LKG fallback ensures HA. Purchase decision engine outputs 'buy now / wait' advice.",
    descriptionZh:
      "即時日圓匯率監控平台。配置驅動並行爬蟲抓取 6 家銀行資料，Yahoo Finance 補全歷史走勢，LKG 回退確保高可用。購買力決策引擎直接輸出「現在就買／再等等」建議。",
    tags: ["Python", "Flask", "SQLite", "BeautifulSoup4", "Pandas", "Matplotlib", "Yahoo Finance API"],
    github: "https://github.com/kbs0830/school",
    highlight: "LKG fallback + purchase decision engine (actionable insight)",
    highlightZh: "LKG 容錯回退 ＋ 可執行購買建議（非僅資料展示）",
    status: "課程専題",
    image: "/image/projects/yen-rate-analyzer.jpg",
    detail: {
      intro:
        "基於 Python 的即時日圓匯率監控與分析平台，採用配置驅動架構整合多家銀行匯率資訊，透過並行爬蟲抓取最新匯率、SQLite 落盤保存，Flask 提供介面與 REST API，並附商品換算與歷史趨勢圖。「大數據倉儲」課程期末専題。",
      sections: [
        {
          heading: "架構重點",
          headingEn: "Architecture",
          body: [
            "配置驅動爬蟲：6 家銀行（台銀、第一、華南、玉山、國泰世華、元大）定義於獨立 config，新增資料源只需改設定檔，6 條執行緒並行抓取",
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
      architectureDiagram: `flowchart TD
  C["並行爬蟲<br/>crawler.py"] -->|"多家銀行"| D[("SQLite<br/>db_manager.py")]
  Y["Yahoo Finance API"] -->|"歷史資料回補"| D
  D --> S["rate_service.py<br/>快取 + LKG 回退"]
  S --> E["購買力決策引擎"]
  E -->|"現在就買 / 再等等"| U["Flask 前端<br/>app.py"]
  S --> T["trend_chart.py<br/>趨勢圖"]
  T --> U`,
    },
  },
  {
    slug: "expense-tracker",
    title: "Personal Finance Tracker",
    titleJa: "家計簿アプリ",
    titleZh: "個人記帳分析系統",
    description:
      "Desktop expense tracker built with PyQt5, storing records in CSV files. Budget monitoring with 3-level alerts, live pie chart by category. Group project for 程式設計(三).",
    descriptionZh:
      "PyQt5 桌機記帳應用，資料存在 CSV 檔。支援預算監控（三段警示）、類別圓餅圖即時更新。程式設計（三）小組期末専題。",
    tags: ["Python", "PyQt5", "CSV", "Matplotlib", "資料視覺化"],
    github: "https://github.com/kbs0830/school",
    highlight: "Desktop GUI with live pie chart and 3-level budget alerts",
    highlightZh: "桌機 GUI ＋ 即時圓餅圖，預算超支三段警示",
    status: "課程専題",
    image: "/image/projects/expense-tracker.jpg",
    detail: {
      intro:
        "專為大學生設計的桌面端記帳應用：大多數大學生經濟來源依賴每月固定生活費，卻常因聚餐、娛樂課金、通勤等瑣碎開銷導致月底透支。本系統用 PyQt5 圖形介面搭配 CSV 檔案儲存與 Matplotlib 視覺化，提供無廣告、輕量化、啟動快速的記帳方案。「程式設計(三)」小組期末専題。",
      sections: [
        {
          heading: "核心理念",
          headingEn: "Design Principles",
          body: [
            "簡潔優先：去除複雜功能，專注核心記帳需求",
            "輕量快速：CSV 檔案儲存，不用裝資料庫，第一次執行自動建立檔案",
            "預算監控：三段式警示（狀況良好／即將超支／已超支），文字顏色跟著變",
          ],
        },
        {
          heading: "功能特色",
          headingEn: "Features",
          body: [
            "記帳管理：新增／刪除消費記錄（日期、項目、類別、金額），表格化顯示",
            "預算設定：設定本月預算上限，即時顯示總花費／預算",
            "數據視覺化：圓餅圖即時顯示類別分布，空白資料時優雅顯示",
            "不卡畫面：讀取資料放在背景執行緒（QThread），表格跟圖表讀完才一起更新",
          ],
        },
      ],
      context: "「程式設計(三)」小組期末専題，與組員共同完成。截圖為示範資料。",
      architectureDiagram: `flowchart TD
  UI["PyQt5 主視窗"] -->|"新增／刪除紀錄"| DM["data_manager.py"]
  DM --> DB[("CSV 檔<br/>expenses.csv／budget.txt")]
  DB --> DM
  DM --> CU["chart_utils.py<br/>圓餅圖"]
  CU --> UI
  DM -->|"比對月度預算"| BW["三段式警示<br/>良好／接近／超支"]
  BW --> UI`,
    },
  },
  // ── 2026-11-09 使用者：「全部都放，能放的都放，記得去識別化」──
  // 以下內容全部對過原始碼／報告（C:\Users\user\Desktop\school、road-refactor）。
  // 去識別化：不放學號、本名、班級組別、組員姓名；路口排雷的 GitHub repo README 有組員本名，所以不連過去。
  {
    slug: "lukou-pailei",
    title: "Road Hazard Map",
    titleJa: "道路危険マップ",
    titleZh: "路口排雷",
    description:
      "Community road-hazard map: report potholes and dangerous intersections on a Leaflet map, upvote, earn badges. Express + SQLite backend with a separate demo database and an admin review dashboard. Group project; I rebuilt v2.",
    descriptionZh:
      "社群道路危險點地圖：在地圖上回報坑洞、危險路口，大家附議驗證，回報累積積分與徽章。Express ＋ SQLite 後端，展示帳號走獨立資料庫，管理後台審核狀態。小組専題，v2 重構版由我完成。",
    tags: ["JavaScript", "Node.js", "Express", "SQLite", "Leaflet", "PWA"],
    highlight: "Demo accounts run on a separate database — real data is never touched",
    highlightZh: "展示帳號自動切到獨立資料庫，真實資料不會被動到",
    status: "課程専題",
    image: "/image/projects/lukou-pailei.jpg",
    detail: {
      intro:
        "讓用路人一起標記、驗證道路危險點：看到坑洞、標線不清、危險路口就拍照回報，其他人附議確認，管理員在後台把狀態從「待審」推到「已驗證」「已修復」。前端是不用打包工具的 Vanilla JS 單頁應用，可以加到手機桌面（PWA），部署在 Render。",
      sections: [
        {
          heading: "功能",
          headingEn: "Features",
          body: [
            "地圖首頁：Leaflet 深色地圖，6 種類別篩選，嚴重度 1–5 對應不同大小的標記，最嚴重的會脈動",
            "快速回報：GPS 自動定位，瀏覽器拒絕定位時改成在地圖上點選；可附現場照片",
            "社群附議：每人每篇限投一票（資料表用複合主鍵擋重複），可留言",
            "成就系統：6 枚徽章由後端在回報時自動計算發放，例如晚上 6 點到早上 6 點回報 5 次的「夜鷹」",
            "管理後台：審核狀態、置頂／下架貼文、用戶管理、統計圖表、匯出 CSV",
          ],
        },
        {
          heading: "後端設計",
          headingEn: "Backend",
          body: [
            "雙資料庫：真實資料跟展示資料各一個 SQLite 檔，middleware 依登入帳號切換，展示帳號怎麼操作都不會污染真實資料",
            "展示資料每次啟動重建：虛構用戶＋ 20 個高雄地點（座標用 OpenStreetMap Nominatim 查過）",
            "密碼用 PBKDF2-SHA256（10 萬次迭代、每人隨機 salt），Session 用 192-bit 隨機 token 存在 HttpOnly cookie",
            "所有 SQL 都是參數化查詢；字串長度、數值範圍、上傳檔案大小與類型都有驗證",
            "程式拆成 routes／middleware／db 三層，Express 只負責組裝",
          ],
        },
      ],
      context: "「系統分析與設計」小組専題。v2 重構版（模組化、雙資料庫、Render 部署）由我完成。截圖是展示帳號的虛構資料。",
      architectureDiagram: `flowchart TD
  FE["Vanilla JS 單頁應用<br/>Leaflet 地圖＋PWA"] -->|"fetch /api"| APP["Express app.js"]
  ADMIN["管理後台 admin.html"] -->|"Basic Auth"| APP
  APP --> AUTH["middleware<br/>依帳號切換資料庫"]
  AUTH --> ROUTES["routes<br/>hazards／posts／users／admin"]
  ROUTES --> REAL[("data.sqlite<br/>真實資料")]
  ROUTES --> DEMO[("data-demo.sqlite<br/>展示資料，啟動時重建")]`,
    },
  },
  {
    slug: "aqi-classification",
    title: "Air Quality Classification",
    titleJa: "空気質分類",
    titleZh: "空氣品質等級分類",
    description:
      "Orange workflow comparing 5 classifiers (kNN, SVM, decision tree, random forest, neural network) on Taiwan's live AQI data, plus k-means clustering. AQI itself is kept out of the features to avoid data leakage.",
    descriptionZh:
      "用 Orange 比較 5 種分類模型（kNN、SVM、決策樹、隨機森林、神經網路）預測全台測站的空氣品質等級，另外用 k-means 看資料自己會分成幾群。刻意不把 AQI 本身當特徵，避免資料洩漏。",
    tags: ["Orange", "機器學習", "資料視覺化"],
    github: "https://github.com/kbs0830/school",
    highlight: "Decision tree & random forest: 17/17 correct on the held-out test set",
    highlightZh: "決策樹、隨機森林在測試集 17 筆全對",
    status: "課程専題",
    image: "/image/projects/aqi-classification.jpg",
    detail: {
      intro:
        "資料來自環境部空氣品質指標（AQI）開放資料，全台 85 個測站的即時快照，用 PM2.5、PM10、O3、CO、SO2、NO2 六項污染物預測空氣品質等級。整個流程在 Orange 裡用拉方塊的方式建好，左邊是非監督式分群、右邊是五種分類器比較。",
      sections: [
        {
          heading: "做法",
          headingEn: "Method",
          body: [
            "分層抽樣切 80% 訓練（68 筆）／20% 測試（17 筆），固定亂數種子讓結果可重現",
            "AQI 數值設成 meta、不當特徵：等級就是從 AQI 換算來的，放進去所有模型都會 100%，比較就沒有意義",
            "五種模型用獨立測試集評估，看 AUC、準確率、F1、MCC 跟混淆矩陣",
          ],
        },
        {
          heading: "結果",
          headingEn: "Results",
          body: [
            "決策樹、隨機森林：準確率 1.000，17 筆全對",
            "kNN、SVM、神經網路：準確率 0.941，各錯 1 筆，都是把「不健康」判成相鄰的「對敏感族群不健康」",
            "決策樹佔優勢的原因：AQI 等級本來就是污染物數值切門檻換算的，跟決策樹的切法一致；換成雜訊多的資料就不一定（No Free Lunch）",
            "k-means 從 k=2 試到 8，輪廓分數最高是 k=3（0.581）：官方分六級，但資料自然只分得出「良好／中度／不健康以上」三群",
          ],
        },
      ],
      context: "「大數據資料分析實作」課程期末報告。測試集只有 17 筆，準確率 100% 不代表模型在別的時間點一樣準。",
    },
  },
  {
    slug: "sql-analysis",
    title: "SQL Business Queries",
    titleJa: "SQL 分析",
    titleZh: "資料庫 SQL 分析",
    description:
      "30+ SQL queries on a sample company database (sales, overtime, leave, profit). Found that the reference answer for one exam question was missing a JOIN, inflating sales 18–27×, and proved it with a Python script.",
    descriptionZh:
      "在課程範例公司資料庫上寫了 30 多支分析查詢（業績、加班、請假、毛利）。其中一題發現參考答案少了一個 JOIN 條件，業績被灌大 18～27 倍，另外寫 Python 腳本證明。",
    tags: ["SQL", "Python"],
    github: "https://github.com/kbs0830/school",
    highlight: "Caught a missing JOIN in the reference answer — sales inflated 18–27×",
    highlightZh: "抓到參考答案少一個 JOIN，業績被灌大 18～27 倍",
    status: "課程専題",
    image: "/image/projects/sql-analysis.jpg",
    detail: {
      intro:
        "「資料庫」課程的練習與分析：資料庫有員工、部門、客戶、產品、訂單、進貨、加班、請假等 17 張表，題目是用 SQL 回答商業問題，例如哪些業務連續兩年業績過門檻、各部門加班費、台北客戶的獲利。",
      sections: [
        {
          heading: "查詢範圍",
          headingEn: "Queries",
          body: [
            "業績：年度／季度／月度銷售、成長率、前 15 大客戶、各城市業績最高的業務",
            "人事：各部門加班時數與加班費、請假統計、全勤名單、薪資分級",
            "成本：產品毛利、庫存積壓成本、供應商進貨排名",
            "語法：多表 JOIN、子查詢、CTE（WITH）、CASE WHEN 條件加總、HAVING 篩選",
          ],
        },
        {
          heading: "抓到參考答案的錯",
          headingEn: "Finding",
          body: [
            "題目：找出 2017、2018 年業績都超過門檻的業務員。參考答案的門檻是 40 億，但照正確寫法算，最高的人一年也才 4 億多",
            "原因：FROM 四張表，但 WHERE 少了 orderdetail.ProdId = product.ProdID，每筆訂單明細跟全部 20 個產品做了笛卡爾積",
            "寫 Python 腳本直接解析資料庫匯出檔重算，缺 JOIN 的算法跟參考答案的數字完全吻合（誤差 0.00%），證明就是這個原因",
            "另一題「薪資分級」：題目要求依部門、姓名排序，參考答案其實是照員工編號排序，也用腳本驗證過",
          ],
        },
      ],
      context: "「資料庫」課程。資料是課程提供的範例公司資料庫，截圖裡的人名是範例資料，不是真人。",
    },
  },
  {
    slug: "churn-preprocessing",
    title: "Customer Churn Data Cleaning",
    titleJa: "データ前処理",
    titleZh: "電商顧客流失資料預處理",
    description:
      "Cleaning a 50,000-row e-commerce churn dataset in pandas: tiered missing-value handling with missing flags, logic checks + IQR winsorizing, and ordinal / one-hot / frequency encoding. Every number in the report comes from the script's own output.",
    descriptionZh:
      "用 pandas 清理 5 萬筆電商顧客流失資料：缺失值依比例分級處理並加缺失標記欄、邏輯檢查＋ IQR 縮尾處理偏離值、依類別特性選有序映射／One-hot／頻率編碼。報告裡每個數字都是程式實際輸出。",
    tags: ["Python", "Pandas", "資料視覺化"],
    github: "https://github.com/kbs0830/school",
    highlight: "50,000 × 25 → 49,832 × 44, only 168 rows dropped",
    highlightZh: "5 萬筆只刪 168 列，其餘全部補值或縮尾保留",
    status: "課程専題",
    image: "/image/projects/churn-preprocessing.jpg",
    detail: {
      intro:
        "Kaggle 的電商顧客流失資料集，50,000 筆、25 個欄位，流失率約 29%。作業要求做三件事：缺失值、偏離值、類別編碼，每一項都要先偵測再處理，最後輸出清理好的資料集跟報告表。",
      sections: [
        {
          heading: "缺失值",
          headingEn: "Missing values",
          body: [
            "14 個欄位有缺失（0.34%～12%）。直接 dropna 會損失 64% 的樣本，所以改成分級處理",
            "低於 1% 刪列；1～5% 補中位數；5% 以上補中位數＋建一欄缺失標記（例如 App 使用時數缺失，可能代表根本沒裝 App）",
            "用中位數不用平均數：先用 skew() 看過，行為資料多半右偏",
          ],
        },
        {
          heading: "偏離值",
          headingEn: "Outliers",
          body: [
            "先用商業常識抓邏輯錯誤：年齡 5 歲、200 歲、購買次數負數、比率超過 100%，共 327 格，只把那一格設成缺失、不刪整列",
            "再用 1.5×IQR 抓統計極端值，拉回上下界（縮尾）而不是刪掉——高客單價顧客是真實存在的重要客群",
            "等級型欄位（如付款方式數 1～5）跟 IQR=0 的欄位不縮尾；整數欄位的界線先取整，避免出現「11.5 次」",
          ],
        },
        {
          heading: "類別編碼",
          headingEn: "Encoding",
          body: [
            "註冊季度有先後順序 → 有序映射 1～4",
            "性別、國家類別少 → One-hot（drop_first 避免虛擬變數陷阱）",
            "城市有 40 種 → 頻率編碼，避免 One-hot 產生 40 個欄位",
            "報告裡也寫了限制：統計量是在全資料上算的，之後要建模應該只用訓練集算，避免資料洩漏",
          ],
        },
      ],
      context: "「大數據商業分析與決策」小組作業。截圖是程式輸出的箱型圖（處理前／後各取 6 個欄位）。",
    },
  },
  {
    slug: "ma-backtest",
    title: "Moving-Average Backtest",
    titleJa: "移動平均バックテスト",
    titleZh: "均線交叉回測",
    description:
      "Backtest engine for Taiwan stocks: yfinance daily prices, MA10 / MA60 crossover signals, fees and securities tax per trade, with several stocks backtested in parallel via ThreadPoolExecutor.",
    descriptionZh:
      "台股均線交叉回測：yfinance 抓日線，收盤價站上／跌破 MA10 買賣、跌破 MA60 清倉，每筆交易計算手續費與證交稅，多支股票用 ThreadPoolExecutor 同時回測。",
    tags: ["Python", "Pandas", "Yahoo Finance API"],
    github: "https://github.com/kbs0830/school",
    highlight: "One engine object per stock, run in parallel threads",
    highlightZh: "每支股票一個回測物件，多執行緒並行",
    status: "課程専題",
    image: "/image/projects/ma-backtest.jpg",
    detail: {
      intro:
        "「投資決策及應用」課程作業：把一個簡單的均線策略寫成回測程式，用 2024 年台積電、鴻海、聯發科的日線資料跑一遍，看策略會在哪裡進出場。",
      sections: [
        {
          heading: "策略",
          headingEn: "Strategy",
          body: [
            "買進：前一天收盤在 MA10 下、今天站上 MA10，而且手上沒有持股",
            "賣出：前一天收盤在 MA10 上、今天跌破 MA10",
            "清倉：收盤跌破 MA60 就全部出場",
            "成本：手續費 0.1425%，賣出另計證交稅 0.3%",
          ],
        },
        {
          heading: "程式設計",
          headingEn: "Design",
          body: [
            "BacktestEngine 類別把一支股票的資金、持股、交易紀錄、損益全部包在物件裡，彼此不共用狀態",
            "因為狀態不共用，多支股票可以直接丟進 ThreadPoolExecutor 同時跑，不用加鎖",
            "逐根 K 棒餵進引擎，模擬「只看得到今天以前的資料」",
          ],
        },
      ],
      context: "「投資決策及應用」課程作業，只是練習回測的寫法，不是投資建議。截圖是 2024 年台積電的實際買賣點（用程式的訊號邏輯畫出來的）。",
      // 直的（TD）：橫的 LR 在手機上縮到看不清楚（2026-11-09）
      architectureDiagram: `flowchart TD
  YF["yfinance<br/>日線資料"] --> FMT["整理欄位"]
  FMT --> TA["計算 MA10／MA60"]
  TA -->|"逐根 K 棒"| SIG["訊號判斷<br/>買／賣／清倉"]
  SIG --> TRADE["下單<br/>手續費＋證交稅"]
  TRADE --> PNL["損益紀錄"]
  POOL["ThreadPoolExecutor"] -.->|"每支股票一個引擎"| TA`,
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
    detail: {
      intro:
        "大學課程的作業、考試練習跟期末報告，依課程分資料夾整理。比較完整的已經獨立成上面的課程専題（日圓匯率、記帳系統、空氣品質分類、SQL 分析、顧客流失預處理、均線回測），這裡是其餘的練習。",
      sections: [
        {
          heading: "網頁設計（HTML／CSS／PHP）",
          headingEn: "Web basics",
          body: [
            "每週練習：表單、表格、CSS 版面",
            "期末作品：虛構餐廳「卡皮巴拉餐飲中心」的響應式網頁，用 media query 切手機／平板／桌機三種欄寬",
            "考試練習：前端 fetch 搭配 PHP（PDO）做資料的新增、查詢、修改、刪除",
          ],
        },
        {
          heading: "程式設計（二）",
          headingEn: "Programming II",
          body: [
            "每週作業：身分證字號檢查碼驗證等基礎練習",
            "期末考複習：函式、類別與多型（付款方式、購物車）、NumPy 陣列運算",
          ],
        },
        {
          heading: "資料分析",
          headingEn: "Data analysis",
          body: [
            "大數據倉儲期中：pandas 讀 CSV 跟 SQLite 資料庫，matplotlib 畫折線圖、直方圖、圓餅圖",
            "Orange 期中：行動通信各業者每月通話分鐘數與用戶數的分布",
            "投資決策：用 ffn 計算台積電日報酬率、多執行緒讀取股價檔",
          ],
        },
      ],
      context: "私有倉庫，報告裡的學號、姓名等個人資料不公開。",
    },
  },
];

export const personalProjects = projects.filter((p) => p.isPersonal);
export const courseProjects = projects.filter((p) => !p.isPersonal);
