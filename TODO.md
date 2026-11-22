# TODO — kbs0830_web

這裡**只放還沒做的**；做完的搬到 [DONE.md](DONE.md)（2026-11-09 拆開）。
做完任何一項跟 Claude 說，它會回查、從這裡刪掉、記進 DONE.md。

📬 有日期的項目會自動寄提醒信到 otemon（`reminders.json`）：12/09 CSP 回查、
2026 年底 GHA 鈦金、2027/05/16 網域續約、2027/08/31 年級更新、2027 年底 IHG 酒廊、2028 年底華航金卡。

---

## 🙋 你要動手的（要你的帳號或管理員權限，Claude 做不到）

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
- [ ] **雷達要不要列出頭上這幾班**（航班代碼＋高度，不放位置）：CLAUDE.md 記著「問過還沒選」。選了 Claude 才做；不要就劃掉
- [ ] **FoodLens 截圖**：課程専題 11/09 全部有截圖了，個人專案只剩 FoodLens 沒有。它的網頁版只是「測試 BFF 連線」的空殼、
  真正的 App 是 Android，後端也沒有 Gemini 金鑰——要你手機截一張分析結果（不要有真人臉），或給 Claude 金鑰＋一張食物照片
- [ ] **均線回測程式的 bug 要不要修**（改的是 school repo，網站目前不放報酬數字）：沒持股時跌破 MA60 也記一筆 0 張賣出、
  賣出時手續費／證交稅用加的（應該扣）、沒檢查本金夠不夠（聯發科一張就超過 100 萬，跑完資金變負）。修完網站可以補報酬率
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

**⭐ Claude 推薦的**

1. **FoodLens 線上試玩**（A1）：作品集最強的證明是「直接能玩」，而且剛好證明 FoodLens 的賣點「影像不離開裝置」
2. **停電也不斷線**（A2）：10/29 斷 4 天、11/06 停電，都會變成訪客沒感覺
3. **每月自動故障演練**（C1）：故意把網站停掉，確認 watchdog 真的救得回來，跟每季的備份還原演練同一個思路
4. **首頁版本統計**（B13 🟩）：C11 補上了 CI 的測試，但上線後還是不知道訪客實際拿到哪一版、別人電腦上會不會亂退回

（11/22 補了 B13～B16、C11、C12；C11 當天做完）

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

- [ ] **B2. 終端機加指令** 🟩：`neofetch`（真實硬體規格）、`uptime`、`blog`、`status`、`history`、Tab 自動補完；
  11/22 加：`hero name`／`hero routes`／`hero icon` 直接叫 WebGPU 版排形狀、`hero gl` 換 WebGL 版比較
- [ ] **B3. 頁尾二十四節氣** 🟩：時鐘旁邊加小字「立冬」，瀏覽器端算
- [ ] **B4. 「いま N 人」** 🟧：頁尾顯示現在正在看網站的人數（每頁每 30 秒報一次、只記數字），分頁在背景時不報
- [ ] **B8. `/.well-known/security.txt`** 🟩：現在是 404。RFC 9116 標準檔，寫聯絡方式（用 otemon 還是 1394kbs 要你決定）
- [ ] **B9. 作品頁改成案例格式** 🟧：每個作品固定「問題 → 我的決定 → 取捨 → 結果」四段，面試官最想看「為什麼這樣做」。
  只用 repo 裡真的有的資訊，沒有的段落就不寫
- [ ] **B10. 文章離線閱讀** 🟧：Service Worker 快取讀過的文章，沒網路也打得開（PWA manifest 已經有了）
- [ ] **B11. 列印版文章** 🟩：履歷已經有列印樣式，文章也排一份（程式碼不截斷、連結印出網址）
- [ ] **B13. 首頁版本統計** 🟩（11/22 新）：訪客實際拿到哪一版（WebGPU／WebGL／手機版）、WebGPU 版最後穩定在幾顆粒子、
  退回 WebGL 的原因（太慢／沒顯卡／丟錯）→ 只存分類次數，放 /stats。現在不知道真的有多少人玩到 WebGPU 版，也不知道退回機制在別人電腦上有沒有亂退
- [ ] **B14. WebGPU 版的雙擊形狀加一個「高雄 ⇄ 福岡」** 🟩：兩個城市點＋中間一條航線，呼應首頁的兩地時鐘（目前形狀：名字、航線圖、網站圖示）
- [ ] **B15. 可用率徽章** 🟩（11/22 新）：`/status` 已經有 90 天可用率，輸出一個 shields 風格的 SVG（例「uptime 99.8%」），
  給 GitHub README／profile README 用，正好接「GitHub 門面」那項。只給數字、不給 log
- [ ] **B16. `/uses` 補上這陣子新增的** 🟩：ADS-B 接收器（樹莓派＋SDR，**不寫位置跟雷達代碼**）、WebGPU／TSL、Playwright、Vitest、Renovate——
  都是已經在用的，/uses 從 7 月沒更新

**D. 接外部 API（11/22 使用者：「API 抓什麼數據來玩」）**

共同做法照 Cloudflare 流量那套：**伺服器端抓、存本機快取、失敗就不顯示**——訪客的瀏覽器不連第三方（不用改 CSP、不把訪客 IP 給別人），API 掛了網站照常。

- [ ] **D1. 自己畫 GitHub 貢獻熱力圖** ⭐ 🟧 🙋：現在用的 ghchart 是別人的服務、白底圖片，深色模式是一塊白卡（CLAUDE.md 記著的「已知取捨」）。
  改用 GitHub GraphQL 抓貢獻數，自己畫 SVG，跟著主題變色、hover 看當天幾次。🙋 要一組 fine-grained PAT（只要讀公開資料）
📍 **11/22 使用者：「做 D2、D3、D4、D5、D6（順便做小港／福岡機場的即時時刻表）」**——D2～D5 當天做完；D6（＋機場即時時刻表）進行中

- [ ] **D6. 小港 → 福岡下一班** 🟧 🙋：交通部 TDX 抓小港機場航班，首頁或 /flights 顯示「下一班飛福岡：○○ 14:05」，呼應高雄 ⇄ 福岡。
  🙋 要註冊 TDX（免費）。只顯示機場公開的航班表，跟你住哪裡無關
- [ ] **D7. 今日の漢字** 🟩：kanjiapi.dev（免費）每天一個 N5 漢字（讀音、意思），放 /now 或終端機 `kanji` 指令，呼應「N5 学習中」
- [ ] **D8. 這週寫了幾小時 code** 🟧 🙋：WakaTime 的程式時數＋語言比例放 /now 或 /stats（「主角還是 code」）。🙋 要裝 WakaTime 外掛、給 API key
- [ ] **D9. Spotify 本月最常聽** 🟩 🙋：現在只有「正在聽」。要多一個 `user-top-read` 權限，得重跑一次 `spotify-get-refresh-token.js` 授權

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
- [ ] **C12. MCP 伺服器登記到公開目錄** 🟩 🙋（11/22 新）：`/mcp` 做好了但沒人知道。可以登記到官方 MCP Registry 之類的目錄，
  要用你的 GitHub 帳號驗證、會公開出現在別人的網站上，所以要你決定要不要
- [ ] **C10. 筆電當第二台主機** 🟥：Cloudflare Tunnel 可以同時接兩個來源。筆電開著時自動分擔、桌機掛了接手。
  但筆電不是一直開著，**A2 比較實際**，這個當備案

## ⏳ 等別人更新

- [ ] **TypeScript 7**：typescript-eslint 還不支援（11/22 查：最新 8.73.0，peer 仍是 `<6.1.0`），支援了再升
- [ ] **`THREE.Clock` deprecation warning**：來自 R3F 內部，等 R3F 改用 `THREE.Timer`（11/22 查：R3F 最新仍是 9.8.2，跟裝的一樣；
  WebGPU 版是直接用 three，沒有這個 warning）

## 評估過、先不做（記下理由免得重查）

- **拿掉 `HeroScene.tsx` 剩下的 3 個 `useMemo`**（2026-11-09 評估）：這 3 個不是效能優化，是「整個元件生命週期只建一次」的
  three.js 物件（線條、粒子 geometry），後面有 `dispose()` 清理、`useFrame` 每幀改它們。React Compiler 的自動快取只是優化、
  不保證不重建；拿掉的話萬一被重建，就是 GPU 記憶體漏掉＋畫面閃一下。React 保證只建一次的寫法是 `useState(() => …)`，
  但跟現在一樣能用、沒有好處，不值得冒險改 3D 場景

- **Noto Serif JP 字體子集化**：Google Fonts 已經自動切成 374 塊、只下載用到的字；自己用 `text=` 子集化的話，
  之後作品標題用到清單外的字會悄悄變成別的字體，風險大於好處
