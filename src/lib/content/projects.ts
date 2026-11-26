import type { Route } from "next";

interface ProjectDetailSection {
  heading: string;
  headingEn?: string;
  body: string[];
  /** 這段相關的站內頁面（例：課程 → 那門課的期末專題作品頁），列在條列下面 */
  links?: { href: Route; label: string }[];
  /** 這段的附圖（2026-11-25：FRC 休士頓世界賽照片、卡皮巴拉餐飲中心的三種版面），放在條列下面 */
  images?: { src: string; alt: string; caption?: string; width: number; height: number }[];
}

/** 案例段落（TODO B9，2026-11-25）：背景 → 角色 → 關鍵決定（做了什麼＋為什麼）→ 取捨 → 成果。只寫查得到的事實 */
export interface CaseStudy {
  problem: string;
  role?: string;
  decisions: { what: string; why: string }[];
  tradeoffs?: string[];
  results: string[];
}

export interface ProjectDetail {
  intro: string;
  caseStudy?: CaseStudy;
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
  /** 整個作品先隱藏：頁面 404、不進作品集／sitemap／API（資料留著，拿掉這行就恢復） */
  hidden?: boolean;
  /** 有作品頁，但不列在首頁作品集、終端機、Ctrl+K（只從別的頁面連過去） */
  unlisted?: boolean;
  image?: string;
  /** 圖不是截圖時寫清楚是什麼（示意圖、封面）；沒寫就用「○○ 截圖」 */
  imageAlt?: string;
  /** 手機作品卡片左邊的小圖示（2026-11-25 使用者：「換簡易版的」「先畫，畫不出來再用 emoji」，截圖點進作品頁才看）。
   *  thumb＝畫好的 480×480 圖示（public/image/projects/icons/，暖白底＋米色線＋靛藍），沒有才用 icon 的 emoji。
   *  換圖要換檔名：同網址會被 next/image 跟 Cloudflare 快取住舊圖（FR24 雷達圓盤就卡過） */
  thumb?: string;
  icon: string;
  /** 站內的即時展示（例：雷達 → /flights#radar），詳細頁顯示成連結 */
  live?: { href: Route; label: string };
  /** 作品頁上的即時資料區塊（TODO D2／D5：課程作品的「線上版」，資料由伺服器抓外部 API） */
  liveWidget?: "jpy-rate" | "air-quality";
  detail?: ProjectDetail;
}

const allProjects: Project[] = [
  // ── 個人專案 ─────────────────────────────────
  {
    slug: "foodlens-advisor",
    thumb: "/image/projects/icons/foodlens-advisor.jpg",
    icon: "🍱",
    title: "FoodLens Advisor",
    titleJa: "フードレンズ",
    titleZh: "食物辨識助手",
    description:
      "Browser-side YOLOv8 (ONNX Runtime) detects food in-device; only text labels are sent to Gemini for dietary analysis. Thin client + cloud brain architecture.",
    descriptionZh:
      "瀏覽器端 YOLOv8（ONNX Runtime）辨識食物，影像不離裝置；僅傳送文字標籤至 Gemini 進行營養分析。薄客戶端＋雲端大腦架構，隱私優先。",
    tags: ["Python", "FastAPI", "YOLOv8", "ONNX Runtime", "Gemini API", "TensorFlow.js"],
    github: "https://github.com/kbs0830/FoodLens-Advisor",
    highlight: "Images stay on device; ~50–150 tokens per analysis vs. 5,000–10,000 for an image",
    highlightZh: "影像不上傳；每次分析約 50–150 token（傳圖片要 5,000–10,000）",
    status: "完成",
    // 2026-11-25 圖：GitHub main 分支的 web-client 實際跑起來的畫面（只把 BFF 健康檢查回成正常，其他照原樣）。
    // 一開始誤用本機舊分支（Android 版）畫了示意圖，查 origin/main 才發現現在是瀏覽器端版本，已換掉
    image: "/image/projects/foodlens-advisor.jpg",
    isPersonal: true,
    detail: {
      caseStudy: {
        "problem": "「拍照算熱量」的服務多半把整張照片上傳給雲端模型：照片會帶出使用者的生活環境，一張圖又要數千個 token，成本跟延遲都高。這個期末專題的目標，是做一套照片不離開裝置、仍然能給出營養分析與飲食建議的系統。",
        "decisions": [
          {
            "what": "食物辨識放在瀏覽器裡跑",
            "why": "ONNX Runtime Web（WASM）直接在瀏覽器執行 YOLOv8，照片不需要上傳到任何伺服器。"
          },
          {
            "what": "只把文字標籤交給大型語言模型",
            "why": "後端把偵測到的食物名稱交給 Gemini 2.5 Flash Lite 做營養分析，每次請求約 50–150 token；直接傳圖片則要 5,000–10,000 token。"
          },
          {
            "what": "前端跟模型之間隔一層 FastAPI 後端（BFF）",
            "why": "API 金鑰只放在伺服器的環境變數，瀏覽器拿不到；請求跟回應用 Pydantic v2 定義型別，格式不對直接擋下。"
          },
          {
            "what": "每一層都有備援",
            "why": "瀏覽器端的 ONNX 模型沒偵測到東西，就改用 TensorFlow.js 的 COCO-SSD；後端另外有 YOLOv8 跟 ResNet-50（Food-101）分類模型，任何一層失敗都能退到下一層。"
          }
        ],
        "tradeoffs": [
          "主模型認得的是 46 類中亞料理，台灣常見的食物要靠 COCO-SSD 的通用類別，能精確辨識的種類有限",
          "語言模型只看得到食物名稱，看不到份量跟烹調方式，熱量是依名稱推估的數字",
          "錯誤直接顯示真實原因、不用假資料填版面，代價是外部服務出問題時使用者會看到錯誤訊息"
        ],
        "results": [
          "照片全程只存在使用者的瀏覽器裡",
          "送給語言模型的資料量只有傳圖片的約 0.5–3%（50–150 對 5,000–10,000 token）",
          "前端不需要框架或打包工具，純 HTML／CSS／JavaScript"
        ]
      },
      // 2026-11-21 使用者確認：repo 裡那份課程說明 PDF 就是這門課的期末專題說明
      context: "這也是「人工智慧與深度學習應用」課程的期末專題。",
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
    thumb: "/image/projects/icons/ticketing-system.jpg",
    icon: "🎫",
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
    // 2026-11-25 圖：本機跑 frontend 截的真實報名表單；/api/bootstrap 用設定預設值假資料，客戶品牌、活動名稱、銀行帳號換成範例文字
    image: "/image/projects/ticketing-system.jpg",
    isPersonal: true,
    detail: {
      caseStudy: {
        "problem": "為一場鐵道旅遊型的文化活動做線上報名售票。需求包括：依車廂分配有限名額、一次可以替 1–10 人報名、不同票種跟加購項目、參加者必須讀完活動規範才能勾選同意、報名後三天內匯款，主辦方對帳後通知參加者。",
        "decisions": [
          {
            "what": "資料寫進 Google Sheets，不另外架資料庫",
            "why": "主辦單位直接在試算表裡看名單、對帳，系統不用另外做管理後台；部署在 Render 免費方案也不用維護資料庫。"
          },
          {
            "what": "報名序號＝日期＋流水號，產生序號跟寫入都加鎖，寫入前依序號去重",
            "why": "使用者重按送出或網路重送時，名單裡不會出現兩筆一樣的報名。"
          },
          {
            "what": "每一列都記下資料表結構的版本",
            "why": "欄位改版後，系統啟動時會偵測到版本不一致並嘗試自動修正，舊資料不會錯位。"
          },
          {
            "what": "錯誤分層編碼，寄信失敗進重試佇列",
            "why": "E_VALIDATION、E_SHEET_UNAVAILABLE、E_SHEET_WRITE、E_SMTP_SEND 一看就知道問題出在哪一層；付款信寄不出去時可以用 API 重送，不會默默遺失。"
          },
          {
            "what": "Google Sheets 連不上時切換成暫時模式",
            "why": "報名頁不會整個掛掉，參加者仍然可以先填寫資料。"
          }
        ],
        "tradeoffs": [
          "名額檢查跟寫入靠同一個程序裡的鎖保護；目前 Render 只跑一個 gunicorn worker 所以成立，要擴充成多個 worker，就得改成有交易保證的資料庫",
          "每次寫入前會先讀整張表做去重，名單越長，每次寫入前讀表的成本越高"
        ],
        "results": [
          "完整流程上線：填表 → 系統計算金額並寄付款信 → 參加者用 LINE 或 Email 回報帳號後五碼 → 主辦對帳",
          "手機上多人報名改成下拉選單切換參加者，一次只顯示一位、每位分三個步驟",
          "部署在 Render 免費方案（gunicorn），前後端分離"
        ]
      },
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
    icon: "🏆",
    // 2026-11-25 使用者：「frc 的專門頁面先隱藏，稍微提到就好」——高工學習記録、自動跟隨機器人頁、About 時間軸裡有提
    hidden: true,
    title: "FRC Robot Team",
    titleJa: "ロボット競技団",
    titleZh: "FRC 機器人競技",
    description:
      "FRC Team 7527 member: Raspberry Pi vision, LabVIEW robot code, CNC machining and argon welding. Won the 2022 New Taipei City x Hon Hai Regional (Winner + Autonomous Award) and competed at the 2022 FIRST Championship in Houston.",
    descriptionZh:
      "FRC 7527 隊成員。2022 新北鴻海區域賽拿下聯盟冠軍與自動控制獎，並參加美國休士頓的 FIRST Championship 世界賽。",
    tags: ["Python", "Raspberry Pi", "LabVIEW", "CNC", "FRC"],
    github: "",
    highlight: "2022 New Taipei x Hon Hai Regional Winner · FIRST Championship, Houston",
    highlightZh: "2022 新北鴻海區域賽聯盟冠軍 · 休士頓世界賽",
    status: "完成",
    isPersonal: true,
    image: "/image/projects/frc-robot.jpg",
    detail: {
      caseStudy: {
        "problem": "FIRST Robotics Competition（FRC）是國際高中機器人競賽，每季在約六週內從零設計、製作一台符合當季任務的機器人，再跟其他隊伍組成聯盟比賽。",
        "role": "團隊成員：負責 Raspberry Pi 視覺系統、LabVIEW 機器人控制程式，並參與機構的 CNC 加工與氬焊。",
        "decisions": [
          {
            "what": "視覺處理交給獨立的 Raspberry Pi",
            "why": "影像辨識跟機器人控制分在不同的處理器上，視覺運算不會拖慢控制迴圈。"
          },
          {
            "what": "機構零件自己加工",
            "why": "用 CNC 跟氬焊製作機構零件，設計改了可以在隊上直接重做。"
          }
        ],
        "results": [
          "2022 FRC 新北鴻海區域賽（New Taipei City x Hon Hai Regional，2022/3/4–6）：聯盟冠軍（Winner）",
          "同一場拿下自動控制獎（Autonomous Award sponsored by Ford）：比賽開頭由程式自動操作的階段表現最好",
          "參加 2022 FIRST Championship（美國休士頓世界賽）",
          "這台機器人的底盤後來沿用到「自動跟隨機器人」專題"
        ]
      },
      intro:
        "參與 FIRST Robotics Competition（FRC）機器人競賽，負責 Raspberry Pi 視覺系統與 LabVIEW 程式，並參與機構的 CNC 加工與氬焊製作。隊伍編號 7527，2022 年在新北鴻海區域賽拿下聯盟冠軍與自動控制獎，並參加美國休士頓的世界賽。",
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
        {
          heading: "2022 休士頓世界賽",
          headingEn: "FIRST Championship, Houston",
          body: [
            "2022 年 3 月在新北鴻海區域賽拿下聯盟冠軍與自動控制獎，之後到美國休士頓參加 FIRST Championship 世界賽",
            "照片是隊上在休士頓拍的：7527 的機器人排隊等上場、比賽中的主場館、開賽前的場地（只挑沒有人臉的）",
          ],
          images: [
            { src: "/image/projects/frc/robot-7527.jpg", alt: "保險桿上印著 7527 的 FRC 機器人在場邊排隊", caption: "7527 的機器人，排隊等上場", width: 1600, height: 900 },
            { src: "/image/projects/frc/houston-match.jpg", alt: "休士頓世界賽主場館，比賽進行中，四周坐滿觀眾", caption: "比賽中的主場館", width: 1600, height: 1067 },
            { src: "/image/projects/frc/houston-arena.jpg", alt: "開賽前空蕩的世界賽場館與比賽場地", caption: "開賽前的場地", width: 1600, height: 900 },
          ],
        },
      ],
      context: "這是實體硬體競賽專案，沒有公開程式碼倉庫。比賽成績照獎狀與參賽證（2026-11-25 核對：原本誤寫成 2023 全國冠軍聯盟，已更正）。",
    },
  },
  {
    slug: "auto-following-robot",
    thumb: "/image/projects/icons/auto-following-robot.jpg",
    icon: "🤖",
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
      caseStudy: {
        "problem": "汽修廠的工具車大多靠人力推動，技師一邊搬工具一邊移動車子，容易發生工安問題。專題的目標是做一台會自己跟在技師後面走的工具車（原競賽作品名稱「小跟班」）。",
        "decisions": [
          {
            "what": "辨識跟控制分在兩塊板子上",
            "why": "Jetson Nano 跑 YOLOv8 負責「看」，只用 GPIO 高／低電位告訴 Arduino 該前進、後退還是停止；Arduino 用 PWM 控制馬達。兩邊之間的介面只有幾條訊號線，好除錯。"
          },
          {
            "what": "用辨識框的高度判斷距離",
            "why": "框比預設值小代表人走遠了、要前進，比預設值大代表太近、要後退，不需要另外加測距感測器。"
          },
          {
            "what": "底盤沿用 FRC 競賽的 AM14U5 與 CIM 馬達",
            "why": "直接用現成、已經在比賽中驗證過的競賽級底盤，把時間花在辨識跟控制上。"
          },
          {
            "what": "加一顆實體停止按鈕",
            "why": "不管軟體狀態如何，按下去就切斷底盤動作。"
          }
        ],
        "tradeoffs": [
          "馬達控制器換了三次才定案：Spark SPX 的 PWM 跟 Arduino 不相容 → L298N 電流不足以驅動底盤馬達 → 最後用 BTS-7960（最大 43A）",
          "控制邏輯只有前進、後退、停止三種狀態，距離判斷只靠一支攝影機的辨識框高度"
        ],
        "results": [
          "112 學年度全國高級中等學校專業群科專題實作及創意競賽（動力機械群）全國佳作"
        ]
      },
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
    thumb: "/image/projects/icons/kbs0830-web.jpg",
    icon: "🌐",
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
    // 2026-11-25 圖：正式站首頁截圖
    image: "/image/projects/kbs0830-web.jpg",
    isPersonal: true,
    live: { href: "/colophon", label: "看架構圖（即時數字）· Colophon" },
    detail: {
      caseStudy: {
        "problem": "想要一個能展示作品、本身也算是作品的個人網站，但不想付雲端主機的月費；家用網路又封鎖了對外的 80／443 port。只有一個人維運，所以部署、監控、備份都必須自動化：壞了要自己救回來，救不回來要通知我。",
        "decisions": [
          {
            "what": "用 Cloudflare Tunnel 從家裡的桌機往外連",
            "why": "不需要開 port、不需要固定 IP，HTTPS、快取跟擋惡意流量交給 Cloudflare。"
          },
          {
            "what": "雙槽部署（兩個 build 資料夾輪流用）",
            "why": "新版本 build 在沒上線的那一槽，build 失敗完全不影響線上；切換後健康檢查不過就自動退回上一版並寄信。"
          },
          {
            "what": "首頁改成 Server Components、拿掉動畫函式庫",
            "why": "動畫改用 CSS、原生 <dialog> 跟 React View Transitions，只把真的需要互動的小元件送到瀏覽器。"
          },
          {
            "what": "Next.js 16 Cache Components",
            "why": "即時資料的頁面先送出 build 時畫好的外殼，數字再串流補上；文章、作品頁鎖定為完全靜態。"
          },
          {
            "what": "訪客統計自己做",
            "why": "不用第三方分析服務、不存 IP、不用 cookie，只存彙總數字；日報／週報／月報也從同一份資料產生。"
          }
        ],
        "tradeoffs": [
          "整個網站跑在一台桌機上，停電或斷網時就會停站；已經有自動重啟、外部監控跟開機通知，但沒有第二台機器能接手",
          "沒有用雲端平台的現成功能，部署、備份、監控都要自己寫腳本、自己維護"
        ],
        "results": [
          "部署時的停站時間從 5–40 秒降到 1–2 秒，健康檢查失敗自動退回",
          "手機首頁 JavaScript 從 225 KB 降到 170 KB；作品頁從 2.8 MB 降到 565 KB",
          "Lighthouse 無障礙、最佳實務、SEO 三項 100",
          "每日加密異地備份，每 90 天自動從備份還原並逐檔比對一次",
          "200 多個單元測試、130 多個 E2E 測試（含無障礙掃描），每次 push 自動跑"
        ]
      },
      intro:
        "這個網站本身。沒有租雲端主機，跑在家裡的桌機（i7-12700 + RTX 3070）上；家用網路封鎖了對外的 80／443 port，所以用 Cloudflare Tunnel 從桌機往外連。網頁之外，重點是「一個人維運」需要的自動化：部署、監控、告警、備份都不需要人守在旁邊。",
      sections: [
        {
          heading: "架構",
          headingEn: "Architecture",
          body: [
            "訪客 → Cloudflare（DNS、HTTPS、www 導向）→ Cloudflare Tunnel → 桌機上的 Next.js 16",
            "靜態頁由 Cloudflare 快取直接回應，部署切換版本後自動清快取；Cloudflare 設定（HTTPS、HSTS、擋掃描器）寫成腳本，每次部署檢查有沒有被改掉",
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
            "每日備份不在 git 裡的設定與憑證：另一顆硬碟保留 30 份，另外用 AES-256 加密推到 GitHub 私有 repo，每 90 天自動從 GitHub 下載、解密、逐檔比對一次",
            "桌機以外的監控：GitHub 雲端機器定時從外面打網站，連不到就自動開 issue 通知，恢復時自動關掉",
            "維修模式：一行指令讓網站顯示維修頁，監控不會誤判成當機；開太久會寄信提醒",
          ],
        },
        {
          heading: "會看狀態的網站圖示",
          headingEn: "Status-aware favicon",
          body: [
            "分頁上的圖示是一個終端機視窗，視窗的顏色就是網站現在的狀態",
            "靛藍：正常運作｜琥珀：維修中｜紅：頁面出錯｜綠：在自己電腦上開發中（一眼分得出是本機還是正式站）",
            "右上角的點是新功能指示燈：平常是白的，新功能剛上線時亮成櫻花粉（部署時看到新功能的 commit 自動亮起，12 小時後熄掉）",
            "同一份 SVG 產生所有尺寸：分頁、手機主畫面、favicon.ico，小尺寸另外畫一版簡化的，16px 也看得清楚",
          ],
        },
        {
          heading: "效能與品質",
          headingEn: "Quality",
          body: [
            "拿掉動畫函式庫（改用 CSS、原生 <dialog>、React View Transitions）並改成 Server Components，手機首頁 JavaScript 從 225 KB 降到 170 KB",
            "作品架構圖改在部署前用 Playwright 預先畫成 SVG，作品頁 JavaScript 從 2.8 MB 降到 565 KB",
            "Lighthouse 無障礙／最佳實務／SEO 三項 100",
            "自架訪客分析（/stats）與真實訪客 Web Vitals：只存彙總數字，不存 IP、不用 cookie",
            "Content-Security-Policy 正式開啟，被擋的資源自動回報",
            "Vitest 單元測試＋Playwright E2E（含 axe 無障礙檢查、sitemap 每頁 200、CSP 違規）；commit 前自動跑 ESLint 與型別檢查",
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
  {
    // 2026-11-20／21 實際除錯與上線的紀錄（DONE.md、CLAUDE.md「自家 FR24 雷達」）。
    // ⚠️ 接收器在使用者家：不寫位置、雷達代碼、涵蓋範圍、離機場多近（「收得到地面滑行的飛機」也不寫，那等於說住在機場旁）
    slug: "fr24-receiver",
    thumb: "/image/projects/icons/fr24-receiver.jpg",
    icon: "📡",
    title: "Home ADS-B Receiver",
    titleJa: "自宅レーダー",
    titleZh: "自架 FR24 雷達站",
    description:
      "A self-hosted ADS-B receiver (Raspberry Pi + SDR dongle) that decodes the 1090 MHz broadcasts aircraft send out and feeds Flightradar24. Its live status shows on this site — without revealing where the receiver is.",
    descriptionZh:
      "樹莓派＋SDR 電視棒，自己接收飛機在 1090 MHz 廣播的 ADS-B 訊號，解碼後分享給 Flightradar24。即時狀態（現在幾架、今天幾架、航空公司）接到本站，但不透露接收器在哪。",
    tags: ["Raspberry Pi", "ADS-B", "SDR", "Node.js", "PowerShell"],
    highlight: "Decoded messages: 0 → 6,663 in 41 minutes after tuning the gain",
    highlightZh: "調整增益後，解碼從一則都沒有 → 41 分鐘 6,663 則",
    status: "完成",
    // 2026-11-25 圖：/radar 的每小時分布、近 30 天、航空公司（真實資料；頁面本來就公開，沒有位置）
    image: "/image/projects/fr24-receiver.jpg",
    isPersonal: true,
    live: { href: "/radar", label: "看即時狀態 · Live Status" },
    detail: {
      caseStudy: {
        "problem": "飛機會持續用 1090 MHz 廣播自己的位置、高度跟航班代碼（ADS-B）。想在家自己接收這些訊號、分享給 Flightradar24，並把即時狀態接到網站上——但接收器在自己家，網站不能透露它的位置。",
        "decisions": [
          {
            "what": "Pi24 映像＋DVB-T 電視棒",
            "why": "樹莓派加一支電視棒當 SDR 接收器，Flightradar24 的 fr24feed 內建 dump1090 解碼，成本低、資料直接分享出去。"
          },
          {
            "what": "網站只在區網讀兩份 JSON、只存彙總",
            "why": "狀態資料裡的 Flightradar24 分享金鑰跟內網 IP 不存也不出去；網站每 30 秒讀一次，只留現在／今天／最多同時幾架、航空公司、機型跟在線率。"
          },
          {
            "what": "不畫地圖、不算涵蓋範圍",
            "why": "把收到的飛機位置畫出來，就能反推接收器在哪裡；寧可少一張圖。"
          },
          {
            "what": "異常也納入監控",
            "why": "離線超過 15 分鐘，或白天 2 小時一架都沒收到，就寄信通知；每週、每月報表也有一段雷達統計。"
          }
        ],
        "tradeoffs": [
          "為了隱私，網站上沒有大部分雷達網站都有的航跡地圖",
          "樹莓派 3 用一般的 micro-USB 電源時會供電不足，系統記錄到低電壓警告後整台斷線，要換成官方電源"
        ],
        "results": [
          "剛架好時每分鐘約 100 萬個疑似訊號一則都解不出來；查出是增益開到最大、雜訊蓋過訊號，設成 40 後 41 分鐘解出 6,663 則訊息、21 架飛機",
          "位置解碼 1,021 次、0 次失敗",
          "即時狀態、每小時分布、近 30 天、航空公司跟機型統計都接到網站的 /radar"
        ]
      },
      intro:
        "家裡自己架的航空雷達。飛機會一直用 1090 MHz 廣播自己的位置、高度和航班代碼（ADS-B），樹莓派接一支 SDR 電視棒就收得到，解碼後即時分享給 Flightradar24。飛行紀錄頁記的是我自己搭過的航班，這台收的是從頭上飛過的。",
      sections: [
        {
          heading: "架設",
          headingEn: "Setup",
          body: [
            "樹莓派（Flightradar24 的 Pi24 系統）＋ DVB-T 電視棒當 SDR 接收器",
            "fr24feed 負責解碼（dump1090）並把資料送到 Flightradar24",
            "區網內開放兩份 JSON：接收器狀態、目前收到的飛機清單——本站就是從這裡讀資料",
          ],
        },
        {
          heading: "除錯：從一則都收不到開始",
          headingEn: "Troubleshooting",
          body: [
            "剛架好時：連得上 Flightradar24、接收器也在跑，但每分鐘約 100 萬個疑似訊號一則都解不出來，雜訊 -31 dBFS",
            "原因是增益沒設、預設開到最大，雜訊把飛機訊號蓋掉；設成 --gain 40 後雜訊降到 -37 dBFS",
            "重開後 41 分鐘解出 6,663 則訊息、21 架飛機，位置解碼 1,021 次、0 次失敗",
            "改設定重啟時，軟體卡在「關到一半」半小時：Flightradar24 那邊照樣顯示已連線，網頁上的重啟按鈕也沒反應，只能拔電重開——後來把這種狀況加進自動監控",
          ],
        },
        {
          heading: "接到網站",
          headingEn: "On this site",
          body: [
            "網站伺服器每 30 秒在區網讀一次雷達，只留彙總：現在／今天／最多同時幾架、今天的航空公司、近 7 天在線率，顯示在飛行紀錄頁",
            "隱私：狀態資料裡有 Flightradar24 的分享金鑰跟內網 IP，這些不存也不出去；也不畫地圖、不算涵蓋範圍——把收到的飛機位置畫出來，就看得出接收器在哪",
            "監控：離線超過 15 分鐘，或白天 2 小時一架都沒收到，就寄信通知；每週的維運週報也有一段雷達統計",
          ],
        },
      ],
      architectureDiagram: `flowchart TD
  A["飛機<br/>ADS-B 1090 MHz"] --> R["SDR 電視棒"]
  R --> P["樹莓派<br/>fr24feed"]
  P --> F["Flightradar24"]
  P -->|"區網 JSON"| S["本站伺服器<br/>每 30 秒讀一次"]
  S --> API["彙總數字<br/>不含位置"]
  API --> V["飛行紀錄頁"]
  S -.離線就寄信.-> W["Watchdog"]`,
    },
  },

  // ── 課程専題 ─────────────────────────────────
  {
    slug: "yen-rate-analyzer",
    thumb: "/image/projects/icons/yen-rate-analyzer.jpg",
    icon: "💴",
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
    liveWidget: "jpy-rate",
    detail: {
      caseStudy: {
        "problem": "要換日幣時，得一家一家去看銀行牌價；就算看到了數字，也不知道「現在換划不划算」。這個專題把多家銀行的匯率集中起來，並直接回答該不該換。",
        "decisions": [
          {
            "what": "銀行清單寫在設定檔，6 條執行緒並行抓取",
            "why": "新增一家銀行只要改設定檔；6 家銀行的網路等待時間重疊，不用一家等完再抓下一家。"
          },
          {
            "what": "用 Repository Pattern 包住 SQLite",
            "why": "所有資料存取集中在同一層，交易管理跟一致性在這裡處理，上層不直接碰資料庫。"
          },
          {
            "what": "抓取失敗時回傳上一次成功的資料（Last Known Good）",
            "why": "某家銀行暫時抓不到時，畫面顯示最近一次的牌價，而不是一片空白。"
          },
          {
            "what": "用 Yahoo Finance 回填歷史匯率",
            "why": "銀行網頁只有當下的牌價，歷史走勢由 Yahoo Finance 補齊。"
          },
          {
            "what": "把匯率轉成購買建議",
            "why": "目標匯率＝台幣預算 ÷ 商品的日圓價格；銀行現金賣出價低於目標，就建議現在換，否則建議再等等。"
          }
        ],
        "tradeoffs": [
          "爬蟲依賴銀行網頁的結構，銀行改版時要更新對應的解析設定"
        ],
        "results": [
          "台銀、第一、華南、玉山、國泰世華、元大 6 家銀行的匯率整合在同一個介面",
          "Flask 介面加 REST API，附商品換算跟歷史趨勢圖",
          "這個網站的作品頁有線上版：即時抓台銀、玉山牌價，照同一套規則給建議"
        ]
      },
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
          heading: "購買決策",
          headingEn: "Purchase Decision Engine",
          body: [
            "目標匯率＝台幣預算 ÷ 商品的日圓價格，跟銀行現金賣出價比較",
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
    thumb: "/image/projects/icons/expense-tracker.jpg",
    icon: "🧾",
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
      caseStudy: {
        "problem": "大學生的收入多半是每月固定的生活費，但聚餐、娛樂、通勤這類瑣碎開銷很容易讓人月底透支。目標是做一個不用註冊、沒有廣告、打開就能記的桌面記帳程式。",
        "role": "「程式設計（三）」小組期末專題，與組員共同完成。",
        "decisions": [
          {
            "what": "資料存在 CSV 檔，不裝資料庫",
            "why": "第一次執行自動建立檔案，使用者不用另外安裝或設定任何東西。"
          },
          {
            "what": "預算三段式警示",
            "why": "依花費佔預算的比例顯示「狀況良好／即將超支／已超支」，文字顏色跟著變，一眼看得出狀態。"
          },
          {
            "what": "讀檔放在背景執行緒（QThread）",
            "why": "表格跟圓餅圖等資料讀完才一起更新，讀取期間畫面不會卡住。"
          }
        ],
        "tradeoffs": [
          "CSV 沒有交易跟並行寫入保護，適合單人、單機使用"
        ],
        "results": [
          "新增／刪除消費記錄、設定每月預算、類別圓餅圖即時更新的桌面應用（PyQt5）"
        ]
      },
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
            "數據視覺化：圓餅圖即時顯示類別分布，沒有資料時也能正常顯示",
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
  // 以下內容全部對過原始碼／報告（C:\Users\user\Desktop\02_課程專題・學習記錄\school、road-refactor）。
  // 去識別化：不放學號、本名、班級組別、組員姓名；路口排雷的 GitHub repo README 有組員本名，所以不連過去。
  {
    slug: "lukou-pailei",
    thumb: "/image/projects/icons/lukou-pailei.jpg",
    icon: "🚦",
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
      caseStudy: {
        "problem": "道路坑洞、標線不清、危險路口的資訊很分散。這個專題讓用路人在地圖上回報、其他人附議驗證，管理員在後台追蹤處理狀態，從「待審」推到「已驗證」「已修復」。",
        "role": "「系統分析與設計」小組專題；v2 重構版（模組化、雙資料庫、Render 部署）由我完成。",
        "decisions": [
          {
            "what": "真實資料跟展示資料分成兩個資料庫",
            "why": "middleware 依登入帳號切換資料庫；展示帳號怎麼操作都不會動到真實資料，展示資料每次啟動自動重建。"
          },
          {
            "what": "後端拆成 routes／middleware／db 三層",
            "why": "Express 只負責組裝，每一層可以單獨修改跟測試。"
          },
          {
            "what": "密碼跟 Session 照標準做法",
            "why": "密碼用 PBKDF2-SHA256（10 萬次迭代、每人隨機 salt），Session 用 192-bit 隨機 token 存在 HttpOnly cookie。"
          },
          {
            "what": "所有輸入都驗證",
            "why": "SQL 全部參數化；字串長度、數值範圍、上傳檔案的大小與類型都有檢查；附議用資料表的複合主鍵擋重複投票。"
          },
          {
            "what": "前端不用打包工具，做成 PWA",
            "why": "Vanilla JS 單頁應用可以直接加到手機桌面，拍照回報不用另外裝 App。"
          }
        ],
        "tradeoffs": [
          "SQLite 是單一檔案的資料庫，適合專題規模；同時寫入的人多了要換成資料庫伺服器"
        ],
        "results": [
          "地圖回報（GPS 定位或手動點選、可附照片）、社群附議、留言、6 種成就徽章、管理後台（審核、統計圖表、匯出 CSV）",
          "展示帳號可以放心交給任何人試用"
        ]
      },
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
    thumb: "/image/projects/icons/aqi-classification.jpg",
    icon: "🌫️",
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
    liveWidget: "air-quality",
    detail: {
      caseStudy: {
        "problem": "用環境部空氣品質開放資料裡的六項污染物數值（PM2.5、PM10、O3、CO、SO2、NO2），預測全台 85 個測站的空氣品質等級，並比較不同分類模型的表現。",
        "decisions": [
          {
            "what": "分層抽樣切 80／20，固定亂數種子",
            "why": "每個等級在訓練集跟測試集的比例一致，結果可以重現。"
          },
          {
            "what": "AQI 數值本身不當特徵",
            "why": "等級就是從 AQI 換算來的，放進去所有模型都會是 100%，比較就沒有意義。"
          },
          {
            "what": "五種模型用同一份獨立測試集評估",
            "why": "kNN、SVM、決策樹、隨機森林、神經網路一起比 AUC、準確率、F1、MCC 跟混淆矩陣。"
          },
          {
            "what": "另外用 k-means 看資料自然分幾群",
            "why": "k 從 2 試到 8，用輪廓分數選群數，跟官方的六級做對照。"
          }
        ],
        "tradeoffs": [
          "測試集只有 17 筆、而且是單一時間點的快照，準確率 100% 不代表在別的時間點一樣準",
          "決策樹佔優勢是因為 AQI 等級本來就是污染物數值切門檻換算的，換成雜訊多的資料就不一定"
        ],
        "results": [
          "決策樹、隨機森林在測試集 17 筆全對；kNN、SVM、神經網路各錯 1 筆，都是相鄰等級的誤判",
          "k-means 在 k=3 時輪廓分數最高（0.581）：官方分六級，資料自然只分得出「良好／中度／不健康以上」三群"
        ]
      },
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
    thumb: "/image/projects/icons/sql-analysis.jpg",
    icon: "🗃️",
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
      caseStudy: {
        "problem": "在一個有 17 張表（員工、部門、客戶、產品、訂單、進貨、加班、請假等）的範例公司資料庫上，用 SQL 回答業績、人事、成本相關的商業問題。",
        "decisions": [
          {
            "what": "複雜查詢拆成 CTE（WITH）",
            "why": "把「先算年度業績、再挑兩年都過門檻的人」拆成幾段，每段可以單獨檢查結果。"
          },
          {
            "what": "答案對不上時寫程式驗證，而不是直接相信參考答案",
            "why": "解析資料庫匯出檔重新計算，用數字證明是哪裡算錯。"
          }
        ],
        "results": [
          "寫了 30 多支分析查詢：年度／季度業績、成長率、加班費、全勤名單、產品毛利、庫存積壓成本",
          "發現參考答案少了一個 JOIN 條件（每筆訂單明細跟全部 20 個產品做了笛卡兒積），業績被灌大 18–27 倍；用 Python 重算，缺 JOIN 的算法跟參考答案完全吻合",
          "另一題「薪資分級」也用腳本證明參考答案的排序跟題目要求不同"
        ]
      },
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
    thumb: "/image/projects/icons/churn-preprocessing.jpg",
    icon: "🛒",
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
      caseStudy: {
        "problem": "Kaggle 的電商顧客流失資料集有 50,000 筆、25 個欄位，流失率約 29%。作業要求完成缺失值、偏離值、類別編碼三項前處理，每一項都要先偵測、再處理，最後輸出乾淨的資料集跟報告。",
        "role": "「大數據商業分析與決策」小組作業。",
        "decisions": [
          {
            "what": "缺失值依比例分級處理，不直接 dropna",
            "why": "直接刪會損失 64% 的樣本；低於 1% 刪列、1–5% 補中位數、5% 以上補中位數並加一欄缺失標記（例如 App 使用時數缺失，可能代表根本沒裝 App）。"
          },
          {
            "what": "補中位數而不是平均數",
            "why": "先用 skew() 確認過，行為資料多半右偏。"
          },
          {
            "what": "偏離值先用商業常識、再用統計",
            "why": "年齡 5 歲、200 歲、購買次數負數這類邏輯錯誤只把那一格設成缺失；1.5×IQR 的極端值拉回上下界（縮尾）而不是刪掉——高消費顧客是真實存在的重要客群。"
          },
          {
            "what": "依類別特性選編碼方式",
            "why": "註冊季度有順序 → 有序映射；性別、國家類別少 → One-hot（drop_first）；城市有 40 種 → 頻率編碼，避免多出 40 個欄位。"
          }
        ],
        "tradeoffs": [
          "統計量（中位數、IQR）是在全部資料上算的；之後要建模應該只用訓練集計算，避免資料洩漏（報告裡有寫明）"
        ],
        "results": [
          "50,000 筆只刪 168 列，其餘全部補值或縮尾保留",
          "報告裡每一個數字都是程式實際輸出的結果"
        ]
      },
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
    thumb: "/image/projects/icons/ma-backtest.jpg",
    icon: "📈",
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
      caseStudy: {
        "problem": "把一個簡單的均線交易策略寫成可以重複執行的回測程式，用 2024 年台積電、鴻海、聯發科的日線資料，看策略會在哪裡進出場、成本怎麼計算。",
        "decisions": [
          {
            "what": "每支股票一個 BacktestEngine 物件",
            "why": "資金、持股、交易紀錄、損益全部包在物件裡，彼此不共用狀態。"
          },
          {
            "what": "用 ThreadPoolExecutor 同時回測多支股票",
            "why": "因為狀態不共用，不需要加鎖就能並行。"
          },
          {
            "what": "逐根 K 棒餵進引擎",
            "why": "模擬「只看得到今天以前的資料」，避免用到未來的價格。"
          }
        ],
        "tradeoffs": [
          "每次只交易一張、沒有計算滑價，只是練習回測的寫法，不是投資建議",
          "2026-11 回頭檢查時修正了三個計算錯誤：沒有持股時不會再記一筆 0 張的賣出、賣出的手續費與證交稅改成從金額扣除、買進前先檢查本金夠不夠"
        ],
        "results": [
          "MA10 進出場、跌破 MA60 清倉，每筆交易計入手續費 0.1425% 與證交稅 0.3%",
          "三支股票並行回測，輸出最終資金、持倉、交易與損益紀錄"
        ]
      },
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
    thumb: "/image/projects/icons/school.jpg",
    icon: "📚",
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
    // 2026-11-25 圖：school repo 實際的課程資料夾跟檔案數做的封面（不放學號、姓名、報告內容）
    image: "/image/projects/school.jpg",
    imageAlt: "課程學習記録的封面：school repo 的課程資料夾跟檔案數",
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
          images: [
            { src: "/image/projects/school-capybara.jpg", alt: "卡皮巴拉餐飲中心網頁在桌機、平板、手機三種寬度的樣子：三欄、兩欄、一欄", caption: "期末作品在 1280／768／390px 下的版面（2026-11-25 用瀏覽器實際打開截的）", width: 1600, height: 1000 },
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
        {
          heading: "人工智慧與深度學習應用",
          headingEn: "AI & deep learning",
          body: [
            "期末專題做的是 FoodLens Advisor：瀏覽器端 YOLOv8 辨識食物、影像不離裝置，只把文字標籤交給 Gemini 做營養分析",
          ],
          // 動態路由的字串 typedRoutes 要明確轉型（slug 拼錯的話 e2e/sitemap 會抓到 404）
          links: [{ href: "/projects/foodlens-advisor" as Route, label: "看 FoodLens Advisor 作品頁 →" }],
        },
      ],
      context: "私有倉庫，報告裡的學號、姓名等個人資料不公開。",
    },
  },
  // ── 高工（高雄市立中正高工 資訊科）──────────────────────────
  // 2026-11-25 使用者：「外接硬碟應該還有高中學習的東西，幫我找找」。資料取自外接硬碟裡的四技甄選學習歷程（專題報告書、實習報告），
  // 報告裡的學號、組員與老師姓名一律不放
  {
    slug: "trash-collector",
    icon: "🗑️",
    // 2026-11-25 使用者：「不要放太明顯的地方」——不進作品集卡片，只從高工學習記録連過來
    unlisted: true,
    title: "Auto Trash Collector",
    titleJa: "自動ゴミ回収機",
    titleZh: "自動垃圾撿拾機",
    description:
      "Vocational high school group project (team lead): an Arduino car that drives toward litter and gathers it under its body, using a 4-channel relay to switch the motors and an ultrasonic sensor to turn away from obstacles.",
    descriptionZh:
      "高工專題實作（組長）：Arduino 小車用四路繼電器控制馬達、超音波感測器避障，朝垃圾開過去把垃圾集中到車體下方，想用在大型活動散場後整理場地。",
    tags: ["Arduino", "C", "繼電器", "超音波感測器"],
    github: "",
    highlight: "Team lead · obstacle avoidance + litter gathering, demoed on video",
    highlightZh: "組長 · 自動避障＋集中垃圾，實機錄影展示",
    status: "課程専題",
    // 圖：專題報告書裡的實機照片（報告裡其他圖是零件的商品圖跟新聞照片，不是自己的，不用）
    image: "/image/projects/trash-collector.jpg",
    detail: {
      caseStudy: {
        "problem": "看到新聞裡大型戶外活動（像演唱會）開始前、結束後垃圾滿地，不只影響其他人的活動，也污染環境。專題目標是做一台體積小、能在人群裡移動，把地上垃圾集中起來的自動小車，縮短活動後整理場地的時間。",
        "role": "組長，三人小組（111 學年度第 2 學期專題實作）。",
        "decisions": [
          {
            "what": "Arduino 透過四路繼電器控制馬達",
            "why": "訊號線控制繼電器裡的電磁鐵，讓馬達電路接通或斷開；Arduino 只需要輸出開關訊號。"
          },
          {
            "what": "轉彎靠兩顆輪子一停一轉",
            "why": "不需要另外的轉向機構，兩顆馬達分別開關就能轉向。"
          },
          {
            "what": "前方裝超音波感測器",
            "why": "量到前方障礙物太近就自動轉彎，不會直接撞上。"
          },
          {
            "what": "垃圾收進車體下方的空間",
            "why": "車子朝垃圾開過去，把垃圾集中到底下，不需要手臂之類的複雜機構。"
          }
        ],
        "tradeoffs": [
          "預算不夠，材料沒辦法一次買齊",
          "做到一半輪子中間的零件壞掉，先跟別人借輪子撐過，最後換回原本的零件完成",
          "繼電器只有開／關兩種狀態，馬達只能全速或停止，沒辦法調速"
        ],
        "results": [
          "完成實機並錄影展示：遇到障礙物自動轉彎、朝垃圾行駛並把垃圾集中到車體下方",
          "車體小，可以在人群中移動",
          "之後的「自動跟隨機器人」（全國佳作）延續了同樣的「感測 → Arduino → 馬達」架構，改用 Jetson Nano 做影像辨識"
        ]
      },
      intro:
        "高雄市立中正高工資訊科二年級下學期的專題實作。三人小組，我是組長：做一台會自己在場地裡移動、把地上垃圾集中起來的小車，靈感來自演唱會這類大型活動散場後垃圾滿地的新聞。",
      sections: [
        {
          heading: "硬體",
          headingEn: "Hardware",
          body: [
            "機械車：整台機器的主體，垃圾收在車體下方",
            "Arduino：控制行進方向，並把電流送到繼電器",
            "四路繼電器模組：讓 Arduino 的訊號線控制馬達電路的開關",
            "馬達兩顆：分別控制兩邊輪子的前進跟轉彎",
            "超音波感測器：量前方障礙物的距離",
            "電池盒：供電給 Arduino，讓車子不用接線",
          ],
        },
        {
          heading: "運作方式",
          headingEn: "How it works",
          body: [
            "電池盒供電給 Arduino，Arduino 再透過繼電器控制兩顆馬達",
            "超音波感測器量到障礙物時通知 Arduino，Arduino 讓一顆輪子停、一顆繼續轉，車子就轉彎避開",
            "平常朝垃圾的方向行駛，把垃圾集中到車體下方的空間",
          ],
          links: [{ href: "/projects/auto-following-robot" as Route, label: "高三專題：自動跟隨機器人 →" }],
        },
      ],
      context: "高雄市立中正高工資訊科，111 學年度第 2 學期專題實作，三人小組。資料整理自專題實作報告書。",
    },
  },
  {
    slug: "vocational-records",
    thumb: "/image/projects/icons/vocational-records.jpg",
    icon: "🔧",
    title: "Vocational High School Records",
    titleJa: "高工学習記録",
    titleZh: "高工學習記録",
    description:
      "Lab reports from the information technology program at Kaohsiung Municipal Chung-Cheng Industrial High School: App Inventor, VB.NET, Arduino, CPLD with Verilog, CMOS circuits, ESP32 IoT and a soldered interface card for the Level B hardware certification.",
    descriptionZh:
      "高雄市立中正高工資訊科的實習報告：App Inventor、VB.NET、Arduino、CPLD（Verilog）、CMOS 電路、ESP32 物聯網，以及電腦硬體裝修乙級的介面卡電路板。",
    tags: ["VB.NET", "Arduino", "Verilog", "CPLD", "ESP32", "App Inventor"],
    github: "",
    highlight: "From visual blocks to Verilog and IoT in three years",
    highlightZh: "三年從積木程式到 Verilog、物聯網",
    status: "學習記録",
    image: "/image/projects/vocational-records.jpg",
    imageAlt: "高工學習記録的封面：各科實習做出來的東西",
    detail: {
      intro:
        "高雄市立中正高工資訊科三年的實習報告，整理自四技甄選時繳交的學習歷程。從一年級的積木式程式（App Inventor）、文字式程式（VB.NET、Arduino 的 C），到二年級的數位邏輯、電子學跟物聯網；專題另外獨立成作品（自動垃圾撿拾機、自動跟隨機器人），課外是 FRC 機器人隊。",
      sections: [
        {
          heading: "程式設計",
          headingEn: "Programming",
          body: [
            "資訊科技（App Inventor）：用拖拉積木的方式做手機 App，作品是占卜跟計算機",
            "高階程式語言實習（VB.NET）：疫情期間改成線上上課、沒辦法實體考試，做了一個線上測驗程式——老師用文字檔更新考題，學生用程式讀取考題作答",
          ],
        },
        {
          heading: "硬體與控制",
          headingEn: "Hardware & control",
          body: [
            "機器人實習（Arduino）：溫度控制器，溫度超過 26 度啟動風扇，溫度越高轉速越高，用 PWM 控制馬達",
            "電子學實習：CMOS（CD4007）配光敏電阻做光控 LED 電路",
            "電腦網路實習：電腦硬體裝修乙級的介面卡電路板，焊接電路後用 VB 寫程式控制板子上的 LED",
          ],
        },
        {
          heading: "數位邏輯",
          headingEn: "Digital logic",
          body: [
            "可程式邏輯設計實習：在 CPLD 上用 Verilog 從半加器、全加器做到 4 位元加法器，再加上 BCD 加法器跟七段顯示器，用指撥開關輸入",
          ],
        },
        {
          heading: "物聯網",
          headingEn: "IoT",
          body: [
            "單晶片微處理機實習（ESP32）：房間溫溼度異常時，透過 Wi-Fi 用 LINE Notify 推播到手機，數值同時上傳 ThingSpeak 畫成圖表",
          ],
        },
        {
          heading: "專題與課外",
          headingEn: "Projects & activities",
          body: [
            "二年級專題：自動垃圾撿拾機（組長）",
            "三年級專題：自動跟隨機器人「小跟班」——校內專題實作競賽第一名、全國動力機械群佳作",
            "FRC 機器人隊（Team 7527）：2022 新北鴻海區域賽聯盟冠軍、自動控制獎，參加休士頓世界賽",
            "證照：電腦硬體裝修丙級",
          ],
          links: [
            { href: "/projects/trash-collector" as Route, label: "自動垃圾撿拾機 →" },
            { href: "/projects/auto-following-robot" as Route, label: "自動跟隨機器人 →" },
          ],
        },
      ],
      context: "整理自四技甄選的學習歷程檔案（實習報告、專題報告書、獎狀）。報告裡的學號、同學與老師姓名不公開。",
    },
  },
];

export const projects = allProjects.filter((p) => !p.hidden);
/** 首頁作品集、終端機、Ctrl+K 用：不含 unlisted */
export const listedProjects = projects.filter((p) => !p.unlisted);
export const personalProjects = listedProjects.filter((p) => p.isPersonal);
export const courseProjects = listedProjects.filter((p) => !p.isPersonal);

// 技能 ↔ 作品互連（2026-11-09）：About 的技能名稱對到作品 tag（技能常帶版本號，例如「Next.js 16」→「Next.js」）。
const projectTags = new Set(projects.flatMap((p) => p.tags));
const tagCounts = new Map<string, number>();
for (const t of projects.flatMap((p) => p.tags)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);

/** 技能名稱 → 作品 tag；沒有作品用到就回 undefined */
export function tagForSkill(name: string): string | undefined {
  const candidates = [name, name.replace(/\s+v?\d+(\s.*)?$/, ""), name.replace(/\s+(API|Web)$/, "")];
  return candidates.find((c) => projectTags.has(c));
}

/** 這個 tag 有幾個作品用到 */
export function projectCountForTag(tag: string): number {
  return tagCounts.get(tag) ?? 0;
}
