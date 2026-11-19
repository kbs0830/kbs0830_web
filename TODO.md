# TODO — kbs0830_web

這裡**只放還沒做的**；做完的搬到 [DONE.md](DONE.md)（2026-11-09 拆開）。
做完任何一項跟 Claude 說，它會回查、從這裡刪掉、記進 DONE.md。

📬 有日期的項目會自動寄提醒信到 otemon（`reminders.json`）：11/12 匯出檢索統計、11/18 Web Vitals、12/09 CSP 回查、
2026 年底 GHA 鈦金、2027/05/16 網域續約、2027/08/31 年級更新、2027 年底 IHG 酒廊、2028 年底華航金卡。

---

## 🙋 你要動手的（要你的帳號或管理員權限，Claude 做不到）

1. [ ] **Search Console 看驗證結果** 🔴 11/05 按了「驗證修正」，「驗證中」是正常的，**~11/19 前看結果，不用再按**
   → 11/12 有提醒信叫你匯出「檢索統計資料」（檢索次數回升、5xx 歸零＝恢復）
   → 📍 **11/12 匯出（使用者給的 Coverage CSV）**：已建立索引 **11**（10/24 起沒變）、未建立 42（11/07 從 19 跳上來＝新頁面被發現）；
     5xx 7 頁、404 2 頁還在驗證；「已檢索 - 尚未建立索引」27 驗證**失敗**（Google 看過但選擇先不收，新站常見）；
     「頁面會重新導向」2＝http／www 導向，正常。每天曝光 0～4 次。11/12 Claude 把 14 個 tag 頁設 noindex＋移出 sitemap（43→29），
     讓 Google 專心收文章跟作品頁
   → 📍 11/09 截圖：已建立索引 11（11/04 是 4）。5xx 7 頁是 10 月斷線留下的，驗證跑完應該歸零；
     「已檢索／已找到但未建立索引」是 Google 自己的排程，不是錯誤
   → 11/09 新增 5 個作品頁、`/stats`、14 個部落格 tag 頁，sitemap 從 23 變 **43** 個網址（11/09 晚上回查全部 200），
     新頁面要等 Google 自己來收，不用一頁一頁按「要求建立索引」
2. [ ] **Bing 收錄回查**（11/08 提醒信已寄；11/09 Claude 查 `site:kbs0830.com` 還是 0 筆，bingbot 11/06 起來了 16 次，每次部署都有 IndexNow）：Bing 搜 `site:kbs0830.com` 有結果、或 Bing Webmaster → URL Inspection
   顯示「Indexed」才算數；還是「Discovered but not crawled」就把畫面給 Claude
3. [ ] **IG 簡介放網站連結** 🟠
4. [ ] **網域續約** 🟡 kbs0830.com 在 Cloudflare Registrar，**2027-06-16 到期**（11/09 查 Verisign RDAP 更正，之前寫的 5/18 是錯的；5/16 有提醒信）
   → Domain Registration → Manage：Auto-renew 開著、信用卡到時候還有效（過期＝整站全斷）
5. [ ] **UptimeRobot 監控設定** 🟡 10 月月報 0%，但實際只斷約 4 天——監控本身設錯（告警信有寄出、你有收到）
6. [ ] **cloudflared 升級**（11/09：裝的是 2026.10.0，最新 2026.10.7）：系統管理員 PowerShell 跑
   `Stop-Service Cloudflared` → `winget upgrade Cloudflare.cloudflared` → `Start-Service Cloudflared`
7. [ ] **GitHub 門面**（改的是別的 repo）
   → pin `FoodLens-Advisor`、`YARTIX-TICKETING-TEST`；這兩個的 README 補截圖／架構圖／安裝步驟
   → profile README（`kbs0830/kbs0830`）：11/09 Claude 寫好「跟網站同風格」的草稿（Claude 沒有那個 repo 的推送權限），
     要換的話說一聲：你推、或照網站 repo 的做法給一把 deploy key 讓 Claude 推。現在的版本作品名還是舊的（Food Vision Analyzer）
   → 兩個 repo 的 About（描述、網站連結、topics）都是空的：repo 頁右上「⚙️」填，FoodLens 可填「瀏覽器端 YOLOv8 ＋ Gemini 飲食分析」
8. [ ] **確認 FoodLens repo 裡的 `irs_1774….pdf`** 🟠（2026-11-17 Claude 發現）：公開 repo 根目錄、3 頁 Word 檔，Claude 讀不到內容。
   是個人文件就要從 git 歷史整個清掉（跟 Claude 說）；是專題文件就把這項刪掉
9. [ ] **FR24 雷達（T-RCKH76）幾乎收不到訊號** 🟠（2026-11-20 06:10 Claude 從桌機讀 `192.168.50.147` 的狀態）：
   連線 FR24 正常、接收器（SDR 棒）也在跑，但每分鐘約 100 萬個疑似訊號**一個都解不出來**（accepted 0）、雜訊 -31 dBFS 偏高、
   開機以來 98 次「太久沒收到資料」逾時。通常是**天線**或**增益開太大**：
   → 天線放窗邊／戶外、越高越好，不要隔金屬或鍍膜玻璃；SDR 棒附的小天線可以用，但要接好、垂直放
   → 增益：`http://192.168.50.147:8754/settings.html` 的 Process arguments 填 `--gain 40`（目前沒設＝最大），存檔後按 Restart，
     跟 Claude 說，Claude 看 1 分鐘的解碼數字；不行再試 `--gain 33.8`
   → ⚠️ `monitor.json` 裡有你的 FR24 分享金鑰（fr24key），不要截圖整頁貼出去

## 🤔 你要決定或提供素材的

**內容**
- [ ] **`/now` 更新**：內容從 7 月沒動過，告訴 Claude 現在在忙什麼；順便加「最後更新」日期
- [ ] **FoodLens 截圖**：課程専題 11/09 全部有截圖了，個人專案只剩 FoodLens 沒有。它的網頁版只是「測試 BFF 連線」的空殼、
  真正的 App 是 Android，後端也沒有 Gemini 金鑰——要你手機截一張分析結果（不要有真人臉），或給 Claude 金鑰＋一張食物照片
- [ ] **均線回測程式的 bug 要不要修**（改的是 school repo，網站目前不放報酬數字）：沒持股時跌破 MA60 也記一筆 0 張賣出、
  賣出時手續費／證交稅用加的（應該扣）、沒檢查本金夠不夠（聯發科一張就超過 100 萬，跑完資金變負）。修完網站可以補報酬率
- [ ] **「人工智慧與深度學習」要不要留**：課程學習記録寫了這門課、tag 有「深度學習」，但 school 裡這個資料夾是空的。
  東西在別的地方就給 Claude 路徑；沒有的話 Claude 拿掉
- [ ] **路口排雷「v2 重構版由我完成」對不對**：Claude 是看 git 紀錄（17 個 commit 都是你的信箱）寫的，不對就說
- [ ] **作品量化成果**：購票系統處理過幾筆報名…**有真的數字才放**（匯率系統「6 家銀行、6 條執行緒並行」11/09 已從原始碼補上）
- [ ] **履歷要不要加經歷**：證照 11/09 已從你的 104 履歷 PDF 加上（`/resume`）。同一份 PDF 還有工作經歷
  （偏鄉課輔志工、鈴鹿賽道樂園、淨園農場），要不要放、放哪幾個跟 Claude 說（電話、地址、役別不會放）
- [ ] **履歷高中英文校名**：現在寫 Kaohsiung Municipal Zhongzheng Vocational High School。11/09 Claude 查了學校官網、維基都沒有官方英文名
  （英文維基那條是另一間「中正高中」），要看你的畢業證書／證照上怎麼寫
- [ ] **機型**：想記哪班的機型，給 Claude 航班代碼＋機型（`/flights` 會自動顯示）
- [ ] **看 3 篇部落格草稿**（11/09 Claude 寫的，都在 `content/drafts/`，不會上線）：CSP 正式開抓到 Cloudflare 偷插 script、
  中文 tag 網址上線才 404、灰字疊 opacity 被無障礙檢查抓 20 處。內容照當天實際紀錄寫（時間、數字都對過 log）。
  OK 的話說「發布 ○○」，Claude 搬進 `content/blog/` 改日期；要改哪裡直接說
- [ ] **部落格新文章**：要真的踩過的坑才寫。題材庫：Tailwind v4 `[--var]` 全站 116 處、Task Scheduler wrapper 孤兒 process、
  pnpm v11 native build、PowerShell 5.1 沒 BOM 變 Big5、node.exe 無聲死掉 4 小時→自己寫 watchdog、
  **11/09 新的**：中文 tag 網址 build 跟單元測試都過、上線才 404（後來加了「sitemap 每個網址都要 200」的測試）、
  PowerShell `-like` 把 `[ROLLBACK]` 的方括號當萬用字元（週報算出「自動退回 5946 次」）
  **11/12 之後新的**：一分鐘的 Tunnel 抖動寄了兩封信（逾時跟 404 被當成同一種錯誤）、網站圖示狀態色＋新功能指示燈（部署 → JSON → API → favicon）、Cloudflare 快取一開「未過濾流量」就變少（命中的請求不會到桌機）、Vitest 在 Git Bash 全部報錯但 PowerShell 全過（原因查到再寫）、架站成本（要你給真的電費數字）

**設計／取捨**
- [ ] **首頁 LCP**：11/09 先看了：真實訪客 p75 **1.88s**（25 筆）已經 good，INP 72ms、CLS 0 也都 good →
  Hero 動畫**不用縮短**。11/18 提醒信樣本多一點再看一次，還是 ≤2.5s 就結案
- [ ] **時間軸互動**：現在是滑鼠移上去／點一下展開、移開收起；想要回到「點一下固定展開、再點收起」跟 Claude 說
- [ ] **先隱藏的東西**，想恢復哪個跟 Claude 說：
  → **下載履歷按鈕**（`/resume` 頁跟 PDF 照舊在，只是沒入口；恢復方法在 `ContactSection.tsx` 註解）
  → **Facebook**（Contact 連結、JSON-LD `sameAs`；`e2e/privacy.spec.ts` 要一起改）
  → **頁尾版本號**（`BuildInfo.tsx` 註解有說明）
  → **頁首以外的桌機特效**：游標光圈、點擊漣漪、卡片聚光燈＋3D 傾斜、小標解碼、背景直書大字、時間軸畫線（commit `cdf68f9`）

**要你建帳號／金鑰才能做**
- [ ] **Renovate patch 更新自動合併**（需要一組 fine-grained PAT）：內建 token 開的 PR 不會觸發 workflow、沒測試結果可依據
- [ ] **聯絡表單**：要申請 EmailJS／Formspree 帳號（之前 mailto 版你說不需要）


**其他**
- [ ] **Claude Code 遠端 session 的問題**：下次發生時把錯誤訊息或狀況記下來給 Claude
  （11/09 貼的「無法從 docs.renovatebot.com 載入結構描述：位置不受信任」不是這個——那是 VS Code 打開 `renovate.json`
  的訊息，已用 `.vscode/settings.json` 信任那個網域，重開檔案就不會再跳）

## ⚙️ 還沒做的點子（Claude 可以直接做，說「做 ○○」就開工）

標記：🟥 大（好幾天）🟧 中（一兩天）🟩 小（一次做完）｜🙋 需要你提供東西｜⭐ Claude 推薦。2026-11-17 腦力激盪整理（使用者：「多想一些點子」「工作量大點的」），還沒決定要做；不做的搬到最下面「評估過、先不做」

**⭐ Claude 推薦的前五名**

1. **FoodLens 線上試玩**（A1）：作品集最強的證明是「直接能玩」，而且剛好證明 FoodLens 的賣點「影像不離開裝置」
2. **停電也不斷線**（A2）：10/29 斷 4 天、11/06 停電，都會變成訪客沒感覺
3. **網站更新紀錄 /changelog**（B1）：小工程，跟櫻花粉指示燈是同一套邏輯
4. **每月自動故障演練**（C1）：故意把網站停掉，確認 watchdog 真的救得回來，跟每季的備份還原演練同一個思路

**A. 大更新（🟥 好幾天）**

- [ ] **A1. FoodLens 在作品頁直接試玩 ⭐ 🙋**
  - 作品頁加上傳框，照片在**訪客自己的瀏覽器**裡用 ONNX Runtime Web 跑 YOLOv8，畫出辨識框和類別。照片不會上傳
  - **2026-11-17 Claude 查過**：GitHub 上 FoodLens `main` 的 `docs/MODELS.md` 跟網站寫的一致（46 類、640 letterbox、門檻 0.25）。
    模型檔 `milliy-taomlar-detector-best.onnx`（43MB）**不在 git 裡**，大概只在你筆電上
    （桌面上那份 FoodLens 是舊版：`web-dev` 停在 5 個 commit、沒有 YOLO 程式；Claude 只跑了 `git fetch`，沒動你的檔案）
  - 🙋 要你提供：那個 .onnx 檔，以及模型的出處／授權（Roboflow Universe 的公開資料集要看授權能不能再散佈）。
    頁面會照實寫「模型來源：Roboflow Milliy Taomlar（中亞料理 46 類）」，不會說成自己訓練的（除非真的是你訓練的）
  - 技術重點：43MB 要等訪客按「試試看」才下載、下載時有進度條、之後用瀏覽器快取；有 WebGPU 走 WebGPU，沒有就用 WASM；
    CSP 要加 `'wasm-unsafe-eval'`；手機記憶體不夠時要降級或提示
  - 類別都是中亞料理，台灣食物大多會辨識成 unknown／rice → 附幾張示範圖讓人一鍵試，比自己上傳更準

- [ ] **A2. 停電也不斷線（雙來源容錯）⭐ 🙋**
  - 部署時把靜態頁另外輸出一份到 **Cloudflare Pages**；Cloudflare Worker 判斷桌機回 530／5xx 時改給 Pages 上的備份
  - 備援模式：動態功能（訪客統計、Spotify、/stats、Web Vitals 回報）隱藏，頁面上有一行小字「目前是備援模式」
  - 🙋 要你：建 Pages 專案、一組 token（權限 Pages Edit＋Workers Edit）
  - 難點：Next 的頁面要能輸出成純靜態（有 `force-dynamic` 的頁面要排除）；兩份要同一版（部署成功才推 Pages）
  - 做完正好寫一篇文章（自架網站維運系列第 6 篇）

- [ ] **A3. 日文版網站（/ja）🙋**
  - 多語系路由、hreflang、日文 OG 圖、日文 Markdown 版、sitemap alternates
  - 你在高雄、福岡兩地，日本的搜尋、面試官都用得到
  - 🙋 你目前是 N5，要找會日文的人審過；不然先只翻首頁跟作品頁

- [ ] **A4. 公開維運儀表板＋事故報告（/status）**
  - 90 天可用率長條圖（來源：watchdog.log＋uptime.yml）、部署時間軸（deploy.log，含退回）、自動重啟紀錄
  - **事故報告**：用真實事件寫成「發生什麼 → 怎麼發現 → 根因 → 修法 → 預防」（72 小時上限、Tunnel 斷 4 天、node.exe 無聲死掉、
    CI 灌 1037 筆假訪客、11/13 一分鐘抖動寄兩封信）。部落格已經有其中幾篇，事故報告的格式更短、可以互相連結
  - 注意：log 只能公開彙總數字，不放路徑細節、IP

- [ ] **A5. 旅行頁大改版：3D 地球（/travel）**
  - /flights＋/hotels 合成一頁：可以轉動的地球、大圓航線弧線、住過的城市點，點一下城市看那裡住過幾間
  - 首頁已經有 three.js，不用新增套件；手機沿用 HeroSceneLite 那套 Canvas 2D 投影
  - 隱私不變：不放日期，只標城市

- [ ] **A6. 部落格升級**
  - 全文搜尋：Pagefind（build 時建索引，零伺服器、中文要測斷詞）
  - 留言：giscus（GitHub Discussions，訪客用 GitHub 登入；不收 email，不用另外註冊）
  - 程式碼複製按鈕、每篇附「對應的 commit」連結、RSS 改全文（現在只有摘要）

- [ ] **A7. 首頁 3D 用 WebGPU 重寫**
  - three.js 的 WebGPURenderer＋TSL，粒子改用 compute shader（數量可以加，但風格照舊「稀疏、慢」）；不支援的瀏覽器退回現在的 WebGL
  - 新技術展示，但**風險最高**：60fps 目標、相容性、R3F 支援度都要先驗證。不急

- [ ] **A8. 網站架構互動圖（/colophon）**
  - 一張可以點的圖：訪客 → Cloudflare（快取／WAF）→ Tunnel → server.js → 雙槽 .next-a／.next-b → data/，
    watchdog、備份、CI 掛在旁邊。點每個節點看它在做什麼、加上即時數字（快取命中、上線多久、上次部署）
  - 等於把 CLAUDE.md 的部署架構做成給人看的版本；適合放在 kbs0830-web 作品頁裡

- [ ] **A9. 給 AI 用的網站 MCP 伺服器**
  - 已經有 `/llms.txt` 跟每頁 Markdown 版；再往前一步：`/mcp` 讓 AI 助理直接查「他做過哪些作品」「最新文章」
  - 唯讀、只回傳網站上本來就公開的內容；跟「AI 搜得到我的名字」的目標一致
  - 新技術，但目前真的會用 MCP 查個人網站的人不多，**展示意義大於實用**

- [ ] **A10. 公開 JSON API（/api/v1）＋文件**
  - projects、posts、now、flights 統計，附 OpenAPI 文件頁。展示後端能力，也方便自己其他專案（GitHub profile README）拿資料
  - 跟 Markdown 版共用資料來源，不另外維護

**B. 網站功能（🟧／🟩）**

- [ ] **B1. 網站更新紀錄 /changelog** ⭐ 🟩：從 `feat` commit 自動產生，頁尾「最後更新」連過來。commit 訊息要寫給人看的（現在大多是）
- [ ] **B2. 終端機加指令** 🟩：`neofetch`（真實硬體規格）、`uptime`、`blog`、`status`、`history`、Tab 自動補完
- [ ] **B3. 頁尾二十四節氣** 🟩：時鐘旁邊加小字「立冬」，瀏覽器端算
- [ ] **B4. 「いま N 人」** 🟧：頁尾顯示現在正在看網站的人數（每頁每 30 秒報一次、只記數字），分頁在背景時不報
- [ ] **B5. 文章頁麵包屑結構化資料** 🟩：作品頁有，文章頁沒有
- [ ] **B6. /flights 趣味換算** 🟩：「總距離 ≈ 繞地球 N 圈／到月球的 N%」
- [ ] **B7. 每頁專屬分享圖** 🟩：/flights、/hotels、/stats、/now 還在用全站預設圖
- [ ] **B8. `/.well-known/security.txt`** 🟩：現在是 404。RFC 9116 標準檔，寫聯絡方式（用 otemon 還是 1394kbs 要你決定）
- [ ] **B9. 作品頁改成案例格式** 🟧：每個作品固定「問題 → 我的決定 → 取捨 → 結果」四段，面試官最想看「為什麼這樣做」。
  只用 repo 裡真的有的資訊，沒有的段落就不寫
- [ ] **B10. 文章離線閱讀** 🟧：Service Worker 快取讀過的文章，沒網路也打得開（PWA manifest 已經有了）
- [ ] **B11. 列印版文章** 🟩：履歷已經有列印樣式，文章也排一份（程式碼不截斷、連結印出網址）
- [ ] **B13. 自家 FR24 雷達即時狀態** 🟧（等上面第 9 項收得到訊號再做）：/flights 加一塊「我家雷達現在追蹤 N 架、今天最多 N 架」，
  桌機的 Next.js 在區網直接讀 `monitor.json`／`dump1090/data/aircraft.json`，只回傳白名單欄位（**fr24key、內網 IP 絕對不出去**）。
  🙋 要你決定：要不要列「頭上這幾班」（航班代碼＋高度，不放座標）；**不放地圖、涵蓋範圍、最遠距離**——那些拼得出你家位置。
  順便：watchdog 監控雷達離線／一小時 0 架就寄信，週報加「本週追蹤架次」
- [ ] **B12. 清掉 create-next-app 留下的預設圖** 🟩：`public/` 的 file／globe／next／vercel／window.svg 全站都沒用到（2026-11-17 查過）

**C. 維運／品質**

- [ ] **C1. 每月自動故障演練** ⭐ 🟧：故意停掉 kbs0830_NextJS，看 watchdog 幾分鐘內救回、有沒有寄信，結果寄報告。
  跟每季備份還原演練同一套（「設好了」跟「真的有用」是兩回事，9 月兩個「已修復」就是沒生效）。要挑凌晨、停站不到 5 分鐘
- [ ] **C2. 開機通知信** 🟩：桌機重開後寄一封「停了多久、是不是停電（看 Kernel-Power 事件）」
- [ ] **C3. 404 統計進週報** 🟩：只存「路徑 → 次數」，掃描器路徑排除
- [ ] **C5. 週報加 Cloudflare 快取命中率、外網抖動次數、磁碟空間** 🟩
- [ ] **C6. 首頁截圖比對測試** 🟧：淺色＋深色，抓「按鈕整個透明」這類 tsc／lint 抓不到的 bug
- [ ] **C7. 效能預算** 🟧：CI 跑 Lighthouse，JS 大小／LCP 退步超過門檻就報警
- [ ] **C8. 每月外部連結檢查** 🟩：作品的 GitHub 連結、文章引用的網址壞掉就寄信
- [ ] **C9. Renovate PR 自動試跑** 🟧 🙋：PR 開出來就 build 到第三個槽＋跑 E2E，結果留言在 PR 上（要 fine-grained PAT，跟 TODO 那項同一組）
- [ ] **C10. 筆電當第二台主機** 🟥：Cloudflare Tunnel 可以同時接兩個來源。筆電開著時自動分擔、桌機掛了接手。
  但筆電不是一直開著，**A2 比較實際**，這個當備案

## ⏳ 等別人更新

- [ ] **TypeScript 7**：typescript-eslint 還不支援（11/09 查：TS 已出 7.0.2，typescript-eslint 8.72.1 peer 仍是 `<6.1.0`），支援了再升
- [ ] **`THREE.Clock` deprecation warning**：來自 R3F 內部，等 R3F 改用 `THREE.Timer`（11/09 查：R3F 最新仍是 9.8.2，跟裝的一樣）

## 評估過、先不做（記下理由免得重查）

- **拿掉 `HeroScene.tsx` 剩下的 3 個 `useMemo`**（2026-11-09 評估）：這 3 個不是效能優化，是「整個元件生命週期只建一次」的
  three.js 物件（線條、粒子 geometry），後面有 `dispose()` 清理、`useFrame` 每幀改它們。React Compiler 的自動快取只是優化、
  不保證不重建；拿掉的話萬一被重建，就是 GPU 記憶體漏掉＋畫面閃一下。React 保證只建一次的寫法是 `useState(() => …)`，
  但跟現在一樣能用、沒有好處，不值得冒險改 3D 場景

- **Noto Serif JP 字體子集化**：Google Fonts 已經自動切成 374 塊、只下載用到的字；自己用 `text=` 子集化的話，
  之後作品標題用到清單外的字會悄悄變成別的字體，風險大於好處
