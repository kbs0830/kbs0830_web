// 事故報告（/status，TODO A4，2026-11-21）。全部是真的發生過的事，內容取自當時的 log、CLAUDE.md 跟部落格文章，
// 不要為了「看起來完整」編事件或數字。新事故照同樣格式加在最上面；有寫成文章的填 post（部落格 slug）。
// 不放：內網 IP、檔案路徑以外的機器細節、任何個人資料。

export interface Incident {
  id: string; // 網址錨點 /status#<id>
  date: string; // 發生日（只知道月份就寫 YYYY-MM）
  title: string;
  duration: string;
  impact: string;
  detection: string;
  cause: string;
  fix: string;
  prevention: string;
  post?: string; // content/blog 的 slug
}

export const incidents: Incident[] = [
  {
    id: "changelog-empty",
    date: "2026-11-21",
    title: "新頁面 /changelog 上線後是空的",
    duration: "約 10 分鐘（三次部署才修好）",
    impact: "只有 /changelog 顯示「目前讀不到更新紀錄」，其他頁面不受影響",
    detection: "部署後自己回查正式站才發現；本機 build、單元測試、瀏覽器測試全部通過",
    cause:
      "頁面在 build 時跑 git log 撈新功能紀錄。部署是 GitHub Actions runner 跑的，那個環境裡指令經過 cmd.exe，格式字串裡的 % 被改掉——git 有輸出、沒有錯誤，只是找不到要的那幾行。程式又把錯誤吞掉，log 裡什麼都沒有",
    fix: "改用 execFileSync 直接執行 git（不經過 shell），在 next.config 讀好再傳給頁面",
    prevention: "讀不到時 build log 會留警告；部署後一定看正式站，不只看本機",
  },
  {
    id: "tunnel-jitter-double-alert",
    date: "2026-11-13",
    title: "外網慢了一分鐘，寄了兩封告警",
    duration: "約 1 分鐘",
    impact: "網站沒有真的斷，但收到「外網連不到」跟「已恢復」兩封信",
    detection: "收到信，回查 watchdog log",
    cause: "外網檢查只要一輪失敗就寄信；而且「逾時」跟「拿到 404／500」被當成同一種失敗",
    fix: "連續兩輪（間隔 5 分鐘）都失敗才寄信；JS 檔回 404／500 馬上判失敗，逾時才重試",
    prevention: "告警要分「真的壞了」跟「慢了一下」，不然信多了就沒人看",
  },
  {
    id: "power-outage",
    date: "2026-11-06",
    title: "停電，整台桌機重開",
    duration: "約 3 分鐘",
    impact: "整站停約 3 分鐘",
    detection: "恢復供電開機後回查",
    cause: "停電",
    fix: "不用修：沒人登入的情況下，Next.js 開機 20 秒內起來，Tunnel（延遲自動啟動）約 2 分 20 秒後恢復",
    prevention:
      "這是第一次真正的冷開機驗證，證明 11/02 的開機自動啟動設定有效。停電期間不斷線要靠第二個來源（雙來源容錯，還沒做）",
  },
  {
    id: "ci-fake-visitors",
    date: "2026-11-05",
    title: "訪客統計裡有 1,037 筆假資料",
    duration: "累積了好幾週才發現",
    impact: "頁尾的訪客國家統計多了 1,037 筆「無法辨識國家」",
    detection: "看統計時發現「XX」異常多",
    cause:
      "自己的瀏覽器自動測試（E2E）跑在同一台桌機：它真的會執行 JavaScript、UA 是一般的 Chrome，所以每跑一次就回報一次造訪",
    fix: "沒經過 Cloudflare 的回報（沒有 cf-ipcountry header）一律不記，清掉假資料",
    prevention: "Web Vitals、訪客分析、CSP 回報都用同一條規則",
    post: "ci-polluted-stats",
  },
  {
    id: "blog-env-500",
    date: "2026-11-05",
    title: "不存在的文章網址回 500，不是 404",
    duration: "10/14 起約 3 週",
    impact: "掃描器亂猜的網址（例如 /blog/.env）拿到 500，共 37 筆；正常文章不受影響",
    detection: "Search Console 的「伺服器錯誤 (5xx)」有幾筆來路不明，翻 server log 找到",
    cause: "工作排程器啟動 Node.js 時沒設工作目錄，process.cwd() 是 System32，部落格找不到文章資料夾就丟錯",
    fix: "server.js 一啟動就把工作目錄切到專案資料夾",
    prevention: "環境差異在源頭修，不要一個檔案一個檔案補",
    post: "blog-env-500",
  },
  {
    id: "tunnel-down-4-days",
    date: "2026-10-29",
    title: "外面連不進來整整 4 天，每個健康檢查都說沒事",
    duration: "約 4 天（10/29 02:15 → 11/02 01:52）",
    impact: "所有訪客都打不開網站",
    detection: "11/02 查別的問題翻 server log 才發現。外部監控其實有寄信，但沒處理",
    cause:
      "桌機半夜自己重開機。Cloudflare Tunnel 的 Windows 服務沒帶啟動參數（空轉），真正扛流量的是手動開的命令列視窗，重開機就沒了。watchdog 只檢查 localhost，從桌機自己看網站完全正常",
    fix: "服務改成真的跑 tunnel、排程工作不登入也會跑；watchdog 多一層從外網打的檢查",
    prevention: "健康檢查要從訪客的位置做；改完設定要真的重開機驗證（11/06 停電那次驗證過）",
    post: "tunnel-down-four-days",
  },
  {
    id: "72-hour-limit",
    date: "2026-08",
    title: "網站每 72 小時準時掛掉一次",
    duration: "8 月到 11/02，每 3 天一次（每次 watchdog 約 5 分鐘內救回）",
    impact: "網站跟自動部署同時停，直到 watchdog 重啟",
    detection: "8 月發現週期性無回應；9 月比對記憶體 log，排除 memory leak，對到剛好 72 小時",
    cause:
      "建立排程工作時沒取消預設的「執行超過 3 天就停止」。9 月改過一次，但是在非管理員視窗跑的，沒生效——10 月照樣每 3 天被砍",
    fix: "寫成 setup-autostart.ps1 用管理員執行，11/02 回查設定真的是「無限制」",
    prevention: "改系統設定之後一定回查，不要只看指令沒報錯",
    post: "task-scheduler-72-hours",
  },
  {
    id: "runner-died",
    date: "2026-07-25",
    title: "自動部署的 runner 無聲停了",
    duration: "不確定（發現時 push 已經卡在排隊）",
    impact: "push 到 GitHub 不會自動部署，網站停在舊版",
    detection: "手動看 GitHub Actions，部署一直是 queued",
    cause: "負責接工作的 Runner.Listener 進程死了，但排程工作顯示「就緒」",
    fix: "手動重啟；8/24 watchdog 每 5 分鐘確認 runner 進程還在，不在就重啟",
    prevention: "「排程顯示正常」不代表底下的進程活著，要直接看進程",
  },
  {
    id: "node-silent-death",
    date: "2026-07-09",
    title: "Node.js 半夜無聲停了將近 4 小時",
    duration: "約 4 小時",
    impact: "訪客看到 connection refused",
    detection: "事後才發現，當時沒有任何監控",
    cause: "node.exe 被結束或底層崩潰，沒留下任何錯誤 log；Tunnel 照常把流量轉給一個已經沒人聽的 port",
    fix: "寫了 watchdog：每 5 分鐘檢查一次，掛了自動重啟",
    prevention: "這是整套監控（watchdog、外網檢查、告警信）的起點",
  },
  {
    id: "stale-process-blank-page",
    date: "2026-07",
    title: "部署完頁面全白",
    duration: "到手動重啟為止",
    impact: "頁面打得開但全白（JavaScript 檔 404／500）",
    detection: "打開網站看到",
    cause:
      "排程工作中間多一層啟動腳本，停止工作時只殺到外層，舊的 node.exe 留下來。新 build 換上去了，舊 process 還拿舊的檔案清單在回應",
    fix: "排程工作直接執行 node.exe；部署後健檢會實際下載首頁用到的 JS 檔，任何一個不是 200 就判部署失敗",
    prevention: "之後改成兩個 build 資料夾輪流用，健檢沒過自動退回上一版",
  },
];
