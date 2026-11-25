# TODO — kbs0830_web

這裡**只放還沒做的**；做完的搬到 [DONE.md](DONE.md)（2026-11-09 拆開）。
做完任何一項跟 Claude 說，它會回查、從這裡刪掉、記進 DONE.md。

📬 有日期的項目會自動寄提醒信到 otemon（`reminders.json`）：12/09 CSP 回查、
2026 年底 GHA 鈦金、2027/05/16 網域續約、2027/08/31 年級更新、2027 年底 IHG 酒廊、2028 年底華航金卡。

---

## 🙋 你要動手的（要你的帳號或管理員權限，Claude 做不到）

- [ ] **登入 `gh`**（11/25 已寄 check list 信）：桌機自己的終端機跑 `gh auth login`（GitHub.com → HTTPS → 瀏覽器登入）。
  登入後 Claude 能看 CI 失敗的錯誤訊息（`gh run view --log-failed`）、讀 school 私有 repo。GitHub 外掛不用修（它缺 `GITHUB_PERSONAL_ACCESS_TOKEN`，而且每次對話都要載入說明）
- [ ] **站長後台的 Cloudflare Access**（A1；11/25 check list 第 2 項）：Zero Trust → Access → Self-hosted，`kbs0830.com/admin*`、`/api/admin/*`，只放 1394kbs@gmail.com；
  JWT 驗證已寫好（11/26）；做完把 team 名稱、AUD tag 填進 `.env.local` 的 `CF_ACCESS_TEAM`／`CF_ACCESS_AUD`／`ADMIN_EMAIL`，重啟網站
- [ ] **school repo push**（11/25 check list 第 3 項）：均線回測修正 commit 0d871c3 只在本機
- [ ] **雷達樹莓派換官方電源**（11/25 check list 第 4 項）：Pi 3 官方 5.1V 2.5A；供電不足導致離線

1. [ ] **刪掉 FoodLens repo 裡的 `irs_1774….pdf`**（11/21 使用者決定刪。內容是「人工智慧與深度學習應用」期末專題說明，不是個人文件，
   不用清 git 歷史）：GitHub 打開那個檔案 → 右上「⋯」→ Delete file → Commit changes（Claude 沒有那個 repo 的推送權限）。
   📍 11/22 回查：還在
2. [ ] **Search Console 5xx／404 驗證**：不用動作，等 Google 跑完。📍 **11/21 匯出**：已建立索引 **31**（11/10 從 11 跳上來）、未建立 24；
   5xx 7、404 2、已找到未建立 4 都是「驗證已開始」；「已檢索 - 尚未建立索引」9（11/12 是 27，tag 頁 noindex 後變少）；
   「頁面會重新導向」2＝http／www 導向，本來就該導，驗證「失敗」不用理。API 查 sitemap 31 頁有 25 頁已收錄（沒收的多是新頁）
3. [ ] **GitHub 門面**（11/21 使用者：最後做；改的是別的 repo）
   → About（描述、網站、topics）三個 repo 都空的；Claude 11/21 給了要貼的文字（FoodLens、YARTIX、kbs0830_web）
   → pin `FoodLens-Advisor`、`YARTIX-TICKETING-TEST`、`kbs0830_web`；前兩個的 README 補截圖／架構圖／安裝步驟
   → profile README（`kbs0830/kbs0830`）：11/09 Claude 寫好「跟網站同風格」的草稿（Claude 沒有那個 repo 的推送權限），
     要換的話說一聲：你推、或照網站 repo 的做法給一把 deploy key 讓 Claude 推。現在的版本作品名還是舊的（Food Vision Analyzer）
   → 📍 11/22 新素材：首頁 WebGPU 版很適合錄一段 GIF 放 kbs0830_web 的 README／profile README（Claude 可以用真顯卡錄）；
     做了 ⚙️ B15 狀態徽章的話，README 可以放「近 90 天可用率 99.x%」
4. [ ] **IG 簡介放網站連結**（11/21 使用者：先不放）
5. [ ] **文章留言要不要開**（giscus，11/21 Claude 做好了、預設關著）：要的話
   ① GitHub 的 kbs0830_web repo → Settings → Features 勾 **Discussions**
   ② 裝 https://github.com/apps/giscus （只選 kbs0830_web）
   ③ 打開 https://giscus.app/zh-TW 填 repo、分類選 **Announcements**，把頁面最下面那段的 `data-repo-id`、`data-category-id` 貼給 Claude

## 🤔 你要決定或提供素材的

**內容**
- [ ] **`/now` 更新**：內容從 7 月沒動過，告訴 Claude 現在在忙什麼；順便加「最後更新」日期。
  現在寫的「學習 React Three Fiber 進階、WebGL Shader」可能要改成 WebGPU／TSL（首頁剛做了 compute shader 版）——你說了才改
- [ ] **試玩首頁 WebGPU 版給回饋**（11/22 上線）：桌機 Chrome 開首頁按住／拖曳／雙擊。想調的跟 Claude 說：
  粒子太多／太少、聚集太快／太慢、形狀要換（例如換成高雄↔福岡、某個作品的圖示）、左下角提示字要不要留
- [ ] **FoodLens 換成真機截圖**（可選）：11/25 所有作品都有圖了，FoodLens 那張是照 Android 程式碼重繪的**示意圖**（圖上有標）。
  想換成真的：手機截一張分析結果（不要有真人臉）給 Claude，或給 Gemini 金鑰＋一張食物照片讓 Claude 跑
- [ ] **均線回測修好了，要你 push school repo** 🙋：11/25 三個 bug 都修了（0 張賣出、賣出費用改扣、本金不夠不買），
  已在本機 `Desktop\school` commit（`0d871c3`），Claude 這邊 push 會跳 GitHub 登入視窗（school repo 沒設推送用的金鑰）——你連回桌機在那個資料夾 `git push` 就好。
  修完後股價高到一張超過本金時（聯發科）會跳過不買，結果多一行「本金不足 N 次」（真資料還沒跑：桌機沒裝 yfinance／rich）；網站要補報酬率的話跟 Claude 說
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
  **11/21～22 新的**：`/changelog` 自己 build 正常、CI 部署卻整頁空白（runner 經過 cmd.exe 把 `%h` 格式字串吃掉，第三次部署才修對）、
  Google Fonts 回了壞字型讓整個 build 失敗（雙槽擋住、線上沒事）、cloudflared 裝了兩份（`--version` 看的跟服務跑的不是同一份，升級了等於沒升）、
  WebGPU 的坑（有 `navigator.gpu` 沒顯卡掉到 12 fps、Playwright 內建 Chromium 少 dxcompiler.dll、`uniformArray` 不會同步給 compute shader）——
  這一篇題材最完整，可以當「首頁做成 WebGPU」的開發紀錄

**設計／取捨**
- [ ] **時間軸互動**：現在是滑鼠移上去／點一下展開、移開收起；想要回到「點一下固定展開、再點收起」跟 Claude 說
- [ ] **先隱藏的東西**，想恢復哪個跟 Claude 說：
  → **下載履歷按鈕**（`/resume` 頁跟 PDF 照舊在，只是沒入口；恢復方法在 `ContactSection.tsx` 註解）
  → **Facebook**（Contact 連結、JSON-LD `sameAs`；`e2e/privacy.spec.ts` 要一起改）
  → **頁首以外的桌機特效**：游標光圈、點擊漣漪、卡片聚光燈＋3D 傾斜、小標解碼、背景直書大字、時間軸畫線（commit `cdf68f9`）

**要你建帳號／金鑰才能做**
- [ ] **Renovate patch 更新自動合併**（需要一組 fine-grained PAT）：內建 token 開的 PR 不會觸發 workflow、沒測試結果可依據
- [ ] **聯絡表單**：要申請 EmailJS／Formspree 帳號（之前 mailto 版你說不需要）


**搞錢**（計畫在 [make-money.md](make-money.md)，對應下面的 E 系列）
- [ ] **接案條件**：接哪些案子、價位（或只寫「依需求報價」）、每週能投入幾小時、接不接日本的案子 → Claude 才能做 E1 `/hire`
- [ ] **申請聯盟帳號**：Amazon.co.jp アソシエイト／博客來／蝦皮／Agoda／Booking 挑幾個（海外居民能不能申請，看各家條款）→ E9
- [ ] **選一個贊助平台**：GitHub Sponsors、Ko-fi、Buy Me a Coffee 在台灣能不能收款都沒查到 (?)，申請時確認 → 頁尾加一行連結
- [ ] **電費**：桌機平均幾瓦、每度幾元（插座電錶量一週最準）→ 填 make-money.md 的成本表、E11、部落格「架站成本」

**其他**
- [ ] **Claude Code 遠端 session 的問題**：下次發生時把錯誤訊息或狀況記下來給 Claude
  （11/09 貼的「無法從 docs.renovatebot.com 載入結構描述：位置不受信任」不是這個——那是 VS Code 打開 `renovate.json`
  的訊息，已用 `.vscode/settings.json` 信任那個網域，重開檔案就不會再跳）

## ⚙️ 還沒做的點子（Claude 可以直接做，說「做 ○○」就開工）

### 🟥 A1 站長後台 /admin（2026-11-25 設計好，下一個 session 實作；使用者：「把站長後台架構及前端入口先想好，等等實作」）

**進度**：✅ 骨架上線（2026-11-25，commit 9f7881a）：`src/proxy.ts`、`lib/admin/auth.ts`（目前只放行本機）、五頁空殼、`/api/admin/me`、`e2e/admin.spec.ts`。
✅ 總覽、流量、維運、寄信 四頁接上真資料（唯讀）。✅ `auth.ts` 的 JWT 驗證（11/26，WebCrypto、單元測試 `auth.test.ts`；env 沒設＝外部一律 404）。⬜ 下一步：使用者設 Cloudflare Access＋填 env → 各頁填資料 → 隱藏入口 → /reports 搬進來

**目標**：把現在散在各處、只能在桌機看的東西（/reports、/stats 的細節、部署／watchdog／雷達狀態、寄信紀錄）集中到一個只有站長能進的地方，外出用手機也能看。

**門禁（兩層，缺一不可）**
1. **Cloudflare Access**（Zero Trust 免費版，≤50 人）：Application 保護 `kbs0830.com/admin*` 跟 `/api/admin/*`，政策只放 `1394kbs@gmail.com`，登入方式 Email OTP（或 Google）。沒登入連頁面都到不了 origin。🙋 要使用者在 Cloudflare dashboard 建（或給有 Access:Edit 權限的 API token 讓 Claude 用 API 建），建完 `curl -sI https://kbs0830.com/admin` 要看到 302 到 `*.cloudflareaccess.com` 才算數
2. **origin 自己再驗一次**：`src/lib/admin/auth.ts` 的 `requireAdmin()`——驗 `Cf-Access-Jwt-Assertion`（JWT，用 `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` 的公鑰、檢查 `aud`＝Application AUD、`email`＝站長）；**本機請求**（沒有 cf-connecting-ip，跟現在 `/api/reports` 一樣的判斷）直接放行，方便桌機上開。驗不過一律回 **404**（不是 401，不讓人知道有後台）。team 名、AUD 放 `.env.local`
- 在 `proxy.ts`（Next 16 的 middleware）擋 `/admin`、`/api/admin` 前綴，頁面跟 route 裡再呼叫一次 `requireAdmin()`（proxy 只是第一道，不能只靠它）

**頁面（全部 `PageShell`、noindex、不進 sitemap／llms.txt／Ctrl+K 公開索引；robots.txt Disallow `/admin`；統計不記錄 /admin 的瀏覽）**
| 路徑 | 內容 | 資料來源（已有） |
|---|---|---|
| `/admin` | 總覽卡片：今天訪客／即時線上、上次部署（成功或失敗＋時間）、watchdog 最近告警、雷達在不在線、下一封週報／月報日期 | `lib/stats`、`logs/deploy.log`、`data/alerts/`、`data/radar.json`、`data/report-mail-state.json` |
| `/admin/reports` | 現在的 `/reports` 搬進來（日報／週報／月報），舊網址 308 轉過來 | `lib/stats/reports.ts` |
| `/admin/traffic` | 未過濾流量、爬蟲、404 清單、來源細節（/stats 公開版看不到的） | `raw-traffic.js`、`NOT_FOUND_FILE` |
| `/admin/ops` | 部署紀錄（最近 20 次）、排程工作狀態、watchdog 告警歷史、備份最後時間 | `logs/`、`data/alerts/` |
| `/admin/mail` | 週報／月報寄送紀錄，按鈕「重寄這週」「預覽」（呼叫 `report-mail.ps1 -DryRun`／`-Force`） | `report-mail-state.json` |
- 寫入類動作（重寄信、清快取）走 `POST /api/admin/*`，要再檢查 `Origin` 是 kbs0830.com（防 CSRF）；**第一版先只做唯讀**，寫入類第二步再加
- Cache Components：每頁照 `/radar` 的寫法 `Shell`＋`<Suspense>`＋`await connection()`；全部是 ƒ
- 檔案位置：頁面 `src/app/admin/`、資料讀取 `src/lib/admin/`（`import "server-only"`）、元件 `src/components/admin/`

**前端入口（公開頁面上看不到）**
- 不在 NavBar／Footer 放任何連結；站長自己存書籤 `kbs0830.com/admin`
- 登入過 Access 之後才出現的小入口：Ctrl+K 打 `admin`／`管理` 時打 `GET /api/admin/me`，回 200 才在結果裡多一列「站長後台」；Footer 的「最後更新」那行在 me=200 時多一個小 `管理` 連結。沒登入的人 /api/admin/me 是 404，前端什麼都不顯示
- `/api/admin/me` 只回 `{ ok: true }`，不回 email

**測試**：E2E 打 `/admin`、`/api/admin/me` 帶假的 `cf-connecting-ip` 要 404；本機（不帶）要 200；`privacy.spec` 加 /admin 頁面不能被 sitemap／llms.txt 列出

標記：🟥 大（好幾天）🟧 中（一兩天）🟩 小（一次做完）｜🙋 需要你提供東西｜⭐ Claude 推薦。2026-11-17 腦力激盪整理（使用者：「多想一些點子」「工作量大點的」），還沒決定要做；不做的搬到最下面「評估過、先不做」

**⭐ Claude 推薦的**

1. **FoodLens 線上試玩**（A1）：作品集最強的證明是「直接能玩」，而且剛好證明 FoodLens 的賣點「影像不離開裝置」
2. **停電也不斷線**（A2）：10/29 斷 4 天、11/06 停電，都會變成訪客沒感覺
3. **每月自動故障演練**（C1）：故意把網站停掉，確認 watchdog 真的救得回來，跟每季的備份還原演練同一個思路

（11/22 補了 B13～B16、C11、C12；C11 當天做完、B16 11/23 做完）

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

**B. 網站功能（🟧／🟩）**

- [ ] **B16. 稀有機型首頁提示** 🟩（機體図鑑的延伸）：雷達收到 747、A380 這類「珍しい」機型時，首頁角落安靜浮一行「今日は珍しい機体：Boeing 747-8F」，只寫機型
- [ ] **B17. デプロイ俳句** 🟧（11/25 創意清單第 4 項，使用者還沒選）：每次部署用 3070 本機模型把 commit 寫成 5-7-5 俳句＋中文，掛在 /changelog

- [ ] **B2. 終端機加指令** 🟩：`neofetch`（真實硬體規格）、`uptime`、`blog`、`status`、`history`、Tab 自動補完；
  11/22 加：`hero name`／`hero routes`／`hero icon` 直接叫 WebGPU 版排形狀、`hero gl` 換 WebGL 版比較
- [ ] **B3. 頁尾二十四節氣** 🟩：時鐘旁邊加小字「立冬」，瀏覽器端算
- [ ] **B10. 文章離線閱讀** 🟧：Service Worker 快取讀過的文章，沒網路也打得開（PWA manifest 已經有了）

**D. 接外部 API（11/22 使用者：「API 抓什麼數據來玩」）**

共同做法照 Cloudflare 流量那套：**伺服器端抓、存本機快取、失敗就不顯示**——訪客的瀏覽器不連第三方（不用改 CSP、不把訪客 IP 給別人），API 掛了網站照常。

- [ ] **D1. 自己畫 GitHub 貢獻熱力圖** ⭐ 🟧 🙋：現在用的 ghchart 是別人的服務、白底圖片，深色模式是一塊白卡（CLAUDE.md 記著的「已知取捨」）。
  改用 GitHub GraphQL 抓貢獻數，自己畫 SVG，跟著主題變色、hover 看當天幾次。🙋 要一組 fine-grained PAT（只要讀公開資料）
📍 **11/22 使用者：「做 D2、D3、D4、D5、D6（順便做小港／福岡機場的即時時刻表）」**——全部當天做完（見 DONE.md）。剩下的 D1、D7～D9 還沒做

- [ ] **D7. 今日の漢字** 🟩：kanjiapi.dev（免費）每天一個 N5 漢字（讀音、意思），放 /now 或終端機 `kanji` 指令，呼應「N5 学習中」
- [ ] **D8. 這週寫了幾小時 code** 🟧 🙋：WakaTime 的程式時數＋語言比例放 /now 或 /stats（「主角還是 code」）。🙋 要裝 WakaTime 外掛、給 API key
- [ ] **D9. Spotify 本月最常聽** 🟩 🙋：現在只有「正在聽」。要多一個 `user-top-read` 權限，得重跑一次 `spotify-get-refresh-token.js` 授權

**C. 維運／品質**

- [ ] **C1. 每月自動故障演練** ⭐ 🟧：故意停掉 kbs0830_NextJS，看 watchdog 幾分鐘內救回、有沒有寄信，結果寄報告。
  跟每季備份還原演練同一套（「設好了」跟「真的有用」是兩回事，9 月兩個「已修復」就是沒生效）。要挑凌晨、停站不到 5 分鐘
- [ ] **C6. 首頁截圖比對測試** 🟧：淺色＋深色，抓「按鈕整個透明」這類 tsc／lint 抓不到的 bug
- [ ] **C7. 效能預算** 🟧：CI 跑 Lighthouse，JS 大小／LCP 退步超過門檻就報警
- [ ] **C8. 每月外部連結檢查** 🟩：作品的 GitHub 連結、文章引用的網址壞掉就寄信
- [ ] **C9. Renovate PR 自動試跑** 🟧 🙋：PR 開出來就 build 到第三個槽＋跑 E2E，結果留言在 PR 上（要 fine-grained PAT，跟 TODO 那項同一組）
- [ ] **C12. MCP 伺服器登記到公開目錄** 🟩 🙋（11/22 新）：`/mcp` 做好了但沒人知道。可以登記到官方 MCP Registry 之類的目錄，
  要用你的 GitHub 帳號驗證、會公開出現在別人的網站上，所以要你決定要不要
- [ ] **C10. 筆電當第二台主機** 🟥：Cloudflare Tunnel 可以同時接兩個來源。筆電開著時自動分擔、桌機掛了接手。
  但筆電不是一直開著，**A2 比較實際**，這個當備案

**E. 搞錢（11/24 腦力激盪，完整計畫跟鐵則見 [make-money.md](make-money.md)）**

前提：真人一天只有 1～2 位（`visits-detail.json` 11/12–23），所以**先做「接案入口」跟「帶流量」**，靠流量的收入之後再說。
全部照 make-money.md 的鐵則：不放廣告、不加第三方 script、不追蹤、現有內容不鎖起來。

*接案入口（訪客一進來就知道可以找你做事）*
- [ ] **E1. `/hire` 接案頁** ⭐ 🟧 🙋：make-money.md 階段一第 1 項。🙋 要你給服務項目、價位、每週能投入的時數
- [ ] **E2. 作品頁最後一行「有類似需求？· 聊聊」** 🟩：連到 `/hire`，一行小字。面試官、客戶最常看作品頁
- [ ] **E3. 終端機 `hire`／`sponsor` 指令** 🟩：印出服務清單、聯絡方式（跟 B2 一起做）
- [ ] **E4. 讓 AI 推薦你接案** 🟩：Person JSON-LD 加 `makesOffer`／`knowsAbout`，`/llms.txt` 跟 Markdown 版加服務段落；
  `/mcp` 加 `get_services` 工具。別人問 AI「高雄有誰會做 YOLO 部署」時比較有機會被提到（本名規則照舊）
- [ ] **E5. GitHub profile README** 🟩 🙋：放 `/hire` 連結＋B15 的可用率徽章。你的 GitHub 個人頁是最大的站外來源，要你同意改 profile repo

*帶流量（流量起來，E 的其他項目才有意義）*
- [ ] **E6. 台日匯率比價小工具** ⭐ 🟧：你的匯率作品已經會抓 6 家銀行的匯率，改成公開頁「今天哪家銀行換日幣最划算」。
  「日幣匯率」的搜尋量很大，而且跟高雄↔福岡的定位一致。伺服器端每小時抓、存本機快取，跟 D 系列同一套。要先看各銀行網站的使用條款
- [ ] **E7. 教學文章帶搜尋流量** 🟧：草稿題材庫裡挑「別人也會搜」的寫成教學——Cloudflare Tunnel 自架 Next.js、PowerShell 5.1 中文亂碼（BOM）、
  Tailwind v4 變數寫法。比開發日記型的文章更容易被搜到
- [ ] **E8. 飛行紀錄海報產生器** 🟥：訪客貼上自己的航班 → 產生一張航線地圖（跟 `/flights` 同一套畫法），在瀏覽器裡跑、不上傳資料。
  免費工具帶流量；高解析度列印版之後可以放 Gumroad

*收入（make-money.md 階段一 3、4 項）*
- [ ] **E9. 聯盟連結資料檔＋標示** 🟩 🙋：`/uses`、`/hotels` 的推薦碼集中放一個檔案、頁首加揭露聲明、`rel="sponsored"`。🙋 要你先申請到聯盟帳號
- [ ] **E10. `/go/<代號>` 轉址＋點擊統計** 🟩：伺服器端記次數放 `/stats` 跟週報（不用 cookie），才知道推薦連結、`/hire` 有沒有人點
- [ ] **E11. 透明的「架站成本」頁** 🟧 🙋：每年網域＋電費多少、贊助打平了幾 %，旁邊放贊助連結。說清楚錢用在哪，比單一個「請我喝咖啡」更有說服力。
  🙋 要你給電費數字，而且要決定願不願意公開金額（金額放不進 git 的 `data/`，不寫進 repo）
- [ ] **E12. 賣模板的前置作業** 🟥：個人資料、雷達、統計全部抽成設定檔，讓這個網站能變成別人可以用的模板（make-money.md 階段二）。
  順便讓程式更乾淨，就算最後不賣也不虧

**F. 頁首／頁尾（11/24 Claude 看程式＋正式站截圖：桌機 1280、手機 390）**

*實際看到的問題*
- [ ] **F2. 子頁面的頁首捲下去就沒了** ⭐ 🟧：長文章要回首頁或搜尋，得捲回最上面。改成跟首頁 NavBar 一樣固定在上方
  （捲動後才出現半透明底＋細線），左「← 返回」、右「搜尋＋主題」

*程式裡看到的（沒實測）*
- [ ] **F7. NavBar 半透明背景改純 CSS** 🟩：現在每次捲動都由 `useScrolledPast` 觸發 React 檢查，可以改成 `animation-timeline: scroll()`
  （跟捲動進度條同一套）。不支援的瀏覽器保留現在的 JS 當備案

*可以加的*
- [ ] **F8. 頁尾加「找我」一欄** 🟩：GitHub、Email、API。之後 E1 的「接案」、
  make-money.md 的贊助連結也放這欄；「© PINGWEI LI」那行的 kbs0830 字樣連回首頁（子頁面頁尾目前沒有「首頁」）
- [ ] **F11. 首頁頁尾加「● 正常運作」** 🟩：讀 `/status` 已經有的可用率資料，有中斷時改用 `--warn` 色，點了到 `/status`
- [ ] **F12. 首頁 NavBar 要不要加「記事」→ `/blog`** 🙋：現在從首頁到部落格只能靠頁尾或 Ctrl+K。
  會從三項變四項，跟「引き算」有衝突，所以要你決定

**G. 站長後台**

- [ ] **G1. 只有你能進的後台 `/admin`，Google 登入** 🟥 🙋（11/24 使用者：「我自己進入的後台，敏感資料全部在裡面，用 Google 登入」）
  - **做法 ⭐ Cloudflare Access（Zero Trust）擋在最前面**：登入方式選 Google，規則只放行你的 Gmail。
    網站本來就走 Cloudflare Tunnel，沒登入的請求在 Cloudflare 就被擋下，**根本到不了桌機**；
    也不用在 Next 裡自己寫 OAuth、session、CSRF。免費方案 50 人以內不用錢 (?)
  - **要搬進來的（11/25 使用者）**：日報／週報／月報目前在公開的 `/reports`（noindex、不進 sitemap、導覽沒有連結），後台做好就整頁搬過來、
    `/reports` 改成 404；搬完網頁上也可以放 Search Console 的搜尋字詞（現在只進信）
  - **第二道防線**：Next 這邊也驗 Cloudflare 帶進來的 `Cf-Access-Jwt-Assertion`（簽章、aud、email），驗不過就回 404。
    萬一有人從區網直接連 port，或 Access 規則被誤刪，後台也不會沒人顧
  - 備案：Auth.js＋Google provider 寫在 app 裡。要自己管 client secret、session cookie、CSRF，維護比較麻煩，Access 不能用再考慮
  - 🙋 **要你做**：Cloudflare 後台 → Zero Trust → 登入方式加 Google（要先到 Google Cloud Console 建 OAuth client）→
    新增 Access application，保護 `kbs0830.com/admin*` 跟 `/api/admin/*` → 規則 Include Emails＝你的 Gmail。
    或者給 Claude 一組有 Access 編輯權限的 token，由 `cloudflare-config.ps1` 設定（Google OAuth client 還是要你建）
  - **規則**：
    → 放行的 email 寫在 `.env.local`（例如 `ADMIN_EMAILS`），不寫進 repo
    → `/admin` 全部 `noindex`，**不進** sitemap、`site-map.ts`（頁尾／Ctrl+K）、`/llms.txt`、Markdown 版；robots.txt 也不要列（列了等於公告路徑）
    → **Cloudflare 快取規則要排除 `/admin`**（現在靜態頁會快取一年，只排除 `/api/`、`/stats`），回應加 `Cache-Control: no-store`
    → 敏感資料只在伺服器端讀，不開公開 API；從公開頁搬進後台的東西，公開那邊要改成只剩總數或直接拿掉
    → 第一版**只能看、不能改**。清快取、開維修模式這類會動到正式站的按鈕之後再說
    → 登入後台的瀏覽器自動打開「不計入統計」（`kbs-not-me`）
    → 驗收：沒登入 `curl -sI https://kbs0830.com/admin` 要看到轉去 `cloudflareaccess.com` 登入頁；E2E 測不帶 JWT 打 origin 會拿到 404
  - **可以放進去的**（🙋 你決定哪些要搬、哪些公開頁要縮減）：
    → 現在公開的：`/stats` 的完整訪客分析（來源網域、時段、裝置、國家）、`/status` 的部署細節
    → 現在只在桌機檔案或信箱裡的：watchdog 告警紀錄、log、未過濾流量、Search Console 週報、雷達的完整資料
      （位置、涵蓋範圍這些公開頁不放的東西，放後台也要你點頭）
    → 搞錢相關：實際收入、聯盟和 `/go/` 的點擊數（E10）、架站成本的實際金額（E11）——make-money.md 說不寫進 repo 的資料就放這裡（存在不進 git 的 `data/`）
  - **決策表**（11/24 使用者：「這個決策表想法不錯，等後台用好直接加入後台」）：現在先放在 Claude Doc 的「決策表」分頁
    （https://claude.ai/artifact/EJ5NoHuYq3jGy9W5fEL2zH ），後台做好後搬進來：
    → build 時從 TODO.md 解析出每一項（編號、標題、大小、🙋、⭐），每列一個「先做／之後／不做」選擇，可以加備註
    → 選擇存在 `data/decisions.json`（不進 git）；Claude 開工前讀這份，照「先做」排順序、做完再從 TODO.md 搬到 DONE.md
    → 這是後台第一版唯一會「寫入」的功能，只寫這一個檔案，不碰正式站的設定（跟「只能看、不能改」的原則不衝突）
    → 搬進後台後，Claude Doc 那份就停用，避免兩邊各選各的

**H. 用閒著的 RTX 3070＋32GB（11/24 使用者：「記憶體跟 3070 很閒」）**

📍 11/24 Claude 實測：GPU 使用率 0%、顯存用了 1.5／8 GB、閒置功耗 44 W；記憶體還有 17.8／31.7 GB 可用。
Ollama 已經裝好（`%LOCALAPPDATA%\Programs\Ollama`），但**沒有在跑**、也沒下載任何模型。
8 GB 顯存大約跑得動 7～8B 的模型（4-bit 量化）、Whisper、YOLO、embedding 模型；再大就要放一部分到記憶體，速度會掉很多 (?)

*共同規則（所有用到 GPU 的功能都照這套，跟 D 系列「失敗就不顯示」同一個精神）*
- Ollama 是獨立的程式，不跟網站同一個 process；一次只載入一個模型、一次只處理一個請求（`OLLAMA_MAX_LOADED_MODELS=1`、`OLLAMA_NUM_PARALLEL=1`），閒置就釋放顯存
- 網站呼叫一律加逾時＋`AbortController`；GPU 忙、Ollama 掛了，功能就隱藏或顯示「現在忙碌」，**網站本身不受影響**
- 公開功能要有：每個 IP 的次數限制、**每天總量上限**（等於電費上限）、排隊人數上限。不放 Turnstile 這類第三方 script（make-money.md 鐵則）
- 電費：GPU 滿載比閒置多 150 W 左右 (?)，24 小時跑滿＝一天多 3.6 度。上線後在後台（G1）記實際用量
- 🙋 讓 Ollama 開機自動啟動，要你用管理員視窗設排程工作（Claude 沒有權限）；watchdog 加一項 Ollama 檢查（掛了只記錄、不寄信）

*擴大網站（帶流量、證明實力 → 接案、求職）*
- [ ] **H1. 「問我」AI 助理 `/ask`** ⭐ 🟥：訪客問「他會 YOLO 部署嗎？」「做過哪些 Next.js 專案？」，用本機模型＋網站內容（作品、文章、履歷）回答，
  **每個回答附來源連結**，最後一行導到 `/hire`。面試官、客戶最常問的問題直接得到答案。
  知識庫**只放公開頁面的內容**：後台資料、雷達位置、本名都不放，模型就不可能說出來。`/mcp` 也加一個 `ask` 工具。
  要不要記錄訪客問了什麼（只放後台，用來知道大家想知道什麼）🙋 你決定，要記的話頁面上要寫清楚
- [ ] **H2. 「3070 跑本機 AI」實測頁／系列文章** ⭐ 🟧：各個模型、量化版本在這張卡上的 tokens/s、顯存用量、功耗，全部實際量。
  「RTX 3070 跑 ○○ 模型多快」是很多人會搜的問題，這種真實數據別人抄不到，也是 E7「帶搜尋流量」最好的題材
- [ ] **H3. 日文版（A3）先用本機模型翻草稿** ⭐ 🟧：翻譯成本變成 0，只剩找人審。A3 本來卡在「你 N5、翻不了」，這樣就能先動
- [ ] **H4. 台灣人學日文的小工具** 🟥：貼一句日文 → 斷詞、假名、每個字的中文意思，再由模型用中文解釋文法。
  呼應「N5 学習中」，台灣學日文的人很多，是能帶流量的免費工具。斷詞在 CPU 上跑，只有「解釋文法」用到 GPU
- [ ] **H5. 語意搜尋** 🟧：Ctrl+K 跟部落格搜尋加「意思相近」比對（例如搜「網站掛掉」也找得到 watchdog 那篇）。
  文章的向量 build 時算好，查詢時用小型 embedding 模型，GPU 沒開就退回現在的關鍵字比對
- [ ] **H6. 雷達 AI 日報** 🟩：每天由模型寫兩三句「今天收到幾架、最稀有的機型、最忙的時段」放 `/radar`，**不寫位置、涵蓋範圍**
- [ ] **H7. 「這台機器現在在做什麼」** 🟩：`/colophon` 或首頁頁尾顯示 GPU 使用率、溫度、功耗（伺服器端每 30 秒讀 `nvidia-smi`）。
  有種「網站就跑在這張顯卡旁邊」的真實感，也順便記錄功耗，給 E11 架站成本用

*直接賺錢*
- [ ] **H8. 私有 AI 客服 demo（接案用）** 🟧：在 `/hire` 放一個「資料不出你家」的 RAG 客服示範（拿網站自己的內容當範例）。
  賣的是「幫店家架一套」的接案服務，正式系統架在客戶那邊，不是讓客戶長期用你的顯卡
- [ ] **H9. 出租閒置 GPU（Salad、Vast.ai 之類）** 🤔 先評估：
  → 收入要扣掉電費（3070 滿載約 220 W (?)，一天光顯卡就約 5 度）才是真的賺。各平台付多少、Windows 能不能跑、台灣能不能收款都沒查 (?)
  → 風險：在**正式站那台**跑別人的程式（就算有容器隔離），還會吃記憶體、CPU，跟 H1～H7 搶顯卡
  → Claude 的意見：先做 H2 實測拿到真實功耗，再算一週試跑划不划算；做了 H1／H4 的話，顯卡就有自己的用途了

**I. 訪客太少（11/24 使用者：「改善訪客人數低下問題」）**

📍 **11/24 Claude 從 `data/` 診斷**：
- 真人（11/12–11/24）：20 次造訪、11 位新訪客。**外部來源只有 Google 2 次、Gmail 1 次**，其他都是直接打網址。
  11/21～23 的瀏覽有 45 次、新訪客 0，大概是你自己（「不計入」11/23 才上線）
- 爬蟲上週來了 953 次（搜尋引擎）＋513 次（AI），Google 收錄 25 頁、一週曝光 25、點擊 2；Bing 收錄、IndexNow、JSON-LD 都做過了（DONE.md）
- **結論：技術面的 SEO 不是問題，爬蟲都有來。問題是①沒有站外連結、沒人知道這個網站 ②內容是「開發日記」，別人不會去搜這些題目**

*① 站外曝光（影響最大，要你的帳號。Claude 照各平台的語言、格式寫好草稿，你發文）*
- [ ] **I1. 每個作品挑最適合的社群發一次** ⭐ 🙋：
  → Reddit r/selfhosted、r/homelab：「家裡桌機跑正式站＋Cloudflare Tunnel＋自己寫的 watchdog＋公開的事故報告（`/status`）」
  → Reddit r/ADSB、FR24 論壇：`/radar`（不提位置）
  → r/webgpu、r/threejs、X：首頁 WebGPU 粒子，配一段 GIF
  → Hacker News「Show HN」：**只發一次**，挑最有料的（建議：整個自架網站＋公開維運紀錄）
  → 台灣：Threads、前端／Next.js 的 FB 社團、PTT Soft_Job（先看板規）
  → 英文平台要寫英文。每篇都附**真實的數字跟踩過的坑**，不要只貼連結（大部分社群會刪純宣傳文）
- [ ] **I2. iThome 鐵人賽（2027 秋）** 🙋：連寫 30 天，台灣技術圈曝光最大的活動，文章頁會連回你的網站。
  題材現成：「從零開始在家架正式站」（部落格題材庫加上 H2 的本機 AI 實測就夠 30 篇）。報名時間到了再提醒 (?)
- [ ] **I4. 所有個人檔案都放網站連結** ⭐ 🙋：GitHub 個人頁＋3 個 repo 的 About（🙋 第 3 項「GitHub 門面」，**建議往前排**）、
  LinkedIn、104、Cake、FR24 feeder 個人頁。這些就是第一批站外連結；IG 你說過先不放，維持
- [ ] **I11. 登記到個人網站目錄** 🟩 🙋（11/25 新）：現成的頁面直接對得上，各花 5 分鐘、連結長期有效
  → `/uses` → GitHub `wesbos/awesome-uses` 開 PR（Claude 寫好 PR 內容，要你的帳號送）
  → `/now` → nownownow.com 的登記表單
  → 整站 → personalsit.es、ooh.directory（個人網站／部落格目錄）；`/mcp` 的目錄登記見 ⚙️ C12
  📍 **11/25 查過規則**：
  → awesome-uses：fork 後改 `src/data.js`（不是 readme），網址結尾必須是 `/uses`（符合），**插在陣列中間、不要放最後**，
    PR 標題寫名字（如「Adding PINGWEI LI」）；欄位 name／description／url／country／tags，選填 computer: 'windows'、phone
  → nownownow：把 `/now` 網址 email 給站長 Derek Sivers（sive.rs/contact），他回信給連結填資料；只收個人網站、不收公司
  → personalsit.es：GitHub 的 issue 表單送（不用 fork），欄位 title／url／tags（＋選填 feed 放 `/feed.xml`）；
    **站長明說會關掉一看就是 AI 寫的送件** → 這個要你自己填，Claude 不代寫
  → ooh.directory：頁面擋自動抓取，規則沒讀到 (?)，你用瀏覽器開 ooh.directory/suggest 看
- [ ] **I12. 技術聚會／研討會講一次** 🙋（11/25 新）：講者頁、議程、投影片都會連回網站，聽眾也是最對的人
  → 高雄的 MOPCON、台北的 COSCUP／JSDC；福岡也有前端、Python 的聚會 (?)
  → 題目現成：「在家用一台桌機跑正式站一年」（跟 I1 的 Show HN 同一份素材）
  → 各場的徵稿時間沒查 (?)，Claude 可以先查好列進來，投稿要你決定
- [ ] **I13. 在別人的討論串回答問題，順便附相關文章** 🙋（11/25 新）：Reddit、Threads、PTT 有人問 Cloudflare Tunnel、
  自架、YOLO 部署時，先把問題答完、最後才附文章連結（帶 I9 的 `?ref=`）。比 I1 的發文細水長流，也比較不會被當廣告刪

*② 內容改成別人會搜的（Claude 可以做）*
- [ ] **I5 回頭看（12/9 左右）**：11/25 已經把 8 篇文章、/airports、/radar 的 `<title>` 改成照搜尋字寫（畫面標題不動），
  兩週後看週報的「曝光最多的頁面／搜尋字詞」有沒有變多；有曝光沒點擊的再改。搜尋字詞太少時 Google 會隱藏，資料多了才準
- [ ] **I6. 寫文章前先確認有沒有人搜** 🟧：E7（教學文）、H2（3070 實測）的題目先看 Google 自動完成／Search Console 有沒有人搜，再動筆。
  目標兩週一篇；開發日記型的文章照寫，但不要期待它帶流量
- [ ] **I7. 工具型頁面** 🟥：小港機場時刻表已經有了，再加 E6 日幣匯率比價、H4 日文句子解析——
  工具會**每天被重複使用**，也比較容易被人分享、加書籤 → **展開成下面的 J 系列**

*③ 讓來過的人再回來*：I8 已做完（見 DONE.md）

*④ 量測（知道哪個管道真的有用）*：I10 已做完（週報「外部來源」，見 DONE.md）；**12/22 左右回頭看哪個管道值得繼續**

**J. 工具型頁面（11/24 使用者：「做更多工具型頁面，幫我拓展想法」）**

挑選標準：**用得到現成的資料或程式**、**有人會搜**（有沒有人搜都還沒驗證，做之前照 I6 先查）、**符合你的定位**（台日、航空、自架、AI、日文）。

*共同規則*
- 能在瀏覽器算的就在瀏覽器算（輸入不離開訪客的電腦、伺服器零成本）；需要外部資料的照 D 系列：伺服器端抓、快取、失敗就不顯示
- 結果放進網址參數（例：`/jpy?twd=30000`），**複製網址就能分享結果**；不用登入、不存訪客的輸入
- 新增一個 `/tools` 總覽頁；`site-map.ts` 加一組「道具 · Tools」（頁尾、Ctrl+K 都找得到）；照慣例包 `PageShell`、加 canonical、sitemap、Markdown 版
- 標題用大家實際搜的字（I5），「PINGWEI LI」照舊留在標題
- 每個工具最下面一行「這個工具怎麼做的 → 對應的作品／文章」：**工具帶流量、作品集接住流量**（再往下導到 `/hire`）
- 要抓訪客輸入的網址的工具（J12）要防 SSRF：只能 https、擋內網 IP、逾時、大小上限、次數限制

*台日・旅行（最符合定位）*：J1、J2、J4、J5、J6 已上線（`/tools`，見 DONE.md）；J3 延誤統計 11/25 開始存資料，滿 7 天自動出現在 /airports

*日文學習（呼應「N5 学習中」）*
- [ ] **J8. N5 漢字每日卡片＋小測驗** 🟧：D7 的延伸，進度存在 localStorage（不用帳號）
- [ ] **J9. 日文句子解析**：就是 H4（斷詞、假名、中文意思，GPU 解釋文法）

*AI・GPU（接 H 系列）*

*開發者工具（你實際踩過的坑做成工具）*：J12、J13 已上線
- [ ] **J16. CSP 標頭解讀** 🟧：貼上 CSP → 逐條解釋、標出 `unsafe-inline` 這類風險、給修改建議。你從 report-only 一路調到正式開，經驗都在 kbs-integrations

*做的順序建議*：**J1 → J2 → J7 → J10＋H2 → J14 → J11**。J1、J2 資料現成，半天就能做完；J7、J10、J14 是「別人沒做過、又有人會搜」的類型。

**K. 監控面板（11/24 使用者：「可以來計算我的 Tesla 耗能之類的？一些監控面板，可行嗎？」）**

結論：**可行**，但**隱私要比雷達更嚴格**——車子的位置等於家、公司、作息，「車子現在停著／在開」等於「你現在在不在家」。

*K1. Tesla 耗能 ⭐ 🟥 🙋*
- **資料怎麼拿**（11/24 查的，細節做之前要再確認）：
  → **TeslaMate**（開源、自架）：Docker 跑 Postgres＋Grafana，記錄每一趟行程、每一次充電。資料全部留在家裡的桌機，32 GB 記憶體綽綽有餘。
    TeslaMate 文件說個人帳號目前還能用舊的 Owner API；官方的 Fleet API 要自己申請開發者 app，而且解析度比較低。舊 API 什麼時候關沒有明確日期 (?)
  → **Tesla Fleet API**（官方）：2025 年起按用量收費，個人每月有 US$10 的抵免額，大約夠兩台車每天串流資料、100 個指令、喚醒兩次。超過或沒綁付款方式 app 會被停用
  → 付費第三方（Tessie、Teslemetry）：最省事，但每月要錢，資料也要經過別人的伺服器
  → **Claude 推薦 TeslaMate**：資料不出家門，跟網站的隱私原則一致
- 🙋 **要你做**：裝 Docker Desktop（要管理員權限）、用你的 Tesla 帳號登入 TeslaMate；告訴 Claude 車型／年份（文章、頁面要寫）
- **公開頁 `/ev`（只放統計，不放任何能推出位置跟作息的東西）**：
  → ✅ 可以放：每公里平均耗電（Wh/km）、**耗電 vs 氣溫**（高雄夏天開冷氣差多少）、每月用電度數跟電費、家充／超充比例、電池健康度隨時間的變化、每月里程（取整數）
  → ❌ 絕對不放：地圖、地址、充電站名稱、每趟行程的時間、**現在的狀態**（在開／停著／充電中）、車牌、VIN
  → 只放**月統計**，而且**晚一週以上才更新**，看不出「這幾天不在家」
- **完整資料放後台**（G1）：TeslaMate 的 Grafana 開在子網域（例如 `teslamate.kbs0830.com`），**一定要用 Cloudflare Access 擋住**——TeslaMate 本身沒有登入功能，直接開出去等於公開你的行車軌跡
- **能帶流量**：「Model ○ 在台灣實際耗電多少」「電池開 N 年剩多少」是想買車的人會搜的，**真實的長期數據別人抄不到**（跟 H2、J3 一樣是獨家資料）。
  `/ev` 加一個「用我的數據算電費」的小工具（輸入每月里程、電價 → 跟油車比較），就同時是 J 系列的工具頁

*K2. 家裡用電（順便解決電費數字一直沒有的問題）⭐ 🟩 🙋*
- 🙋 買一個能讀用電量、**有本地 API** 的智慧插座（例如 Shelly Plug，或 TP-Link Tapo P110 這類；買之前確認能在區網直接讀、不用經過雲端 (?)），插在桌機上
- 伺服器每分鐘讀一次 → 真正的整台電腦功耗（`nvidia-smi` 只看得到顯卡）→ 直接填進 E11 架站成本、J11 電費計算機、H9 出租 GPU 划不划算
- 公開頁只放「網站一年的電費大約多少」；用電的時間曲線放後台（半夜突然變高也會透露作息）

*K3. 生活儀表板 `/now` 2.0* 🟧：把各種「本月」數字放在一起——寫了幾小時 code（D8）、收到幾架飛機（雷達）、開了幾公里電動車（K1）、
聽了幾首歌（D9）、GitHub 貢獻（D1）、網站可用率。全部是**月統計**，每一項讀不到就隱藏。
這種「把自己的生活量化」的頁面很有個人特色，也很適合拿去社群分享（I1）

*共同規則*
- 公開頁用網站自己的設計系統畫，**不嵌 Grafana**（iframe／第三方 script，也跟設計不搭）；Grafana 只在後台用
- 所有「即時狀態」只進後台；公開的一律是延遲過的統計
- 控制類的功能（開空調、解鎖車門）**完全不做**，連後台都不做——API token 只申請讀取權限

**L. 進階視覺：Shader 特效（11/25 使用者：「網頁設計與前端開始大量導入如 Paper Shaders、WebGL 著色器特效等高階視覺庫，打破傳統平面框架」）**

*先講衝突*：設計原則是「間・引き算・動畫克制・唯一強調色」，而且 11/05 使用者試過全站特效後說「**只留頁首**」（CLAUDE.md 記著，不能自己加回其他區塊）。
所以這區**每一項都先做一個樣品**（3200 截圖／錄影給你看），你點頭才上線、才往下一項；原則上選「靜態或很慢、跟紙感有關」的效果，不做爆炸、霓虹那種

*工具*
- **Paper Shaders**（`@paper-design/shaders-react`，11/25 查 npm）：Apache-2.0、零依賴、支援 React 19、壓縮後整包約 220 KB（用到哪個載哪個）。
  31 種效果，跟這個網站搭的：`paper-texture`（紙張質感）、`grain-gradient`（顆粒漸層）、`halftone-dots`／`image-dithering`（網點、抖色）、
  `dot-grid`、`static-mesh-gradient`、`waves`、`god-rays`。⚠️ 版本還是 0.0.82（還沒 1.0、11/24 還在更新），API 可能會變，要鎖版本
- **自己寫**：首頁已經有 three.js＋WebGPU（TSL），簡單的效果用 `ShaderMaterial` 自己寫就好，不用多一個套件

*共同規則*
- 新套件**不能在桌機手動安裝**（會動到線上的 node_modules）：在 A14 加進 package.json＋lockfile、push，部署時 `deploy.ps1` 自己裝
- 一頁最多一個 WebGL 畫布（首頁已經有 Hero；瀏覽器同時能開的 WebGL 數量有限，手機更少）；不在畫面裡就停、分頁在背景就停
- 開了「減少動態」或不支援 WebGL：顯示一張靜態圖，不是空白
- 只放在 client island、用 `dynamic import`，不能拖慢首屏（LCP）；淺色、深色都要配色，強調色照舊只用靛藍
- 驗收：桌機＋A14 都要 60fps、Lighthouse 不退步、E2E（含 a11y）全過、390px 截圖

*點子*（⭐＝Claude 推薦先做）
- [ ] **L1. 紙感底紋** ⭐ 🟩：設計 token 的 Surface `#f0ede8` 本來就叫「紙感」，換成 `paper-texture`／`grain-gradient` 畫出來的**靜態**紙紋
  （畫一幀就停，零動畫成本），深色模式換成墨色紙。最符合現有風格、風險最低
- [ ] **L2. 作品縮圖網點化** 🟧：作品卡片平常是 `halftone-dots`（報紙網點感），桌機滑鼠移上去慢慢變回原圖；手機維持靜態網點。
  ⚠️ 這算「頁首以外的滑鼠特效」，要你先看樣品決定
- [ ] **L3. 雷達圓盤用 shader 畫** 🟧：`/radar` 的裝飾圓盤改成真的掃描線＋殘影，收到幾架就亮幾個點（不畫位置，照雷達隱私規則）
- [ ] **L4. 404／維修頁玩大一點** 🟩：`waves`／`warp` 慢速流動，主要頁面不受影響，可以當試驗場
- [ ] **L5. 手機版首頁背景** 🟧：現在是 Canvas 2D 精簡版，可以試 `dot-grid`／`static-mesh-gradient`（很便宜），但手機封面 11/24 才重做過，要你看過再換

## ⏳ 等別人更新

- [ ] **TypeScript 7**：typescript-eslint 還不支援（11/22 查：最新 8.73.0，peer 仍是 `<6.1.0`），支援了再升
- [ ] **`THREE.Clock` deprecation warning**：來自 R3F 內部，等 R3F 改用 `THREE.Timer`（11/22 查：R3F 最新仍是 9.8.2，跟裝的一樣；
  WebGPU 版是直接用 three，沒有這個 warning）

## 評估過、先不做（記下理由免得重查）

- **I3. 文章轉貼到 dev.to／Zenn／Qiita 等平台**（2026-11-25 使用者：「轉貼到這些平台不就是發廣告，我的原則就是不要濫發宣傳會有反效果」）：
  不做。站外曝光只做「對方本來就想要的」：個人檔案放連結（I4）、主動登記的目錄（I11）、別人問了才回答（I13，要先問過你）。
  11/25 查過的平台規則留著備查：dev.to 有 `canonical_url`；Zenn、Qiita 找不到 canonical 設定

- **搞錢方面的不做清單**（2026-11-24）：廣告、業配、雷達資料收費、付費 AI API、付費牆鎖現有內容、嵌入付款 widget（出租 GPU 11/24 改成評估中，見 H9）——
  理由寫在 [make-money.md](make-money.md)「不做」那一節

- **拿掉 `HeroScene.tsx` 剩下的 3 個 `useMemo`**（2026-11-09 評估）：這 3 個不是效能優化，是「整個元件生命週期只建一次」的
  three.js 物件（線條、粒子 geometry），後面有 `dispose()` 清理、`useFrame` 每幀改它們。React Compiler 的自動快取只是優化、
  不保證不重建；拿掉的話萬一被重建，就是 GPU 記憶體漏掉＋畫面閃一下。React 保證只建一次的寫法是 `useState(() => …)`，
  但跟現在一樣能用、沒有好處，不值得冒險改 3D 場景

- **Noto Serif JP 字體子集化**：Google Fonts 已經自動切成 374 塊、只下載用到的字；自己用 `text=` 子集化的話，
  之後作品標題用到清單外的字會悄悄變成別的字體，風險大於好處
