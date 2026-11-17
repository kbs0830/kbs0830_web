# IDEAS — kbs0830_web 點子庫

2026-11-17 腦力激盪整理（使用者：「多想一些點子」「工作量大點的」）。**這裡只是點子，還沒決定要做。**
想做哪個跟 Claude 說「做 IDEAS 的 ○○」；決定做的搬進 [TODO.md](TODO.md)，做完記進 [DONE.md](DONE.md)，不做的寫進 TODO「評估過、先不做」。

標記：🟥 大（好幾天）🟧 中（一兩天）🟩 小（一次做完）｜🙋 需要你提供東西｜⭐ Claude 推薦

---

## ⭐ Claude 推薦的前五名

1. **FoodLens 線上試玩**（A1）：作品集最強的證明是「直接能玩」，而且剛好證明 FoodLens 的賣點「影像不離開裝置」
2. **停電也不斷線**（A2）：10/29 斷 4 天、11/06 停電，都會變成訪客沒感覺
3. **網站更新紀錄 /changelog**（B1）：小工程，跟櫻花粉指示燈是同一套邏輯
4. **每月自動故障演練**（C1）：故意把網站停掉，確認 watchdog 真的救得回來，跟每季的備份還原演練同一個思路
5. **Search Console 數字自動進週報**（C4）：之後不用再手動匯出 CSV

---

## A. 大更新（🟥 好幾天）

### A1. FoodLens 在作品頁直接試玩 ⭐ 🙋
- 作品頁加上傳框，照片在**訪客自己的瀏覽器**裡用 ONNX Runtime Web 跑 YOLOv8，畫出辨識框和類別。照片不會上傳
- **2026-11-17 Claude 查過**：GitHub 上 FoodLens `main` 的 `docs/MODELS.md` 跟網站寫的一致（46 類、640 letterbox、門檻 0.25）。
  模型檔 `milliy-taomlar-detector-best.onnx`（43MB）**不在 git 裡**，大概只在你筆電上
  （桌面上那份 FoodLens 是舊版：`web-dev` 停在 5 個 commit、沒有 YOLO 程式；Claude 只跑了 `git fetch`，沒動你的檔案）
- 🙋 要你提供：那個 .onnx 檔，以及模型的出處／授權（Roboflow Universe 的公開資料集要看授權能不能再散佈）。
  頁面會照實寫「模型來源：Roboflow Milliy Taomlar（中亞料理 46 類）」，不會說成自己訓練的（除非真的是你訓練的）
- 技術重點：43MB 要等訪客按「試試看」才下載、下載時有進度條、之後用瀏覽器快取；有 WebGPU 走 WebGPU，沒有就用 WASM；
  CSP 要加 `'wasm-unsafe-eval'`；手機記憶體不夠時要降級或提示
- 類別都是中亞料理，台灣食物大多會辨識成 unknown／rice → 附幾張示範圖讓人一鍵試，比自己上傳更準

### A2. 停電也不斷線（雙來源容錯）⭐ 🙋
- 部署時把靜態頁另外輸出一份到 **Cloudflare Pages**；Cloudflare Worker 判斷桌機回 530／5xx 時改給 Pages 上的備份
- 備援模式：動態功能（訪客統計、Spotify、/stats、Web Vitals 回報）隱藏，頁面上有一行小字「目前是備援模式」
- 🙋 要你：建 Pages 專案、一組 token（權限 Pages Edit＋Workers Edit）
- 難點：Next 的頁面要能輸出成純靜態（有 `force-dynamic` 的頁面要排除）；兩份要同一版（部署成功才推 Pages）
- 做完正好寫一篇文章（自架網站維運系列第 6 篇）

### A3. 日文版網站（/ja）🙋
- 多語系路由、hreflang、日文 OG 圖、日文 Markdown 版、sitemap alternates
- 你在高雄、福岡兩地，日本的搜尋、面試官都用得到
- 🙋 你目前是 N5，要找會日文的人審過；不然先只翻首頁跟作品頁

### A4. 公開維運儀表板＋事故報告（/status）
- 90 天可用率長條圖（來源：watchdog.log＋uptime.yml）、部署時間軸（deploy.log，含退回）、自動重啟紀錄
- **事故報告**：用真實事件寫成「發生什麼 → 怎麼發現 → 根因 → 修法 → 預防」（72 小時上限、Tunnel 斷 4 天、node.exe 無聲死掉、
  CI 灌 1037 筆假訪客、11/13 一分鐘抖動寄兩封信）。部落格已經有其中幾篇，事故報告的格式更短、可以互相連結
- 注意：log 只能公開彙總數字，不放路徑細節、IP

### A5. 旅行頁大改版：3D 地球（/travel）
- /flights＋/hotels 合成一頁：可以轉動的地球、大圓航線弧線、住過的城市點，點一下城市看那裡住過幾間
- 首頁已經有 three.js，不用新增套件；手機沿用 HeroSceneLite 那套 Canvas 2D 投影
- 隱私不變：不放日期，只標城市

### A6. 部落格升級
- 全文搜尋：Pagefind（build 時建索引，零伺服器、中文要測斷詞）
- 留言：giscus（GitHub Discussions，訪客用 GitHub 登入；不收 email，不用另外註冊）
- 程式碼複製按鈕、每篇附「對應的 commit」連結、RSS 改全文（現在只有摘要）

### A7. 首頁 3D 用 WebGPU 重寫
- three.js 的 WebGPURenderer＋TSL，粒子改用 compute shader（數量可以加，但風格照舊「稀疏、慢」）；不支援的瀏覽器退回現在的 WebGL
- 新技術展示，但**風險最高**：60fps 目標、相容性、R3F 支援度都要先驗證。不急

### A8. 網站架構互動圖（/colophon）
- 一張可以點的圖：訪客 → Cloudflare（快取／WAF）→ Tunnel → server.js → 雙槽 .next-a／.next-b → data/，
  watchdog、備份、CI 掛在旁邊。點每個節點看它在做什麼、加上即時數字（快取命中、上線多久、上次部署）
- 等於把 CLAUDE.md 的部署架構做成給人看的版本；適合放在 kbs0830-web 作品頁裡

### A9. 給 AI 用的網站 MCP 伺服器
- 已經有 `/llms.txt` 跟每頁 Markdown 版；再往前一步：`/mcp` 讓 AI 助理直接查「他做過哪些作品」「最新文章」
- 唯讀、只回傳網站上本來就公開的內容；跟「AI 搜得到我的名字」的目標一致
- 新技術，但目前真的會用 MCP 查個人網站的人不多，**展示意義大於實用**

### A10. 公開 JSON API（/api/v1）＋文件
- projects、posts、now、flights 統計，附 OpenAPI 文件頁。展示後端能力，也方便自己其他專案（GitHub profile README）拿資料
- 跟 Markdown 版共用資料來源，不另外維護

---

## B. 網站功能（🟧／🟩）

- **B1. 網站更新紀錄 /changelog** ⭐ 🟩：從 `feat` commit 自動產生，頁尾「最後更新」連過來。commit 訊息要寫給人看的（現在大多是）
- **B2. 終端機加指令** 🟩：`neofetch`（真實硬體規格）、`uptime`、`blog`、`status`、`history`、Tab 自動補完
- **B3. 頁尾二十四節氣** 🟩：時鐘旁邊加小字「立冬」，瀏覽器端算
- **B4. 「いま N 人」** 🟧：頁尾顯示現在正在看網站的人數（每頁每 30 秒報一次、只記數字），分頁在背景時不報
- **B5. 文章頁麵包屑結構化資料** 🟩：作品頁有，文章頁沒有
- **B6. /flights 趣味換算** 🟩：「總距離 ≈ 繞地球 N 圈／到月球的 N%」
- **B7. 每頁專屬分享圖** 🟩：/flights、/hotels、/stats、/now 還在用全站預設圖
- **B8. `/.well-known/security.txt`** 🟩：現在是 404。RFC 9116 標準檔，寫聯絡方式（用 otemon 還是 1394kbs 要你決定）
- **B9. 作品頁改成案例格式** 🟧：每個作品固定「問題 → 我的決定 → 取捨 → 結果」四段，面試官最想看「為什麼這樣做」。
  只用 repo 裡真的有的資訊，沒有的段落就不寫
- **B10. 文章離線閱讀** 🟧：Service Worker 快取讀過的文章，沒網路也打得開（PWA manifest 已經有了）
- **B11. 列印版文章** 🟩：履歷已經有列印樣式，文章也排一份（程式碼不截斷、連結印出網址）
- **B12. 清掉 create-next-app 留下的預設圖** 🟩：`public/` 的 file／globe／next／vercel／window.svg 全站都沒用到（2026-11-17 查過）

## C. 維運／品質

- **C1. 每月自動故障演練** ⭐ 🟧：故意停掉 kbs0830_NextJS，看 watchdog 幾分鐘內救回、有沒有寄信，結果寄報告。
  跟每季備份還原演練同一套（「設好了」跟「真的有用」是兩回事，9 月兩個「已修復」就是沒生效）。要挑凌晨、停站不到 5 分鐘
- **C2. 開機通知信** 🟩：桌機重開後寄一封「停了多久、是不是停電（看 Kernel-Power 事件）」
- **C3. 404 統計進週報** 🟩：只存「路徑 → 次數」，掃描器路徑排除
- **C4. Search Console 數字自動進週報** ⭐ 🟧 🙋：用 Search Console API 抓已建立索引數、點擊、曝光。要你建 Google Cloud 服務帳號、加進 Search Console
- **C5. 週報加 Cloudflare 快取命中率、外網抖動次數、磁碟空間** 🟩
- **C6. 首頁截圖比對測試** 🟧：淺色＋深色，抓「按鈕整個透明」這類 tsc／lint 抓不到的 bug
- **C7. 效能預算** 🟧：CI 跑 Lighthouse，JS 大小／LCP 退步超過門檻就報警
- **C8. 每月外部連結檢查** 🟩：作品的 GitHub 連結、文章引用的網址壞掉就寄信
- **C9. Renovate PR 自動試跑** 🟧 🙋：PR 開出來就 build 到第三個槽＋跑 E2E，結果留言在 PR 上（要 fine-grained PAT，跟 TODO 那項同一組）
- **C10. 筆電當第二台主機** 🟥：Cloudflare Tunnel 可以同時接兩個來源。筆電開著時自動分擔、桌機掛了接手。
  但筆電不是一直開著，**A2 比較實際**，這個當備案

## D. 部落格題材（真的發生過的）

- 11/13「一分鐘的 Tunnel 抖動寄了兩封信」：逾時跟 404 被當成同一種錯誤、改成連續兩輪才通知
- 11/12「Vitest 在 Git Bash 全部報錯、PowerShell 全過」（原因還沒查到，查到再寫）
- 11/12 網站圖示狀態色＋新功能指示燈怎麼做（部署 → JSON → API → favicon）
- 11/09 Cloudflare 快取開了之後「未過濾流量」變少：快取命中的請求根本不會到桌機
- 架站成本（電費、網域、Cloudflare 免費方案）🙋 要真的數字

## E. 你要確認的（Claude 查到的）

- ⚠️ **FoodLens 公開 repo 根目錄有一個 `irs_1774…pdf`**（3 頁、Word 2019 產生、作者欄「user」，5/21 第一次 commit 就在）。
  Claude 沒辦法讀內容（沒有 PDF 工具）。**如果是個人文件就要從 repo 拿掉**：只刪檔案的話 git 歷史裡還在，要整個從歷史清掉
  （跟 Claude 說，給方法）。是正常的專題文件就不用管
