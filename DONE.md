# DONE — kbs0830_web 已完成紀錄

做完的事都在這裡（新的在上面）。還沒做、要你決定的在 [TODO.md](TODO.md)。
2026-11-09 從 TODO.md 拆出來；舊段落裡的「等你 review」「還沒做」是當時的狀態，沒做完的已經搬到 TODO.md。

---

### 2026-11-25 拿掉訂閱入口、手機作品集精選、「完成」對齊（使用者：「我沒有要做訂閱功能」「FR24 雷達站跟個人網站精選，剩下的照課程專題」「藍底的完成飄掉了」）
- [x] 文章底部「想收到新文章？RSS 訂閱」、/blog 的「RSS 訂閱 · Feed」拿掉；/feed.xml 只留在 <head> 給搜尋引擎／AI
- [x] 手機版個人専案只露出 FR24 雷達站、個人網站兩個，其他 4 個收進「顯示全部 6 個」（跟課程専題同格式）；作品集手機高度 1953 → 1303px，桌機不變
- [x] 手機卡片的狀態標籤改成跟標題文字基線對齊（原本 items-start＋mt-0.5 偏下）

### 2026-11-25 Cache Components（TODO C13，使用者：「開始手搓 C13」）
- [x] `next.config.ts` 開 `cacheComponents`＋`partialPrefetching`；35 個路由的 `dynamic`／`dynamicParams` 拿掉
- [x] 8 個即時頁（/radar、/airports、/stats、/status、/colophon、/reports、/tools/fukuoka-weather、/tools/taiwan-fukuoka）改成
  「build 時畫好的頁首外殼＋串流補進來的內容」（共用 `components/ui/LoadingBlock.tsx`；/airports 連資料來源那段也在外殼裡）
- [x] 6 支同步讀檔的 API（radar、badge/uptime、visitor-stats、web-vitals、csp-report、presence）加 `await connection()`；
  實測改雷達測試檔後 /api/radar 跟 /radar 頁的數字跟著變（382 → 1,382），沒有被凍結
- [x] 分享圖原本會因為抓 Google 字型變成每次即時畫：字型改 `"use cache"`（失敗丟例外不快取），全部回到 build 時畫好；security.txt 改 `"use cache"`＋`cacheLife("days")`
- [x] 不存在的文章／作品／標籤一開始變成回 200（外殼先串流）：三個動態路由加 Next 16.4 的 `ensureStatic = "navigation"`，回到真的 404，
  也保證這幾頁以後不會被加進即時資料
- [x] 匯率等 4 個外部資料刻意留在自己的 live-cache（掛掉時給上次的資料）
- [x] 快取標頭跟以前一樣（靜態頁 s-maxage、即時頁 no-store）；單元測試 210、E2E 129 全過；手機 /status、桌機 /airports 截圖確認

### 2026-11-25 專案分類整理＋新寫法（使用者：「整個專案好好的做分類，讓 AI 更好找，冗長的刪掉，能用新寫法新技術就用」）
- [x] `src/lib` 47 支平鋪 → `site／content／stats／ops／travel／live／api／tools／client` 九類；`components/ui` 51 支 → `layout／ui／live／content／stats／fun`
  （105 個檔案用 `git mv` 搬，歷史還在；182 個檔案的 import、註解、文件路徑一起改；import 一律 `@/`）。`scripts/` 沒動（排程工作用絕對路徑）
- [x] CLAUDE.md 加「找檔案：目錄地圖」；kbs-site 技能的目錄樹整個重寫（原本已經過時，lib 只列 7 支）
- [x] 刪冗長：`lib/format.ts` 取代 14 份 `NumberFormat`、各自的月/日與時:分；`lib/site/page-title.ts` 取代 /stats 手寫的頁名表（順便補上 7 個工具頁）；
  50 個只有自己檔案在用的 export 收回來
- [x] 新寫法：Node 內建模組全面 `node:` 前綴（36 處）、`.at(-1)`／`.toSorted()`、背景更新改用 Next 的 `after()`、
  讀檔／抓外部 API 的模組加 `import "server-only"`（不小心被 client import 會在 build 時擋下）
- [x] 單元測試 210、E2E 129 全過；22 條路由實際打過

### 2026-11-25 Google 搜尋優化（使用者：「Google 怎麼更好搜尋到我」「你直接做」）
- [x] 查 Search Console：45 頁只收錄 26 頁、16 頁 Google 不知道（sitemap 11/21 之後沒回來讀，那時只有 29 個網址）；「pingwei li」已搜得到、「李秉威」0 曝光
- [x] 重新提交 sitemap（服務帳號本來就是「完整」權限），並接進 deploy.ps1：內容有變就自動重新提交（`search-console.js --submit-sitemap`，寫入權限只用在這裡）
- [x] **I5**：文章加 `seoTitle`（只給 `<title>`，畫面標題、分享卡片不變），8 篇都改成照搜尋字寫（例：「Next.js 15 params 變成 Promise：動態路由 build 成功卻全部 404」）；/airports、/radar 標題同理

### 2026-11-25 日報／週報／月報（使用者：「要詳細的日報週報月報，在網站裡面，之後再挪到私人的管理者裡；週報月報寄信，日報顯示在網站就好」）
- [x] **網頁 `/reports`**：日報（預設今天）／週報（週一～週日）／月報（日曆月）切換、前後一期；每一項跟前一期比（還沒過完的一期取同樣天數比）。
  內容：真人訪客（每日／每小時圖、熱門頁、外部來源分類＋直接進入、來源網域、國家、裝置／瀏覽器／系統）、Cloudflare（含快取命中率）、
  到達主機的請求＋爬蟲、404、首頁 3D 版本、Web Vitals、維運（可用率、部署、watchdog、抖動、開機、磁碟）、自家雷達、小港延誤、網站更新＋新文章。
  暫時公開但 noindex、不進 sitemap、導覽沒連結；Search Console 搜尋字詞只進信（等後台 G1 再搬）
- [x] **寄信**（`scripts/report-mail.ps1`，取代 weekly-report.ps1）：週報週一 09:00 後寄上一週、月報 1 號 09:00 後寄上個月，內容從本機 `/api/reports?format=text` 拿（跟網頁同一份），再補 Search Console
- [x] 為了能算「某一天／某一週」的分類，訪客明細、未過濾流量、首頁版本統計 11/25 起多存逐日資料（留 120 天）；之前的日子只有總數，報表會標「幾號起才有」
- [x] 單元測試 200 個、E2E 129 個全過；手機 390（深淺色）、桌機 1280 截圖確認

### 2026-11-25 手機封面創意版＋TODO 一口氣清（使用者：「todo 裡叫你做的都做一做」「手機介面有點創意，1+2 先做」）
- [x] 手機封面（640px 以下，桌機不動）：片假名「リー ビンウェイ」改成**直書**貼在右側；按鈕上方加**高雄 ⇄ 福岡兩地時鐘**（15 秒更新，伺服器先顯示 --:--）
- [x] **雷達「現在收到的航班」**（`/radar`）：只列航班代碼、航空公司、機型、高度（四捨五入到千呎），不放位置、不放 hex；公開 API `/api/radar` 不含這份
- [x] **J3 小港機場延誤統計**：伺服器每 20 分鐘記一次小港看板（`src/instrumentation.ts` → `lib/airport-delay-recorder.ts`，`data/airport-delays.json`，留 120 天）。
  滿 7 天才在 `/airports` 顯示準點率（15 分鐘內）、取消班次、最常延誤的航班（至少 5 次才排）
- [x] **B14 WebGPU 版加「高雄 ⇄ 福岡」形狀**：兩個城市點＋光圈＋弧線航線＋地名（`?hero=webgpu` 雙擊切換）
- [x] **B13 首頁版本統計**：每個分頁回報一次拿到哪一版（手機精簡／WebGL 線條／WebGPU 粒子）、WebGPU 退回原因分類，只存次數，`/stats` 新區塊。
  過濾跟訪客統計一樣（沒經過 Cloudflare、機器人、本人都不記）。「WebGPU 最後穩定幾顆粒子」沒做：WebGPU 版預設關著，幾乎沒人會用到
- [x] **C2 開機通知信**（`scripts/boot-notice.ps1`，watchdog 每輪呼叫）：停了多久（開機前最後一筆 uptime.log）、怎麼停的（事件記錄 1074／6006／41／6008：手動重開、Windows Update、停電或當機、關機卡住）。拿 11/23 兩次開機實測判斷正確
- [x] **C3 404 統計**（`scripts/lib/not-found.js`，server.js 記）：只存「日期 → 路徑 → 次數」，掃描器（.php、.env、wp-…）只算總數；週報列前 10 名
- [x] **C5 週報**：Cloudflare 快取命中率（GraphQL 多抓 `cachedRequests`）、外網抖動（失敗一次下一輪就好）次數、C:／D: 剩餘空間（不到 10% 標 ⚠️）
- [x] **I10 週報外部來源**：搜尋／社群／AI／信件／GitHub／活動連結／直接進入分開算（跟上週快照相減，第一封只列累計）
- [x] 均線回測三個 bug 修好、school repo 本機 commit（push 要使用者，見 TODO）
- [x] 單元測試 187 個、E2E 122 個全過；手機 390／360（深淺色）、桌機 1280 截圖確認

### 2026-11-25 封面名字改回一行＋片假名讀音、桌機全部回原樣、修手機版被撐寬
- [x] 手機封面名字一行（字級跟螢幕寬度走，14vw、最大 4rem）、下面小字「リー ビンウェイ」（使用者：不喜歡斷行、要加片假名）
- [x] 使用者：「桌機版不用改，只要手機版特調」——前幾輪連帶改到桌機的全部改回：封面、分頁（英文在上）、作品集區塊標題、作品卡片／詳細頁的標題順序、課程卡片的狀態、子頁面右下角 ↑、頁尾時鐘的「・」、640–768px 的間距跟文章數。只有 F3（子頁面頁尾對齊）留著
- [x] 修手機版比螢幕寬：360px 首頁被作品卡片不換行的「英文 · 日文」撐到 401px（固定的導覽列跟著變寬、選單按鈕被擠出畫面，正式站已經有這問題）；文章頁一段長程式碼也超出。25 頁 × 360／390px 實測都不再超出，E2E 加 5 頁 360px 檢查
- [x] E2E 122 個全過；桌機 1280 截圖確認跟原本一樣

### 2026-11-24 手機版封面（使用者：「封面專門為手機版改良，畢竟第一印象」）
- [x] 640px 以下才套用，桌機不動：名字放大成兩行（PINGWEI / LI，64px；h1 維持單一 text node，用 w-min 讓它在空格換行）、文字區塊在導覽列跟按鈕之間垂直置中、名字跟標語之間一條短強調色細線
- [x] 按鈕移到螢幕下方拇指範圍：兩顆並排 48px 高（「查看作品」實心強調色、「聯絡我」外框）；手機拿掉「SCROLL」提示
- [x] 標語平均分兩行。順手修：全站 `h1–h3 { balance }`、`p { pretty }` 原本沒包 layer，會壓過所有 Tailwind utility（加 text-balance 沒作用），移進 `@layer base`
- [x] 按鈕對比：淺色 6.78:1、深色 6.11:1；E2E 新增「a11y 手機」首頁掃描（深淺色，含選單打開），共 117 個全過；360×640 小螢幕也放得下

### 2026-11-24 手機版間距整理（使用者：「很多很詭異的間距、手機版有點跑掉、頁底好雜亂」）
- [x] 從頭到尾截一次手機全頁找問題，逐一修：
  → 自己紹介：標題的全形空白換掉；分頁改「中文大字、英文小字」，手機只顯示中文（英文留在可及名稱），四個分頁一次放得下（之前超出畫面切掉 FOOTPRINT）
  → 作品集：區塊標題中文在前、手機只放中文（之前「· 課程専題」掉到第二行）；課程專題卡片不再重複「課程専題」標籤、手機不放 GitHub 小圖示（標題不再被擠成兩行）；手機底部留白縮小
  → 最新文章：標題手機縮一級、不換行（之前「最新文章 ·」懸在行尾）
  → 頁尾即時資訊：每一項一行、同樣的字距；高雄／福岡各一行（不再有懸在行尾的「・」）；國碼、Cloudflare 完整數字只在桌機，手機放精簡版；分隔線拉滿，只有版權兩行讓位給右下角按鈕
  → 文章底部：有「系列下一篇」時，上一篇／下一篇的上方留白縮小
- [x] 手機、桌機都截圖確認；E2E 115 個全過

### 2026-11-24 手機版第三輪：全站目錄收進右上角選單、只顯示重點（使用者：「多利用右上角選單做收納，重點顯示，剩下收起來」）
- [x] 右上角選單＝全站目錄（`SiteIndex`）：首頁抽屜（三個錨點改成一行＋三組頁面）、子頁面新增 `PageMenu`（面板疊在內容上，不推內容）；子頁面手機的「搜尋 Ctrl K」改成放大鏡圖示
- [x] 手機頁尾不列頁面：子頁面 451 → 101px（只剩版權、最後更新）、首頁 264px（即時資訊＋版權）；桌機頁尾照舊三欄
- [x] 「↓ 到頁尾」拿掉（目錄收進選單後不必捲到底，右下角也少一顆擋內容的按鈕）
- [x] 課程專題手機先顯示 2 個＋「顯示全部」，最新文章手機 2 篇
- [x] 首頁手機 9.2 → 7.3 個螢幕（一開始 14.6）；E2E 115 個全過（新增：課程展開、首頁選單有全站目錄、子頁面選單換頁）

### 2026-11-24 手機版第二輪：作品標題中→英→日、頁尾重新設計（使用者：「一行中文一行日文有點浪費」「頁尾排版要再想想，手機 UI 很重要」）
- [x] 作品卡片、作品詳細頁的標題順序改成「中文大字（＋狀態）→ 英文 · 日文」：英日併一行、固定不換行（太長截掉日文尾巴）；之前是日文小標在最上面
- [x] 頁尾手機版：頁面索引每組「小標＋連結橫排自動換行」（點擊高度約 40px），不再一個連結一行；首頁即時資訊（時鐘、人數、造訪、Cloudflare）自成一塊放在版權上面，每個城市整組不拆行；桌機維持三欄
- [x] **F3** 子頁面頁尾跟內文對齊（`SiteFooter` 的 `inset`：首頁 inner、子頁面 outer；/blog 實測兩邊都是 x=304）
- [x] 頁尾高度（手機）：子頁面約 600 → 451px；3200 實測 E2E 113 個全過，桌機截圖確認沒走樣

### 2026-11-24 B15 可用率徽章、I9 發文標記 ?ref=
- [x] **B15** `/api/badge/uptime`：shields 風格 SVG「uptime 90d 99.xx%」，資料跟 /status 同一份；低於 99% 換 --warn 色。README 用 `![uptime](https://kbs0830.com/api/badge/uptime)`
- [x] **I9** 網址帶 `?ref=reddit-selfhosted` 進站 → 訪客統計的來源記成 `ref:reddit-selfhosted`（只收小寫英數跟 -），記完從網址拿掉（其他參數保留），不用 cookie
- [x] 單元 `badge.test.ts`、`visit-detail.test.ts` 補案例；E2E 113 個全過

### 2026-11-24 手機版：首頁從 14.6 個螢幕縮到 9.2 個（使用者：「手機每次要滑到最底下都很久，要考量使用者」）
- [x] 量了手機（390px）各頁長度：首頁 12,298px＝14.6 個螢幕，其中作品集一區 7,557px（15 張卡片、每張整張寬的截圖＋全文＋全部 tag）
- [x] 作品卡片手機精簡版：左邊 80px 縮圖＋標題、兩行說明、前 3 個 tag；英文說明、英文副標、成果、「查看詳情」只在 640px 以上顯示（整張卡片本來就是連結）。作品集 7,557 → 3,097px，**桌機完全沒變**
- [x] 右下角多一顆「↓ 到頁尾」（只在手機、頁面超過 2.5 個螢幕、離底部還遠時出現），跟「↑ 回頂端」各有固定位置、只淡入淡出；子頁面（文章、作品頁、工具頁…）也都有了。減少動態開著時不用平滑捲動
- [x] E2E：手機卡片高度 < 220px、↓ 按了到頁尾索引；3200 實測 E2E 111 個全過

### 2026-11-24 決策表「先做」第一批：頁首頁尾小修＋7 個小工具（/tools）
- [x] **F1** 子頁面（PageShell）右上加深色模式切換（`ThemeToggle` 從 NavBar 抽成共用元件）
- [x] **F4** 手機選單：多一組常用頁（部落格、履歷、旅行）；Esc、點外面、捲動超過 40px 自動收起，打開時焦點移進選單
- [x] **F10** 版權年份用 build 那個 commit 的年份算，明年自動變「2026–2027」
- [x] **Q5** 頁尾「最後更新」後面加回 7 碼 commit hash（第一版加了 `opacity-70`，a11y 對比不足 34 頁全掛，拿掉）
- [x] **I8** 系列文最後接「系列下一篇」卡片；每篇文章最後一行 RSS 訂閱（上一篇／下一篇、相關文章本來就有）
- [x] **J 系列 7 個工具**＋`/tools` 總覽（頁尾「本站」多一個「小工具」入口，完整清單在 Ctrl+K）：
  → J1 `/tools/jpy` 日幣換匯比價（台銀、玉山；換一筆台幣各家差多少；現在的市場價比近 90 天幾 % 的日子便宜）
  → J2 `/tools/taiwan-fukuoka` 台灣 ⇄ 福岡直飛（使用者改成台灣各機場）：從福岡空港看板篩出 TPE／KHH／RMQ／TSA／TNN，不用另外接桃園機場；上線當天 13 班
  → J4 `/tools/fukuoka-weather` 福岡穿搭：福岡 vs 高雄溫差＋4 天預報＋穿著建議（Open-Meteo daily，3 小時快取）
  → J5 `/tools/airport-distance` 機場距離：OurAirports 公共領域資料精簡成 3,245 個有定期航班的機場（`public/data/airports.json`，92 KB gzip，只有這頁載入）
  → J6 `/tools/japan-tax` 日本消費稅：税抜／税込、10%／8%，順便用今天的匯率換台幣
  → J12 `/tools/ai-crawlers` AI 爬蟲檢查：伺服器去讀對方 robots.txt（RFC 9309 解析）＋看有沒有 llms.txt。防 SSRF：`lib/safe-fetch.ts`
    只收一般網域、連線那一刻檢查 DNS 解出來的 IP（擋內網、保留位址，rebinding 也繞不過）、轉址每一跳重查、逾時／大小上限；每 IP 10 分鐘 15 次、全站每小時 300 次
  → J13 `/tools/user-agent`：UA 分類規則從 `raw-traffic.js` 拆成不碰檔案的 `scripts/lib/bot-patterns.js`，瀏覽器直接用同一套
  → 輸入一律放網址參數（可以分享結果），能在瀏覽器算的都在瀏覽器算；每頁最下面連回對應的作品／頁面
- [x] 測試：單元 `robots.test.ts`（robots 解析、私有 IP、網域正規化）；E2E `tools.spec.ts`、手機選單、子頁面切主題。3200 實測 E2E 110 個、單元 167 個全過；截圖看過淺色／深色、桌機／手機

### 2026-11-23 頁面瀏覽方便程度：全站頁尾索引、Ctrl+K 快速跳轉
- [x] 每一頁（首頁＋18 個子頁、404）最下面都有頁面索引（文章／旅／本站三組 14 頁）；之前子頁面只有「← 返回首頁」，/now、/uses、/travel、/hotels、/airports、/colophon 沒有站內入口
- [x] Ctrl+K／⌘K 快速跳轉：搜尋頁面、首頁區塊、作品、文章（標題、英文名、tag），↑↓＋Enter；手機點 NavBar 放大鏡，子頁面右上「搜尋」
- [x] 子頁面內容包 `<main>`、短頁面頁尾貼底；快捷鍵說明（`?`）加上 Ctrl K
- [x] E2E 新增 `quick-jump.spec.ts`；3200 實測 E2E 101 個、單元測試 159 個全過（含 17 頁 × 深淺色無障礙掃描）

### 2026-11-23 B4「いま N 人」、B8 security.txt
- [x] 首頁頁尾「● いま N 人」：每一頁在前景時 30 秒回報一次，切背景／關分頁送「離開」；伺服器只在記憶體記分頁代碼（sessionStorage 隨機字串）→ 最後回報時間，70 秒沒報就不算，不寫檔、不存 IP；只收經過 Cloudflare 的請求
- [x] `/.well-known/security.txt`（RFC 9116）：聯絡 otemon 信箱，Expires＝build 時＋180 天、每次部署自動延
- [x] 單元測試 `presence.test.ts`；3200 實測兩個分頁＋關分頁馬上扣掉；E2E 98 個全過

### 2026-11-23 B16 /uses 補上新工具
- [x] 硬體加 Raspberry Pi＋SDR 接收棒（自架 ADS-B，不寫位置跟雷達代碼）；開發工具加 Playwright、Vitest、Renovate；技術棧加 Three.js／R3F、WebGPU／TSL
- [x] 同一天首頁微調：流星每 4～8 秒、偶爾兩顆；粒子 90 → 50；線條 18 → 28 → 44 條 3D 方向、依跟鏡頭的距離調透明度（遠淡近濃），背景加很淡的測地球面＋八面體線框（反向慢轉，視差帶出立體感）

### 2026-11-22 D6 機場時刻表 /airports
- [x] 新頁 `/airports`：「高雄 ⇄ 福岡」今天的直飛班機（今天是 BR120／BR119）＋小港、福岡各自的出發／抵達即時看板（接下來最多 30 班），每 3 分鐘自動刷新
- [x] 小港用政府開放資料（國際＋國內 4 個 JSON，含機型）；福岡用官網航班頁的 JSON（非正式，壞了那塊不顯示），聯營併進主航班、片假名城市換中文、狀態翻中文
- [x] 第一版截圖發現早上取消的班機整天卡在最上面、手機版目的地欄被擠成好幾行 → 都修了
- [x] /flights 頁首加入口、sitemap、分享圖、a11y／privacy／share-meta E2E 都加了；E2E 98 個全過

### 2026-11-22 D2 日圓匯率、D5 空氣品質：課程作品的「線上版」
- [x] **D2** 作品頁 `/projects/yen-rate-analyzer` 加「即時牌價」：台銀（官方 CSV）＋玉山（網頁 JSON-LD）現金／即期賣出、作品原本的決策邏輯
  （預算 ÷ 日圓價格＝目標匯率，現金賣出 ≤ 目標 →「現在就買」）、Yahoo 近 90 天走勢。作品的 6 家銀行實測只剩 2 家抓得到（第一 404、華南要跑 JS、國泰連不上、元大 500），照實寫
- [x] **D5** 作品頁 `/projects/aqi-classification` 加「高雄現在」：Open-Meteo（CAMS 模型）六項污染物，用環境部 114 年版即時 AQI 公式算等級、指標污染物。
  環境部開放資料要金鑰（api_key），沒用；頁面寫明是模型推估不是測站
- [x] 都是伺服器端抓（`lib/live-cache.ts`），a11y E2E 加了這兩頁；E2E 94、單元測試全過

### 2026-11-22 首頁改回線條＋流星、頁尾天氣（D3）、雷達機型統計（D4）
- [x] **首頁**（使用者：「粒子效果看了有點複雜（煩），感覺線條就不錯，有時加個流星」）：桌機預設改回 WebGL 細線版（`AUTO_WEBGPU = false`），
  加流星：每 8～16 秒一顆、不到 1 秒、頭亮尾淡、減少動態不出現。WebGPU 版保留在 `?hero=webgpu`，C11 的測試改測那個網址；11/23 依使用者要求加快成每 4～8 秒；同日加「偶爾一次兩顆」（25%，第二顆晚 0.15～0.45 秒、從旁邊出發、淡一點）
- [x] **D3 頁尾天氣**：時鐘旁邊「高雄 17:48 晴 23° ・ 福岡 18:48 晴 10°」，Open-Meteo（不用金鑰）30 分鐘抓一次，顯示漢字不用 emoji
- [x] **D4 雷達機型**：新收到的飛機問 adsbdb 查機型、存本機快取，/radar 加「機型（近 7 天）」。接真的雷達測過（A320、A321、A330…）。不做航線（會露位置）
- [x] 新增 `lib/live-cache.ts`：外部 API 共用的伺服器端快取（失敗給上一次成功的資料）
- [x] 測試：單元 137、E2E 90 全過（port 3200）

### 2026-11-22 C11 用真顯卡測首頁 WebGPU 版
- [x] `e2e/hero-webgpu.spec.ts`：系統 Chrome＋D3D11＋RTX 3070，走正式的自動判斷（不帶 `?hero=`）。確認：renderer 是 webgpu、粒子數有在調、
  按住 2 秒游標附近的粒子變多、拖曳畫出星點、雙擊後 4 秒粒子到名字的位置（從 GPU 讀回位置比對）、雙擊三次繞回星空、全程沒有退回也沒有錯誤
- [x] `HeroSceneGPU` 加 `window.__heroProbe`（給測試讀 GPU 上的粒子位置，只有呼叫時才讀）
- [x] 過程中一度誤判「vec3 buffer 寫錯位」並改壞形狀，截圖才發現；查 three 原始碼確認原本的寫法是對的，改回去並在檔案開頭寫清楚（CLAUDE.md 坑 ④）
- [x] 本機連跑 3 次都過、全部 E2E 90 個通過；CI（`e2e.yml`）設 `HERO_WEBGPU_REQUIRED=1`，拿不到 GPU 算失敗、不會悄悄跳過

### 2026-11-22 TODO 整理
- [x] **首頁 LCP 決策點結案**：真實訪客 p75 LCP **1.63s**（n=46，11/09 是 1.88s／25 筆）、INP 48ms、CLS 0，全部 good → Hero 進場動畫不改
- [x] 回查：FoodLens repo 的 PDF 還在、三個 repo 的 About 還是空的、profile README 還是舊版（都還留在 TODO 🙋）；CSP 回報 0 筆

### 2026-11-22 首頁 WebGPU 版（使用者：「電腦版用 WebGPU、手機用 WebGL，電腦版更多可玩性」）
- [x] 依「拿不拿得到 GPU」分版本（不是依電腦／手機）：WebGPU 版／WebGL 版（照舊）／手機 Canvas 2D 版（照舊）；減少動態一律 WebGL 版
- [x] 四個玩法：流場、按住聚集／放開散開、拖曳畫星座、雙擊換形狀（名字、航線圖、網站圖示）；粒子數依 fps 自動調整（實測 RTX 3070 跑到上限 8,000 顆、100+ fps）
- [x] 太慢、退回 WebGL2 後端、丟錯 → 自動換回 WebGL 版；Playwright 內建 Chromium 拿不到 device 的情況實際驗證過退回
- [x] 早上那輪「A7 不做」的評估改寫：問題出在「有 navigator.gpu 但沒 GPU」的退回路徑，先拿 adapter 再決定就避開了
- [x] 測試：E2E 89 個（headless 走 WebGL 版）、真顯卡（headless Chrome＋D3D11）跑過每個玩法的截圖、深色模式、減少動態、手機

### 2026-11-22 A7 評估（不做）＋ A5 部署失敗的修正
- [x] **A5 第一次部署 build 失敗**（23:24，線上沒動，雙槽擋住了）：/changelog 分享圖產生時丟錯，重 build 就好——判斷是 Google Fonts 對那組字回了壞字型。
  `og-font.ts` 檢查字型檔頭＋重抓、`og-card.tsx` 先試畫、畫不出來退回英文，不再讓整個 build 失敗
- [x] /status 深色模式「部署失敗」的琥珀字對比不夠（a11y E2E 抓到，因為今晚剛好有一筆失敗）：新增 `--warn` 色票，深色用亮一點的琥珀
- [x] **A7 WebGPU**：實際換上 WebGPURenderer 量過——有 `navigator.gpu` 但沒 GPU 的瀏覽器掉到 12 fps，不上線；數字記在 TODO「評估過、先不做」
- [x] 測試：單元 135 個、E2E 89 個（port 3200）

### 2026-11-21 A5 旅行地球 /travel
- [x] 飛行紀錄＋住宿紀錄放在同一顆可以轉的地球上：大圓航線弧線、住過的城市點（越大住過越多間），點城市看住過幾間／起降幾次
- [x] Canvas 2D 自己做投影，桌機手機同一套、沒有載 three.js；「全球／東亞」切換；城市清單可以用鍵盤選
- [x] /flights、/hotels 照舊保留明細，開頭連過來；有 Markdown 版、分享圖
- [x] 測試：單元 135 個、E2E 89 個（port 3200，含 /travel 無障礙）

### 2026-11-21 A6 部落格升級
- [x] 全文搜尋（/blog 搜尋框，中文、程式碼裡的指令都搜得到，片段標出命中的字）——自己做、沒裝 Pagefind
- [x] 程式碼區塊「複製」按鈕；每篇文章最後「對應的修改」連到 GitHub commit（8 篇都對過 commit 內容）
- [x] RSS 改全文（`content:encoded`）
- [x] 留言 giscus：程式做好、預設關著，要使用者開 Discussions＋裝 app（見 TODO）；按了才載入，不會一打開文章就連第三方
- [x] 測試：單元 132 個、E2E 85 個（port 3200）

### 2026-11-21 A9 MCP 伺服器 ＋ A10 公開 JSON API
- [x] `/api/v1`：簡介、作品（清單／單筆）、文章（清單／單筆含全文）、現況、飛行統計，OpenAPI 3.1 規格；build 時產生、CORS 全開
- [x] `/mcp`：MCP Streamable HTTP 伺服器，8 個唯讀工具（作品、文章、搜尋、現況、飛行統計），Claude Code 一行就能加
- [x] `/developers` 說明頁（有 Markdown 版）、頁尾「API」連結、`/llms.txt` 補上 API／MCP／新頁面
- [x] 測試：單元 125 個（含 OpenAPI 跟實際回應比對）、E2E 82 個（含真的打一輪 API 跟 MCP）

### 2026-11-21 A8 本站構造 /colophon
- [x] 架構圖 11 個節點（主線：訪客 → Cloudflare → Tunnel → server.js → Next.js 雙槽 → data/；旁邊：雷達、告警信、watchdog、部署、備份），每個方塊帶即時數字
- [x] 點方塊跳到說明卡並高亮（零 JS）；作品「本站」詳細頁的「看架構圖」連過來、/status 開頭也連過來
- [x] 測試：單元 112 個、E2E 76 個（port 3200）

### 2026-11-21 A4 維運狀態頁 /status（使用者：「A4-A10 都做」）
- [x] 近 90 天可用率長條（watchdog 每一輪寫 `data/uptime.log`，今天開始記；之前的日子灰色並說明原因）、近 30 天可用率
- [x] 部署紀錄（deploy.log：成功／失敗／自動退回、花幾秒、成功部署的中位數）、自動重啟紀錄（watchdog.log 只轉成分類，不放原文）
- [x] 事故報告 10 篇（7/09 node.exe 無聲停 → 11/21 /changelog 空白），照「影響 → 發現 → 原因 → 修法 → 之後」，有文章的連過去
- [x] 分享圖、sitemap、頁尾 Status 連結；測試：單元 111 個、E2E 72 個（port 3200）

### 2026-11-21 「你要動手的」清單回查
- [x] **Bing 收錄**：使用者 Bing Webmaster URL Inspection 截圖「Indexed successfully」、No SEO/GEO issues、抓到 JSON-LD＋OpenGraph（bingbot 累計 73 次）
- [x] **網域自動續約**：使用者確認開著（RDAP 到期日 2027-06-16）
- [x] **UptimeRobot 監控**：使用者改好設定
- [x] **「人工智慧與深度學習」那門課**：使用者確認 FoodLens 就是這門課的期末專題 → 課程學習記録加一段、連到 FoodLens 作品頁，
  FoodLens 頁底註明是這門課的期末專題（作品段落現在可以帶站內連結：`ProjectDetailSection.links`）
- [x] **FoodLens repo 的 PDF**：Claude 解出內容是期末專題說明（不是個人文件），使用者決定刪（要在 GitHub 上刪，見 TODO）
- [x] **cloudflared 升到 2026.11.1**：查出 11/09 寫的版本看錯份、服務其實跑 2026.5.2 的免安裝版；`scripts/upgrade-cloudflared.ps1`
  第一次跑 winget 裝成 MSI（升到 Program Files 那份、服務沒換），腳本改成「把服務指到最新那份」後第二次跑完成：
  服務 binPath＝`C:\Program Files (x86)\cloudflared\cloudflared.exe`、外網 200、watchdog 沒有誤報
- [x] **舊的 cloudflared 免安裝版刪掉**：`winget uninstall --product-code`（只認那一份），現在只剩 Program Files 那份、winget 也列 2026.11.1
- [x] **/changelog 上線後是空的**：CI runner 的 build 裡 git 格式字串經過 cmd.exe 被動到，改 `execFileSync` 修好（第三次部署）
- [x] 測試：單元 103 個、E2E 68 個（port 3200）

### 2026-11-21 TODO 小項目一次做掉（使用者：「優化個人的 web」）
- [x] **B1 更新紀錄 `/changelog`**：build 時從 git 的 `feat` commit 產生（53 項、依月份、每項連到 GitHub commit），頁尾「最後更新」整段連過來；
  有 Markdown 版、分享圖、sitemap。commit 訊息有本名／信箱／token 的，`lib/changelog.ts` 的 `OVERRIDES` 改寫或拿掉，
  另有關鍵字保險（之後的 commit 寫到也不會上線）；「會籍含權益與效期」那則改寫成現況
- [x] **B5** 文章頁加麵包屑結構化資料（跟作品頁同格式）
- [x] **B6** /flights 統計下面加一行「地球到月球距離的 22%——再飛 299,585 km 就到了」，Markdown 版同步
- [x] **B7** /flights、/hotels、/stats、/radar、/now、/uses、/changelog 各自的分享圖（共用 `lib/og-card.tsx`；/stats、/radar 不放即時數字）
- [x] **B12** 刪掉 `public/` 沒用到的 5 個 create-next-app 預設 svg
- [x] 測試：單元 103 個、E2E 68 個（port 3200 production build，含新頁的無障礙／隱私／分享圖）

### 2026-11-21 自家雷達獨立頁 /radar（使用者：「沒能給更好看的頁面嗎?」）
- [x] 大數字「現在幾架」（每 30 秒更新）＋慢慢掃的雷達圓盤（裝飾，不畫光點）、4 格統計、一天的節奏（每小時）、近 30 天、近 7 天航空公司、關於這台雷達
- [x] 資料多記每小時最多同時幾架（`hourPeak`）；/stats 的圖表抽成共用元件；首頁小卡、頁尾、作品頁、/flights 摘要都連到 /radar
- [x] 測試：單元 96 個、E2E 58 個（含 /radar 的無障礙＋隱私）

### 2026-11-21 雷達、飛行紀錄、住宿紀錄拿到明顯的地方（使用者：「可以不用藏那麼深，FR24 自架站點是一個特色」）
- [x] 作品集新增個人專案「自架 FR24 雷達站」（`/projects/fr24-receiver`）：架設、除錯（0 → 41 分鐘 6,663 則）、接到網站與隱私、架構圖；詳細頁有「看即時狀態」連結
- [x] /flights 的雷達從最下面搬到統計數字下面（載入中先畫骨架，不跳動）；首頁 About 加雷達小卡；足跡分頁加雷達連結；首頁頁尾加 Flights
- [x] 測試：E2E 全部 55 個（port 3200，a11y 抓到文字中的連結只靠顏色、補了底線）、單元 93 個

### 2026-11-21 自家雷達放上網站（TODO 點子 B13）
- [x] /flights 最下面「自家雷達 · My Radar」：收訊中／離線、現在／今天／最多同時幾架、今天的航空公司、近 7 天架次跟在線率
- [x] server.js 每 30 秒在區網讀雷達 → `data/radar.json` → `/api/radar` 只回數字（金鑰、內網 IP、識別碼、座標都不出去）
- [x] watchdog：雷達離線 15 分鐘、白天 2 小時 0 架就寄信；週報加「自家雷達」；radar.json 進每日備份
- [x] 測試：單元 9 個、watchdog 6 種狀態、週報假資料、a11y／CSP／隱私 E2E 29 個（port 3200）
- [ ] 「列出頭上這幾班（航班代碼＋高度、不放座標）」要不要做，等使用者決定

### 2026-11-20 FR24 雷達收訊修好
- [x] 原本一分鐘約 100 萬個疑似訊號一個都解不出來（accepted 0、雜訊 -31 dBFS）：增益沒設＝最大。使用者在 settings 的 Process arguments 填 `--gain 40`
- [x] 改完重啟時 fr24feed 卡在「關到一半」（`monitor.json` 的 `shutdown: yes`、接收器斷線 30 分鐘，網頁的 Restart 沒反應；`restart.html` 一打開就會觸發重啟），使用者拔電重開才好
- [x] 重開後 41 分鐘：6,663 則訊息、21 架、位置解碼 1,021 次 0 失敗（含小港機場地面的飛機），雜訊 -37 dBFS

### 2026-11-17 Search Console 進週報（TODO 點子 C4，程式部分）
- [x] `scripts/lib/search-console.js`：點擊／曝光／平均排名（跟前一週比）、前 5 搜尋字詞／頁面、sitemap 每個網址的收錄狀態（URL Inspection API）
- [x] 接進 `weekly-report.ps1`（沒設金鑰就不顯示）、上週收錄數存進快照可以比；金鑰檔加進每日備份；單元測試 6 個
- [x] 用假金鑰實際打過 Google token 端點（回「account not found」＝JWT 格式正確），三種情況（有資料／出錯／沒設定）都 dry-run 過
- [x] 使用者建好服務帳號 `kbs0830-weekly`（資源 `sc-domain:kbs0830.com`），11/17 第一次實際跑：sitemap 29 個網址收錄 25 個、一週曝光 25／點擊 2；完整資料寄到 otemon。順手修：頁面／字詞改照曝光排序（API 預設照點擊）、收錄查詢 6 個並行（94 秒 → 41 秒）

### 2026-11-13 GitHub 通知改寄 otemon（使用者設好的）
- [x] GitHub 帳號加了 `otemon.pcwork@gmail.com`、Default notifications email 選它：E2E 失敗、外部監控（uptime.yml）開的 issue、Renovate PR 都改寄 otemon
- [x] 所以 TODO「（選做）外部監控的信改寄 otemon」也不用做了。uptime.yml 自己寄信那段（repo secret `ALERT_SMTP_USER`／`ALERT_SMTP_PASS`）還留著，沒設就跳過

### 2026-11-13 外網檢查不再因為一分鐘抖動就寄信
- [x] 11/13 01:46 Tunnel 慢了約一分鐘（server.log 看到 chunk 晚 60 秒才到），watchdog 一輪失敗就寄「外網連不到」，5 分鐘後又寄「恢復」
- [x] 改成連續兩輪都失敗才寄；chunk 逾時會重試、原因寫「逾時」，不再誤寫成「build hash 對不上」（404／500 照舊馬上判失敗）

### 2026-11-12 全站換新寫法（使用者：「有沒有太過舊的技術，幫我都用新技術新寫法」）
- [x] 彈窗確認全部是原生 `<dialog>`（終端機、快捷鍵說明），沒有 div＋JS 舊寫法
- [x] error boundary `reset` → `retry`（Next 16.3）；`color-scheme`＋`accent-color`；`min-h-screen` → `min-h-svh`；
  分頁底線、手機 Hero canvas 改 `ResizeObserver`；媒體查詢範圍語法；fetch 改 async/await＋AbortController，Spotify 背景分頁不輪詢；
  標題 `text-wrap: balance`／內文 `pretty`；深色模式 inline script 改 `const`＋`catch {}`
- [x] 套件只差 patch 版（next 16.4.6、tailwind 4.3.5、playwright 1.65），交給週一 Renovate；TS 7、@types/node 26 照舊擋著

### 2026-11-12 新圖示
- [x] **狀態色圖示**（使用者：「多換一些顏色代表其他的狀態」）：正常＝靛藍、本機開發＝綠、維修中＝琥珀、頁面出錯＝紅（日照舊櫻花粉）
- [x] **新功能上線 12 小時＝櫻花粉圖示**（使用者：「推送新功能(持續12小時)就給我櫻花粉，然後把這個寫進網站特色」）：
  部署範圍有 `feat` commit → deploy.ps1 寫 `data/feature-release.json` → API 回到期時間 → 分頁圖示換櫻花粉。
  同日改版（使用者：「櫻花粉指示燈指右上角的點，不是整個 ICON」）：視窗維持靛藍，右上角的點平常暖白（燈沒亮）、新功能時亮櫻花粉並稍微放大。
  作品頁 kbs0830-web 加了「會看狀態的網站圖示」一段
- [x] **新增維修模式**（`scripts/maintenance.ps1 -On "原因"`）：網站顯示維修頁（503、琥珀圖示），watchdog／外部監控不會誤判成掛掉，開超過 12 小時寄信
- [x] **網站圖示重新設計**：使用者看了 4 輪提案（P 字母 → 不用字母 → 城市／日本旅遊 → 程式×日本 → 終端機變化），
  選「B3 終端機視窗＋標題列的日」，日改成櫻花粉。分頁（32，簡化版）、192／512、iPhone 主畫面（apple-icon，之前 404）、
  favicon.ico（16／32／48，之前 404）全部同一份 SVG（`lib/brand-icon.ts`）

### 2026-11-12 訪客分析頁、頁尾拿掉未過濾、tag 頁 noindex
- [x] **頁尾「未過濾 N 次…」那行拿掉**（使用者要求）
- [x] **抓到自己造成的資料污染**：訪客 API 的單元測試沒把新的明細檔指到暫存檔，跑測試就往正式 `data/visits-detail.json` 寫了 8 筆「(其他)」。測試改好（多一個測試確認寫到暫存檔）、那 8 筆刪掉
- [x] **訪客分析頁**（`/stats` 升級）：每日瀏覽／造訪／新訪客、熱門頁面、來源網域、裝置／瀏覽器／作業系統、24 小時時段；
  不用 cookie、不存 IP／完整 UA／完整網址。資料從 11/12 部署後開始累積；有進每日備份
- [x] **Search Console 11/12 匯出看過**：索引 11 頁沒變、未建立 42；14 個 tag 頁設 noindex＋移出 sitemap（43→29）
- [x] **Safari（WebKit 27.2）測過**：使用者沒有 iPhone，改用 Playwright WebKit 模擬 iPhone 13——換頁動畫、標題、
  4 頁沒溢出、0 CSP 違規、0 錯誤

### 2026-11-09 TODO 盡量做（使用者：「todo 都做，有要我幫再說」）
- [x] **桌機以外的外部監控**：`.github/workflows/uptime.yml`，GitHub 雲端（不是桌機 runner）每 10 分鐘打一次，連 3 次失敗開 uptime issue、
  恢復自動關；不需要 secret，有 SMTP secret 再加寄 otemon。UA `kbs0830-uptime` 不算進流量統計
- [x] **3 篇部落格草稿**（`content/drafts/`，等使用者看）；`content/drafts/` 補進 `.gitignore`（CLAUDE.md 寫了但沒做）
- [x] **首頁 LCP 先看**：p75 1.88s 已 good，不用縮動畫
- [x] **profile README 草稿**（跟網站同風格）；Bing、高中英文校名查過（Bing 還是 0 筆、官方英文名查不到）
- [x] **網域到期日更正**：Verisign RDAP 是 2027-06-16（TODO 原本寫 5/18），提醒信改 5/16
- [x] 盤點：沒有待合併的 Renovate PR；桌面發現团‧鐵道、大手門資訊工作室——使用者 11/09 說**都不要放**
- [x] 手機頁尾 Cloudflare／未過濾數字恢復顯示（之前整行隱藏，使用者以為 Cloudflare 資料不見了）
- [x] **Cloudflare 靜態頁快取上線**（使用者加了 Cache Rules／Cache Purge 權限）：首頁第二次打是 HIT、/stats 是 DYNAMIC；
  伺服器回應（扣掉握手）快取頁約 160ms、沒快取的 /stats 300～600ms。Markdown（Accept: text/markdown）、API 都沒被快取、沒跟 HTML 混；
  CSP header 在快取的回應上還在；真瀏覽器站內換頁（作品卡片、文章）都正常
- [x] 23:18、23:21 兩次 E2E 失敗＝Claude 手動開的 3100 server 沒關、跟 CI 搶 port，已關掉；之後手動測試用 3200

### 2026-11-09 Cloudflare 設定腳本、VS Code schema 警告
- [x] `scripts/cloudflare-config.ps1`：Always Use HTTPS、HSTS、www 導向、WAF 擋掃描器。預設只檢查，`-Apply` 才改、改完 curl 回查；
  deploy.ps1 每次部署帶 `-Check` 跑（設定被改掉就寫 log＋寄信）
- [x] **11/09 使用者建好 token（`kbs0830-config`），套用完成**：Always Use HTTPS 打開、HSTS 半年、WAF 擋掃描器規則建立（www 導向本來就在）。
  curl 回查：`http://` → 301 https（query 保留）、`http://www.` → https → 裸網域、`/wp-admin`／`.php`／`/.env`／`/.git` → 403、
  `/.well-known` 沒被誤擋、文章／tag／`/stats`／RSS／Markdown 版照常 200
- [x] VS Code 打開 `renovate.json` 跳「位置不受信任」：`.vscode/settings.json` 信任 docs.renovatebot.com

### 2026-11-09 CSP 正式開
- [x] `Content-Security-Policy` 從 report-only 改成正式（會擋）。正式開之前：全站 43 頁＋終端機／主題切換／Konami 互動，
  Chrome 156、Firefox 157 用強制模式跑過，0 個違規；線上 report-only 也是 0 筆
- [x] 被擋的照樣回報到 `/api/csp-report`；新 E2E `csp.spec.ts`：sitemap 每一頁捲到底都不能有違規、header 有送
- [x] dev（`next dev`／CI）多給 `unsafe-eval`、websocket（Fast Refresh 要用）；正式站沒有。`server.js` 明確設 `NODE_ENV=production`
- [x] 12/09 提醒信改成「正式開一個月回查」
- [x] **上線幾分鐘就從回報抓到漏網之魚**：Cloudflare Web Analytics 的 beacon（edge 只對真瀏覽器插入，本機測不到）被擋，馬上加進允許清單
- [x] `useMemo` 那項評估後決定不改（理由在 TODO「評估過、先不做」）

### 2026-11-09 新套件：Markdown 表格、無障礙自動檢查（使用者同意停站 1～2 分鐘）
- [x] **remark-gfm**：部落格支援表格、刪除線、任務清單（實測表格渲染正常）
- [x] **axe-core E2E**（`e2e/a11y.spec.ts`）：8 頁 × 淺色／深色，首頁 About 每個分頁都掃。第一次跑抓到並修好：
  - 全站約 20 處「灰字再疊 opacity」對比不足（頁尾最後更新、/flights 機型、作品英文成果句、/resume 底部、About 分頁標籤…）
  - 深色架構圖線上標籤 4.43:1（差一點到 4.5）→ 底色壓深，8 張架構圖重畫
  - Hero 副標 `<p>` 上的 aria-label（規範不允許）→ 改成隱藏文字
- [x] 在獨立 worktree 裝套件、build、跑完 53 個 E2E 才推，線上 node_modules 由部署安裝

### 2026-11-09 證照、部落格、互連、週報、還原演練、CSP
- [x] **證照**：從 104 履歷 PDF 的「資格認證」加到 `/resume`（丙級電腦硬體裝修、GTC、Duolingo 80、業餘無線電、珠心算、駕照）。PDF 其他個資沒用
- [x] **首頁最新文章**：作品集下面 3 篇（`LatestPosts.tsx`）
- [x] **部落格**：上一篇／下一篇、相關文章（依 tag，不含同系列）、目錄（4 個小標以上，原生 `<details>`）、
  tag 頁 `/blog/tags/next-js`（sitemap、Markdown 版都有）、「自架網站維運」系列 5 篇（frontmatter `series`／`seriesOrder`）
- [x] **技能 ↔ 作品互連**：About 技能 chip 點了跳到作品集並篩好（17 個技能對得到作品）；作品頁 tag 連回 `/?tag=X#portfolio`
- [x] **造訪數每一頁都算**：layout 的 `VisitBeacon`，頁尾改成只讀
- [x] **每週流量週報**：`scripts/weekly-report.ps1`，watchdog 每週一 09:00 後寄；第一封 11/09 寄出
- [x] **每季備份還原演練**：`scripts/restore-drill.ps1`，從 GitHub 重新下載→解密→跟 D: 逐檔比，90 天一次；第一次 11/09 通過（17 個檔案全同）
- [x] **CSP report-only**：`next.config.ts` header ＋ `/api/csp-report` 收違規（只存指令＋網域＋路徑）
- [x] **Firefox 換頁動畫**：Firefox 157 支援 View Transitions，作品卡片 → 詳細頁 → 返回都正常、沒有錯誤
- [x] **修：中文 tag 頁 404**：`/blog/tags/隱私` 改成 `/blog/tags/privacy`（`blog.ts` 的 `TAG_SLUGS`）；
  新增 E2E「sitemap 每個網址都要 200」，拿舊版跑確認會抓到這個 bug

### 2026-11-09 作品篩選列／作品分享圖／`/stats`
- [x] **作品篩選列**：只直接列 2 個以上作品用到的 12 個 tag，其餘 30 個收進「+30 更多」
- [x] **每個作品專屬分享圖**：作品名＋一句話成果＋技術 tag（`app/projects/[slug]/opengraph-image.tsx`），E2E 有測
- [x] **公開的 `/stats` 頁**：Cloudflare 近 30 天趨勢、誰在讀（瀏覽器／AI／搜尋引擎／其他機器人）、爬蟲排行、真人訪客國家；頁尾加 Stats 連結

### 2026-11-09 課程作品全部上架（去識別化）
- [x] 新增 5 個課程専題：路口排雷、空氣品質分類、SQL 分析、電商顧客流失預處理、均線交叉回測，每個都有實際執行的截圖
- [x] 「課程學習記録」加詳細頁，列其餘練習（餐廳 RWD 網頁、PHP CRUD、程設二、期中考）
- [x] 記帳系統拿掉「智商二乙 第十一組」；所有新內容不含學號、本名、組員姓名

### 2026-11-05 你的待辦完成的
1. [x] **Bing：要求編製索引** → ✅ 2026-11-05 Live URL 測試＋Request indexing 完成
   → 背景：Bing 從來沒收錄過（首頁「Discovered but not crawled」，唯一一次抓取 9/6 連不上）
   → 🔜 **11/08 左右回查**：Bing 搜 `site:kbs0830.com` 有結果、或 URL Inspection 變成「Indexed」才算數；
     還是沒收錄就把 URL Inspection 畫面給 Claude
3. [x] **Email 告警** → ✅ 2026-11-05 `.env.local` 設好 otemon 的應用程式密碼，測試信寄出成功（SMTP 驗證通過）
   → 之後網站掛掉／Tunnel 斷線／部署失敗都會寄到 otemon.pcwork@gmail.com；不想用了到
     https://myaccount.google.com/apppasswords 刪掉 `kbs0830 watchdog` 即失效
4. [x] **GitHub 個人頁** → ✅ 2026-11-05 回查：Website `https://kbs0830.com`、Location、IG 連結已上（Name 維持 LI,PING-WEI；Bio、FB 選填，想加再加）
   → https://github.com/settings/profile：**URL** `https://kbs0830.com`、Social accounts 填 FB／IG、
     Bio `学生開発者 · AI × Web｜高科大 智慧商務系｜YOLOv8・FastAPI・Next.js`、Location `Kaohsiung, Taiwan`
   → Name 要不要加「李秉威」你決定（加了 GitHub 頁面看得到本名，但最能把本名跟網站連起來）
   → 順手 pin `FoodLens-Advisor`、`YARTIX-TICKETING-TEST`（見中優先「GitHub repo 品質」）
8. [x] **重開機不登入實測**：2026-11-06 停電後完整重開，排程工作開機觸發、Tunnel 延遲啟動約 2 分 20 秒，全部自己起來
10. [x] **備份上 GitHub** → ✅ 2026-11-05 私有 repo `kbs0830/kbs0830_backup` 啟用，第一次 push 後實測從 GitHub 下載→解密→
    解壓，跟 D: 那份逐檔相同。`BACKUP-KEY.txt` 使用者 11/05 確認已另存到桌機以外的地方

### 2026-11-09 已完成
- [x] **住宿紀錄 `/hotels`**：78 間飯店、29 城市、7 個國家／地區，城市地圖＋依地區／集團分類。；會籍 13 筆（只寫計畫名稱＋等級），GHA／IHG 酒廊／華航到期有提醒信。
  使用者確認：有洲際大使；Radisson 是美國運通簽帳白金卡（台版）附贈的麗賞會尊榮 Premium（舊的「金卡」已不存在）
- [x] **部落格第 5～8 篇**：〈網站斷了 4 天沒人發現〉〈掃描器打 /blog/.env 拿到 500〉〈想做零停機部署，結果被 VS Code 擋住〉
  〈訪客統計裡藏了 1037 筆假資料〉；文章內的站內連結改成同頁開啟
- [x] **RSS feed** `/feed.xml`（/blog 頁有訂閱連結）
- [x] **每篇文章專屬分享圖**：標題（中文襯線字）＋英文副標＋標籤，build 時產生
- [x] **全站分享卡片修正**：作品頁、/now、/flights、/resume、/blog 分享到 LINE／Discord 原本全部顯示「PINGWEI LI — Portfolio」，
  改成各頁自己的標題（`lib/share-meta.ts`），`e2e/share-meta.spec.ts` 會擋回歸

### 2026-11-06 已完成
- [x] **頁底 Cloudflare 數字**：近 30 天訪客／瀏覽＋累計，一小時更新，數字跟 dashboard 一致（分析唯讀金鑰）
- [x] **頁底未過濾流量**：server 端每個頁面請求都算（含 AI 爬蟲／搜尋引擎／掃描器），分四類顯示在「造訪」下面
- [x] **停電後第一次冷開機驗證自動啟動**：全部自己起來，Cloudflared 延遲啟動約 2 分 20 秒

### 2026-11-05 已完成（內容／手機／AI／備份）
- [x] **首頁分類＋桌機 Hero 互動**：About 的歷程／技能／活動／足跡改成分頁（首頁桌機、手機都 −19%）；
  Hero 粒子被游標推開＋星座連線＋點擊衝擊波、名字滑鼠解碼、捲走時上飄淡出。手機完全不受影響
- [x] **網站本身加進作品集**（`/projects/kbs0830-web`）：自架、雙槽部署、watchdog、加密備份，數字全部有出處
- [x] **部落格第 4 篇**〈網站每 72 小時準時掛掉：凶手是 Windows 工作排程器的預設值〉
- [x] **Markdown for Agents**（TODO B4）：`Accept: text/markdown` 或網址加 `.md`；作品頁 HTML 155KB → 3.5KB
- [x] **本名給 AI／爬蟲、不給人看**：JSON-LD、`/llms.txt`、Markdown 版有；畫面、title、description、分享卡片沒有。
  `e2e/privacy.spec.ts` 每次 push 自動檢查
- [x] **手機版**：Hero 改 Canvas 2D 輕量動畫（陀螺儀／手指互動、不載 three.js、捲走就停）、篩選列橫向滑動、
  內文 15px、程式碼貼齊螢幕、閱讀進度條、文章閱讀時間。手機首頁高度 −13%
- [x] **飛行紀錄獨立頁 `/flights`**：航線圖（靜態 SVG）、51 航班／23 機場／17 家航空、約 84,815 km。只留代碼＋機場，
  不放日期。首頁足跡只留國家城市；韓國、越南改已到訪，日本加札幌／名古屋／旭川／石垣（使用者確認）
- [x] **訪客統計**：沒經過 Cloudflare 的請求不再計入（之前 CI／本機被記成 XX，累積 1037 筆，已清掉）
- [x] **備份**：GitHub 加密備份啟用＋還原實測；備份也收 Web Vitals 數據

### 2026-11-04～05 已完成（人名搜尋／AI 搜尋／索引健檢）
- [x] 本名維持只放不可見資料（使用者 11/04 再次確認，見 CLAUDE.md Key Constraints 1）：Person JSON-LD 加上
  李秉威／Li Ping-Wei／Ping-Wei Li 等拼法、大頭照、學歷（高科大＋中正高工）；首頁 ProfilePage；`/llms.txt`；
  部署時自動 IndexNow 通知 Bing（11/04、11/05 都回 200/202）
- [x] **`/blog/<不存在的網址>` 回 500 → 改成 404**（11/05）：排程工作沒設工作目錄，`blog.ts` 找不到
  `content/blog`。掃描器打 `/blog/.env` 之類一直是 500，Search Console 的 5xx 有一部分是這個。`server.js` 啟動時 `chdir`
- [x] **履歷高中校名**：原誤寫 Taipei → 「高雄市立中正高級工業職業學校 / Kaohsiung Municipal Zhongzheng Vocational
  High School」，履歷 PDF 已自動重印。⚠️ 英文只換了城市名，學校官方英文名（Chung Cheng？Industrial？）要跟證書對的話再給 Claude
- [x] **Cloudflare 沒擋 AI 爬蟲**：AI Crawl Control 近 7 天 BingBot 45、Googlebot 31、OpenAI 24、Anthropic 23、
  Perplexity 17… 全部 Allowed。441 次 404 是掃描器（`/.env`、`/wp-login.php`）跟部署後的舊 JS chunk，不用處理。
  Bot Preference Sync、Markdown for Agents（付費）維持關
- [x] **Search Console 健檢結論**：收錄 10→4 頁、Google 10/27 起停止檢索，根因都是 10 月的斷線
  （每 72 小時被砍 → 11/02 修；Tunnel 10/28 晚～11/01 斷 → 11/02 改服務）。origin log 沒有任何 robots.txt 錯誤，
  兩次 robots.txt 5xx 都是 Tunnel 那層。11/05 sitemap 15 個網址全 200、www 301

## 🧭 2026-11-03 — 自動化／新技術

背景：11/02 上線 `upgrade/2026-10` 時又踩到幾個「要有人剛好去看才會發現」的洞——CI build
失敗沒人通知、每次 push 都要你親自來、build 直接蓋在正式站目錄上。下面依效益排序，
建議先做 **A1 → A3 → A4**。

### A. 自動化

- [x] **A1. 讓 Claude session 自己 push** ⭐ 效益最大｜🙋 需要你貼一次公鑰
  → ✅ 2026-11-03 完成：repo Deploy key `desktop-claude-push`（寫入權限），設定見 CLAUDE.md「CI/CD」
  → 現況：你在桌機自己的 PowerShell 可以 push，但 Claude 這邊讀不到 GCM 的登入
    （`Cannot prompt because user interactivity has been disabled`），每次改完都要等你
  → 做法：桌機產生一把 ed25519 SSH key，你把公鑰加到 GitHub（Settings → SSH keys，
    或只給這個 repo 的 Deploy key + 寫入權限，範圍更小），remote 改成 SSH
  → 之後「改 → 測 → push → CI 部署 → 回查」整圈不用等人
- [x] **A2. 部署失敗／網站掛掉主動通知**｜🙋 需要你選管道
  → 2026-11-03 選 Email，程式已完成（`scripts/lib/notify.ps1`，接進 deploy/watchdog）。
    ✅ 2026-11-05 應用程式密碼設好、測試信寄出成功。🙋 剩：UptimeRobot 監控設定要檢查
    （10 月月報 0% uptime 但網站實際只斷 10/29–11/01 約 3 天，監控本身設錯）
  → 11/02 CI build 失敗是 Claude 剛好去翻 log 才發現；10 月斷線 4 天也沒人知道
  → 選項：Email 寄到 `otemon.pcwork@gmail.com`（要在該 Gmail 開「應用程式密碼」給 SMTP 用）
    或 Discord webhook。觸發點：`deploy.ps1` 失敗、`watchdog.ps1` 出現 `[FAILED]`
  → 跟下方中優先的「部署通知」是同一件事，做了就一起勾掉
- [x] **A3. 原子化部署＋自動回滾** → ✅ 2026-11-03 完成（雙槽 `.next-a`／`.next-b`，見 CLAUDE.md「CI/CD」）
  → 實測：停站 1～2 秒（原本 5～40 秒）；`-TestRollback` 驗證過自動指回上一槽
  → 第一版「build 到 `.next-build` 再改名」被 VS Code TS 服務鎖住資料夾（Access denied），改成不搬資料夾
  → 中優先的「零停機部署」也一併解掉大半（剩重啟那 1～2 秒）
- [x] **A4. watchdog 從外網檢查（含 Tunnel）** → ✅ 2026-11-03 完成（只寄信，不自動重啟 Cloudflared）
  → 不做 `sc sdset` 授權：服務本身已設「當機自動重啟」，Tunnel 斷線多半要人看；少一個管理員步驟
- [x] **A5. 自動備份** → ✅ 2026-11-03 本機（D:，30 份）；✅ 2026-11-05 GitHub 加密備份啟用、還原實測通過
  → 細節見 CLAUDE.md「自動備份」。🙋 剩：
    1. GitHub 建**私有** repo `kbs0830_backup`（空的，不要勾 README）
    2. 該 repo Settings → Deploy keys 加 `C:\Users\user\.ssh\kbs0830_backup_deploy.pub`，**勾寫入權限**
    3. 把 `D:\Backups\kbs0830\BACKUP-KEY.txt` 的內容存進密碼管理器（整台機器壞掉時靠它解密）
    4. 跟 Claude 說，Claude 會 clone 到 `D:\Backups\kbs0830\github` 並實測一次
- [x] **A6. 履歷 PDF 自動重產** → ✅ 2026-11-03 完成（見 CLAUDE.md「/resume」）
  → 順便發現舊 PDF 從建立後就沒更新過、而且全是系統備用字體（沒等網頁字體載完），已修

### B. 新技術

- [x] **B1. 捲動淡入改用 CSS `animation-timeline: view()`** → ❌ 2026-11-03 評估後不採用
  → `view()` 是「捲到哪播到哪」（會跟著捲動倒退），跟設計原則的「gentle fade-in 一次」語意不同；
    Firefox 支援也還不穩。現在的 `useRevealOnce` 已經零 re-render，換了沒有實質好處
- [x] **B2. TypeScript 7 原生編譯器（tsgo）只用在型別檢查** → ❌ 2026-11-03 評估後不採用
  → 實測現在 `tsc --noEmit` 只要 2 秒，最多省 1.5 秒，不值得多一個別名套件、同時維護兩個 TS 版本

- [x] **B4. 自己做「Markdown for Agents」** → ✅ 2026-11-05 完成（見 CLAUDE.md「SEO」）。作品頁 HTML 155KB → Markdown 3.5KB
  → Cloudflare 這個功能要 Pro 方案；網站可以自己判斷 `Accept: text/markdown`，部落格直接回 `.mdx` 原文、
    作品／履歷頁轉成 Markdown，搭配 `/llms.txt`，AI 工具讀起來更省、更準。加分項，不是必要

已確認不用做：Turbopack build 快取（Next 16.4 已預設開啟）、PPR（見下方評估）。

### C. 2026-11-03 順手做完的精簡／修正
- 全站等寬字其實一直是 Consolas／細明體（`--font-mono` 指向沒載入的 JetBrains Mono），改回設計規範的 Geist Mono
- 網址／email／社群連結收斂到 `lib/site.ts`；頁首、小節標題、▸ 清單、狀態標籤、JSON-LD 收成共用元件
- `/uses` 更正「Framer Motion」（已移除）
- 驗證：sitemap、robots、JSON-LD 跟線上逐字相同；7 頁截圖 5 頁像素相同（其餘 2 頁是預期內的文字/間距）

---

## 🚨 2026-11-02 — 精簡重構＋一次 4 天的斷線（同一個分支 `upgrade/2026-10`）

### ⚙️ 已完成（第二輪）：Server Components 化
- 首頁四個 section 從 `"use client"` 改成 Server Component，只留小的 client island
  （見 CLAUDE.md「Server / Client 分工」）。`projects.ts` 的詳細頁長篇說明不再進首頁 bundle
  （實測 client chunk 裡 0 筆）
- About 技能 accordion → 原生 `<details>` + CSS `::details-content`／`interpolate-size`；
  時間軸展開 → CSS `:hover`/`:focus`，兩個都零 JS。**行為小變化**：時間軸以前點一下會
  固定展開、再點收起；現在是滑鼠移上去或 focus（觸控＝點一下）時展開、移開/點別處收起
- 67 處 inline `style={{ fontFamily }}` → `font-mono`/`font-serif` class
- 7 個獨立頁面重複的外框 → `<PageShell>`
- `src/` 這輪 −1004／+456 行；首頁 JS 傳輸量（三輪累計）桌機 454→408 KB、手機 225→170 KB（−24%）
- 🙋 待確認：時間軸的互動改成 hover/focus 你 OK 嗎？想要回到「點擊切換」的話，
  改成 `<details>` 就好（一樣零 JS，只是沒有 hover 展開）

### 🔴 先看這個：網站從 10/29 02:15 到 11/02 01:52 斷線約 4 天
- UptimeRobot 的 `HEAD /` 最後一筆是 10/29 02:10（台灣時間），之後 server 在 02:15／02:17
  重啟（看起來是桌機重開機），**`start-server.bat` 開的 console 版 cloudflared 沒人重開**，
  Tunnel 就一直斷著（訪客看到 Cloudflare 530）——就是 10-15 那段預言的「開機自動起站沒做到」
- 11/02 已手動在背景重開一個 cloudflared 恢復，但它掛在目前的登入 session 底下，
  **下次重開機一樣會斷**。真正的修法還是下面那條：系統管理員身分跑 `scripts\setup-autostart.ps1`
- ✅ 11/02 深夜已跑完 setup-autostart，Tunnel 改由 `Cloudflared` 服務承載（關掉背景 cloudflared
  後外網連打 12 次都 200）。剩「重開機不登入」的實測，見下方 setup-autostart 那條
- 🙋 確認 UptimeRobot 有沒有寄告警到 otemon.pcwork@gmail.com；4 天都沒人發現的話，
  要檢查 Alert Contact 設定
- ⚙️ 之後可以做：watchdog 加上 Tunnel 檢查（見下方「watchdog 加上 Tunnel 監控」），
  這次就是 origin 健康、Tunnel 死掉，watchdog 完全看不出來

### 🔴 Next.js 16.4.0 有已知安全漏洞
- `next build` 直接拒絕建置（`SecurityFatalError: Your version of Next.js is affected by a known
  security vulnerability`），分支已升到 **16.4.3**。正式站目前跑的是 main 的 16.3.1，build 時間
  早於這個檢查，**很可能也在受影響範圍**——這是這個分支要儘快 merge/部署的另一個理由
- ✅ 11/02 已部署，正式站跑 16.4.3。第一次 CI 部署因為「在正式站目錄直接 merge → pull 回報
  Already up to date → 跳過 pnpm install」build 失敗，`deploy.ps1` 已改成比對上次 install 的
  lockfile 雜湊（b18fbbe）

### ⚙️ 已完成：拿掉 framer-motion，動畫全部改成瀏覽器原生
- `src/` 14 個檔案 −824／+663 行；首頁 JS 傳輸量 桌機 454→428 KB、手機 225→191 KB（−15%）
- 6 份各自重寫的 `useInView + motion.div` → 一個 `<Reveal>`；AnimatePresence 彈窗 → 原生
  `<dialog>`（focus 管理、Esc、遮罩都由瀏覽器處理）；捲動進度條 → CSS scroll-driven animation；
  高度動畫 → `<Collapse>`（grid-rows）；細節見 CLAUDE.md「動畫架構」
- Hero 進場改純 CSS：不必等 hydration 才開始播，對 LCP（見下方「LCP 決策點」）是直接的改善，
  而且沒有改動動畫時間，不需要犧牲設計
- 4 處 `useEffect` 裡同步 setState + `eslint-disable` 的 matchMedia 寫法 → `useSyncExternalStore`
  （`lib/hooks.ts`）；HeroScene 的 `react-hooks/purity` disable 也拿掉了
- Magnetic 不再每次 mousemove 都 re-render；只對滑鼠生效（觸控拖曳不會亂跑）
- 順手修的既有 bug：
  1. **Hero 3D 背景一直只有 150px 高**（正式站現在也是）：R3F `<Canvas>` 的 inline style 蓋掉了
     `absolute inset-0`。修好之後背景會鋪滿整個 Hero——**畫面看起來會跟現在差很多**，這才是原本
     設計的樣子，上線後如果覺得線條太搶眼再調密度/透明度
  2. 手機第一次 render 其實會觸發 three.js chunk 下載（`isMobile` 初始值是 false）
  3. 列印時還沒捲到的區塊是透明的（opacity:0）
  4. 手機選單收合時，裡面的連結還是 Tab 得到（現在收合時 `inert`）
- E2E：加 `gotoReady()` 等 hydration 完成再操作，修掉「開 trace 就穩定失敗」的既有時機問題

---

## 🚨 2026-10-15 — 全站升級＋維運體檢（分支 `upgrade/2026-10`）

背景：使用者貼了 cloudflared log，要求「全面升級新技術、解決 Google 索引、Claude Code 遠端
session、開機自動起整個站、自動備份」。實際查下去發現 9 月文件寫「已修復」的兩件事
（72 小時被砍、www 404）其實都**沒有真的生效**。

### 當時要你動手的（已完成）

- [x] **在桌機用「系統管理員」PowerShell 跑一次 `scripts\setup-autostart.ps1`** 🔴 最優先
  → ✅ 2026-11-02 跑完並回查：NextJS／Runner `PT0S`+S4U、Watchdog S4U、Cloudflared 服務帶
    tunnel 參數。Runner 改 S4U 後第一次 CI 部署也正常接到。**還沒做：重開機不登入的實測**
  → 一次解決三件事，腳本跑完會自己印檢查結果：
    1. `kbs0830_NextJS`／`GitHubActionsRunner` 的 `ExecutionTimeLimit` 還是預設 `PT72H`
       （`schtasks /query /xml` 查到 Settings 裡根本沒有這個欄位）。10/07 21:31、10/10 21:36、
       10/13 21:41 整站跟 runner 一起被砍，都是 watchdog 5 分鐘後救回——每次晚 5 分鐘剛好是
       watchdog 間隔。9 月的 `Set-ScheduledTask` 推測是在非管理員視窗跑、失敗了沒人發現
       （這次我在一般權限重跑，確實是 `PermissionDenied 0x80070005`）
    2. **開機自動起站其實沒做到**：Windows 服務 `Cloudflared` 雖然 AUTO_START、RUNNING，但
       binPath 沒帶任何參數、LocalSystem 底下也沒有 config.yml，等於空轉；真正在扛流量的是
       `start-server.bat` 開的 console 版 cloudflared（metrics 20241 的 connectorId 跟那個視窗的
       log 對得上）。重開機後沒人登入點 bat → Tunnel 不通 → 整站掛
    3. `kbs0830_Watchdog`／`GitHubActionsRunner` 是 `InteractiveToken`（只在登入時跑），Runner
       觸發條件還是「登入時」→ 重開機沒登入的話，監控跟自動部署都不會動。改成 S4U
       （不論是否登入都執行、不用存密碼）＋開機觸發
  → 跑完之後：關掉 bat 開的 cloudflared 黑視窗；**找一天實際重開機一次、不登入**，用手機開
    https://kbs0830.com 確認站有起來，才算驗證完成
  → ⚠️ Runner 改成 S4U 之後沒有實際跑過一次部署驗證，第一次 push 後看一下 Actions 有沒有正常接到

- [x] **`www.kbs0830.com` 還是 404** 🔴（Google 索引問題的主因）
  → ✅ 2026-11-02 用 Rules 範本「Redirect from WWW to root」重建（Overview 頁沒有任何既有規則，
    之前那條從來沒存成功），`https://www.kbs0830.com/blog?x=1` → 301 保留路徑和 query。
    🙋 剩：Search Console 對該 issue 按「驗證修正」
  → 2026-10-15 實測 `curl https://www.kbs0830.com/` → `404`，而且是 Cloudflare 回的（沒有
    redirect）。CLAUDE.md 寫的 Redirect Rule 要嘛沒存成功、要嘛被停用了
  → Cloudflare Dashboard → kbs0830.com → Rules → Redirect Rules：確認那條規則存在且是
    **Enabled**；沒有就照 CLAUDE.md「部署架構」那段重建（filter `http.host eq "www.kbs0830.com"`、
    301、Dynamic `concat("https://kbs0830.com", http.request.uri.path)`、Preserve query string 打開）
  → 改完 `curl -sI https://www.kbs0830.com/` 應該看到 `301` + `location: https://kbs0830.com/`，
    再去 Search Console 對該 issue 按「驗證修正」

- [x] **桌機 GitHub push 認證**（`upgrade/2026-10` 分支要上線就卡這個）
  → ✅ 2026-11-02 你在桌機自己的 PowerShell 登入並 push 成功；但 Claude session 仍然不能 push，
    要整圈自動化見最上方 A1
  → 桌機 GCM 沒有 GitHub 帳號，只能 pull。需要你遠端桌面進桌機，在本機終端機跑一次
    `git push`（會跳 GCM 登入視窗），或改用 SSH key / fine-grained PAT

### ⚙️ 分支 `upgrade/2026-10` 完成的（11/02 已上線）

- [x] **套件全面升級**：Next 16.3.1→16.4.0、React 19.2.4→19.3.0、framer-motion 12→14、
  Mermaid 11→12、three 0.184→0.186、R3F 9.6→9.8、Tailwind 4.3.3、ESLint 9→10、
  Vitest 4→5、Playwright 1.64、TypeScript 5.9→**6.0**（見下方 TS 7 說明）
  → `tsc`／`eslint`／`vitest`（16/16）／`next build`／Playwright（12/12，連跑 4 次）全過
- [x] **View Transitions（React 19.3 原生 `<ViewTransition>`）**：作品卡片點進詳細頁時，
  標題跟縮圖會 morph 過去；詳細頁其餘內容 fade + slide-up。`template.tsx` 從 framer
  `motion.div` 改成 `<ViewTransition enter="page-enter">`（framer 的 `opacity:0` 起始
  狀態會讓瀏覽器拍到透明快照、跟 morph 打架）。時間沿用原本 0.45s 跟同一條 easing；
  `prefers-reduced-motion` 也關掉了 view transition 偽元素的動畫。不支援的瀏覽器照常
  換頁、只是沒動畫。新增 `e2e/project-detail.spec.ts` 確認換頁後標題可見
- [x] **React Compiler**（`reactCompiler: true` + `babel-plugin-react-compiler`）
  → 副作用：dev 模式第一次編譯變慢，原本 Playwright 預設開 10 個 worker 打同一個
    dev server 開始隨機失敗（production build 平行跑完全穩定，不是行為壞掉）。
    `playwright.config.ts` 設 `workers: 3`；Konami 測試原本只留 0.3 秒緩衝
    （元件 3.7 秒才消失、測試等 4 秒），放寬到 6 秒
- [x] **sitemap**：補上漏掉的 `/resume`；拿掉每次 build 都變成「現在」的假
  `lastModified`（只留 blog 文章的真實日期）——Google 判定 lastmod 不可信會整份忽略

### 後續（已完成）

- [x] **自動備份** → ✅ 見最上方 A5
  → 不在 git 裡、壞了會真的不見的東西：`.env.local`（Spotify token）、
    `data/visitor-stats.json`、`~/.cloudflared/`（tunnel 憑證，遺失要重建 tunnel）、
    `logs/`。候選：每天複製到另一顆硬碟／Google Drive 桌面版同步資料夾，保留最近 N 份
  → ⚠️ tunnel 憑證 json 等同 tunnel 的密碼，備份位置不能是公開或共享的地方
- [x] **watchdog 加上 Tunnel 監控** → ✅ 見最上方 A4
  → 目前 watchdog 只看 localhost:3000 跟 runner；Tunnel 掛了它看不出來（origin 健康）。
    可以加：`Get-Service Cloudflared` 不是 Running 就 `Start-Service`，或打
    `http://127.0.0.1:20241/ready` 看 `readyConnections`

---

## 📋 外部回饋對照（2026-07 Portfolio review 5 痛點，當時的現況）

| # | 回饋 | 現況 | 對應待辦 |
|---|---|---|---|
| 1 | 定位聚焦，不要泛泛的「學生開發者」 | Hero 副標與 `<title>`/OG 都是「学生開発者 · Claude × Gemini」 | 🔴 定位聚焦 |
| 2 | 專案寫量化成果，不要只列功能 | 只有 FoodLens 有（token 成本 ~300–1000×），其餘多是功能描述 | 🔴 專案量化成果 |
| 3 | 技術棧分類＋標熟練度 | **已完成大半**：5 組分類 accordion＋每個 chip 有 1–5 圓點熟練度，缺文字圖例說明圓點意義 | 🟠 熟練度圖例 |
| 4 | 每個專案附 GitHub 連結＋commit 乾淨 | 7 個作品 5 個有連結；FRC／自動跟隨機器人是實體硬體無 repo（詳細頁已註明） | 🟠 GitHub repo 品質 |
| 5 | RWD 不能跑位＋優化載入效能 | **2026-07-25 體檢完成**：全站 16 頁 × 4 斷點（360/390/768/1024）0 個跑版/橫向捲動；手機 Lighthouse Performance 74（跟桌機幾乎一致），A11y/BP/SEO 皆 100 | 🟠 LCP 決策點（沿用既有分析，這次用真實手機數據確認） |

---

## 🔴 高優先（已完成的）

- [x] **RWD 手機版全面體檢＋行動版 Lighthouse（回饋 #5）**——2026-07-25 完成
  → Playwright 對全站 16 個頁面（首頁、`/projects/[slug]`×7、`/blog` 列表＋3 篇文章、
    `/now`、`/uses`、`/resume`、404）在 360／390／768／1024 四個斷點各跑一次，共 64 組：
    **0 個橫向捲動／跑版**，`scrollWidth` 在所有組合下都沒超出 `clientWidth`
  → 順手抓到並修掉兩個真的問題（不是 RWD 本身，但體檢過程中發現）：
    1. 每一頁在每個斷點都有 React hydration mismatch console warning（`data-theme` 屬性）
       ——原因是 `layout.tsx` 的深色模式 inline script 在 hydration 前就直接改了
       `<html data-theme>`，這是文件裡明講的既有設計，只是少加了 `suppressHydrationWarning`；
       補上後 warning 全部消失，不影響任何行為
    2. 全站「← 返回OO」、GitHub repo 連結這類文字連結，實際可點擊高度只有 12–18px
       （在手機上偏難點準），加 `py-3 -my-3`（或 wrapper + `py-2 -my-2`）撐開點擊區域，
       不影響視覺間距
  → Lighthouse **mobile** 模式（之前只跑過桌機）：Performance 74（跟桌機幾乎打平，LCP
    6.8s vs 桌機 6.9s，根因跟桌機版記錄的一樣：Hero fade-in 動畫 delay + 102KB
    render-blocking CSS，見下面「LCP 決策點」）、**Accessibility 100 / Best Practices 100
    / SEO 100**，跟桌機版一致，代表之前的 WCAG 對比度修復在手機視窗下同樣有效
  → 還剩幾個非緊急的小 touch target（都在 WCAG 2.2 AA 的 24×24px 底線之上，只是沒到
    44×44 理想值），設計上是刻意的小圖示/文字連結，不擅自改視覺，列給你參考：
    ~~NavBar 深色模式切換鈕／漢堡選單（32×32）~~（2026-11-04 已改：點擊範圍 40×44，外觀與版面
    像素不變，用負 margin 抵銷）、Portfolio「全部」篩選 chip（88×27）、
    About 時間軸項目點擊區（~37px 高）、Skills 分類 accordion 按鈕（~34px 高）
  → 縮圖 `sizes` 設定沒發現手機多抓桌機尺寸圖的問題，`next/image` 預設行為已經在處理

- [x] **GitHub Actions self-hosted runner 監控空缺**——2026-08-24 已實作，見下方
  「已完成」區塊

- [x] **Google Search Console 註冊＋提交 sitemap（SEO 起手式）** → ✅ 早已註冊（網域資源 `sc-domain:kbs0830.com`），2026-11-05 健檢見最上方
  → 目前完全不知道 Google 收錄了哪些頁、什麼關鍵字搜得到；GSC 是後續所有 SEO 動作的儀表板
  → 步驟：用 1394kbs@gmail.com 到 https://search.google.com/search-console 新增資源
    `kbs0830.com`（選 DNS 驗證，去 Cloudflare 加一筆 TXT 記錄即可）→ 提交
    `https://kbs0830.com/sitemap.xml`
  → 你註冊完之後我能接手的：查索引狀態、找出沒被收錄的頁面、看實際進站關鍵字再回頭調 metadata

**Demo 連結欄位已移除（2026-07 使用者確認「沒東西」）**：查過 YARTIX 的 `render.yaml`
沒有還活著的公開網址，而且是處理過真人報名/付款資料的系統本來就不該公開連過去；
FoodLens README 也沒提到 live demo。目前沒有安全可用的真實連結可以填，之後如果有新專案
有 live demo 再個別加，不留在這裡當常駐待辦。

---

## 🟠 中優先（已完成的）

- [x] **技術棧熟練度文字圖例（回饋 #3 收尾）**——已完成，見下方「已完成」區塊
  （`AboutSection.tsx` 的 `ProficiencyDots` + 文字圖例）

- [x] **SEO 結構化資料擴充**——已完成，見下方「已完成」區塊
  （`/blog/[slug]` BlogPosting JSON-LD、`/projects/[slug]` BreadcrumbList JSON-LD）
  → 還沒做的收尾：GSC 註冊完後可用「複合式搜尋結果測試」驗證有沒有被吃到（卡在下面
    「Google Search Console 註冊」那項，需要你的 Google 帳號）

- [x] **部署通知** → ✅ 2026-11-05 生效，見最上方 A2
  CI/CD 成功／失敗時發 Discord Webhook 或 LINE Notify，或直接寄 Email
  → 目前不知道遠端 build 有沒有炸
  → 若採 Email 通知，收件位址同上用 `otemon.pcwork@gmail.com`

- [x] **零停機部署** → ✅ 大致解決，見最上方 A3（剩重啟那 1～2 秒）
  → 2026-07 log 分析發現：20 次部署裡有 2 次在 Task Scheduler 重啟的瞬間交接空窗
    撞上少量請求，共 4 筆 500（占全部請求 0.02%），`verify-deploy.ps1` 每次都在
    重啟後立刻確認恢復正常，影響範圍很小
  → 目前架構（單一 process 給 Task Scheduler 直接管理）本來就無法完全避免這個
    空窗，要做到零停機需要雙 process 交替之類的架構改動，複雜度是否值得由你評估，
    詳見 `docs/archive/2026-07-LOG分析.md` 第 3 節

---

## 🧪 新技術升級評估（已完成／評估不做）

- [x] **View Transitions**——2026-10-15 在 `upgrade/2026-10` 完成（React 19.3 起 `<ViewTransition>`
  已是穩定 API，不需要 experimental flag），細節見最上方 2026-10-15 區塊
  → 還沒做：手動在 Safari／Firefox 實際點一次看效果（官方註明 Safari 可能有差異）
- [x] **React Compiler**——2026-10-15 在 `upgrade/2026-10` 開啟，R3F 場景／E2E 全過
  → 還沒做：既有的手寫 `useMemo`/`useCallback` 理論上可以拿掉，但沒有效能問題，不急著動
- [x] **Partial Prerendering（PPR）— 評估後不採用**（記錄結論免得之後重查）
  → 本站頁面幾乎全部 SSG，只有 2 個 API route 是動態的，沒有「靜態殼＋動態洞」的頁面
    形態，PPR 沒有適用場景

---

## ✅ 2026-07～08 已完成

- [x] **2026-08-24：GitHub Actions self-hosted runner 存活監控**
  → 背景：2026-07-25 曾發現 `GitHubActionsRunner` 這個工作排程器任務顯示 `Ready`，但
    實際接工作的 `Runner.Listener.exe` 進程已經無聲掛掉，`push` 到 main 都不會觸發
    自動部署，是手動查 GitHub Actions 頁面卡在 `queued` 才發現
  → 併進現有 `scripts/watchdog.ps1`，跟網站健康檢查共用同一個 `kbs0830_Watchdog`
    5 分鐘排程，不另開新的 Task Scheduler 任務：每次執行順便 `Get-Process -Name
    Runner.Listener` 確認進程還在，沒偵測到就 `Stop-ScheduledTask`/`Start-ScheduledTask`
    重啟 `GitHubActionsRunner`，5 秒後再確認一次；一樣只在異常/重啟/恢復時寫
    `logs/watchdog.log`，健康時不寫
  → 網站檢查跟 runner 檢查各自獨立判斷，互不影響對方要不要重啟，只共用最終的
    `$exitCode`
  → PowerShell parser 語法檢查過（`[System.Management.Automation.Language.Parser]::
    ParseFile`）沒有錯誤，BOM 編碼確認保留（`efbbbf` 開頭，避免 PowerShell 5.1 用
    Big5 讀檔炸掉，見上方「PowerShell script 編碼注意事項」），也現場確認過這台機器上
    `Runner.Listener` 進程名稱、`GitHubActionsRunner` 工作排程器任務名稱都對得上
    （目前 runner 正常在跑，沒有觸發過重啟邏輯，還沒有真的異常情境驗證過重啟路徑）

- [x] **2026-08-24：重複程式碼收斂（Eyebrow / TagBadge）**
  → 派 agent 掃過 `src/components/`、`src/app/` 找逐字重複的 UI 標記（`statusColor`／
    GitHub·Moon·Sun icon 這幾組先前已經收斂過，見 `icons.tsx`／`projects.ts`），找到兩組
    還沒處理的：
    1. 標題上方的小標籤（mono 字體、寬字距、uppercase，例：`About`／`Blog`／`404`／
       `技能 · Skills`）在 9 個檔案共 13 處逐字重複，只有外層 margin class 不同
       → 抽成 `src/components/ui/Eyebrow.tsx`，接受 `className` 覆蓋 margin
    2. tag/skill 徽章 `<span>` 樣式在 4 個檔案逐字重複
       → 抽成 `src/components/ui/TagBadge.tsx`
    改動的檔案：`blog/page.tsx`、`blog/[slug]/page.tsx`、`uses/page.tsx`、`now/page.tsx`、
    `not-found.tsx`、`MaintenancePage.tsx`、`projects/[slug]/page.tsx`、
    `PortfolioSection.tsx`、`ContactSection.tsx`、`AboutSection.tsx`；純重構、行為沒變，
    `tsc --noEmit`／eslint／`next build`／`pnpm test:unit`／`pnpm test:e2e` 全部跑過確認
    （e2e 裡 `keyboard-shortcuts.spec.ts` 的 1/2/3 跳轉那條第一次平行跑時因為 viewport
    timing 花了超過 5 秒判定失敗，單獨重跑秒過，是既有的 flaky 案例，跟這次改動無關，
    這次沒動任何 scroll/id 邏輯）
  → **這次探索過程中額外發現、判斷不值得現在動的近似重複**（記錄下來，不是遺漏）：
    - `AboutSection.tsx` 內部的技能/城市 pill 徽章樣式在同一檔案出現 3-4 次近似（不完全
      相同，有 dashed border 變體），同檔案內重複、風險較低，先不動
    - `HeroSection.tsx` inline 重寫了 `ContactSection.tsx` 裡已經抽出來的 `Underline`／
      `linkClass` 底線 hover 效果，兩處目前各自維護；要真的共用需要把這兩個從
      `ContactSection.tsx` 搬到 `components/ui/`，屬於中風險、要判斷值不值得的改動
    - `RevealHeading.tsx`／`FadeIn`（AboutSection）／`TimelineItem`／`ProjectCard`／
      `SectionLabel`（PortfolioSection）／ContactSection 都各自重新實作一份
      `useInView + motion.div` 淡入包裝，margin/delay/位移量都不同，屬於「相似但不同參數」
      而非逐字重複，硬收斂成單一 `useFadeInView` 需要吞掉這些差異，先不做
    這三項如果之後要處理，屬於「要判斷、可能改變一點寫法」的中風險重構，不是這次
    「逐字重複、零風險」的範圍，需要你評估要不要花時間

- [x] **2026-07-25：技術棧熟練度圖例 ＋ SEO 結構化資料擴充 ＋ RWD 手機體檢**（見上面回饋
  對照表跟各自條目的詳細記錄，這裡只記重點）
  → Skills 區塊加文字圖例（`●●●●● 熟練 Proficient` / `●●○○○ 学習中 Learning`），
    復用既有的 `ProficiencyDots` 元件，不是重做一套
  → `/blog/[slug]` 加 BlogPosting JSON-LD、`/projects/[slug]` 加 BreadcrumbList JSON-LD
  → **這次順手做的動作比原本規劃的大**：跑 RWD 體檢時你在中途提醒 YARTIX 去識別化沒做完
    （見下一條），修完後為了讓行動版 Lighthouse 反映當天所有改動，跑了一次
    `next build` 並用 Task Scheduler 安全重啟正式站對齊——代表這次 session 修的東西
    （去識別化、hydration warning、touch target、SEO 結構化資料等）現在已經是
    **kbs0830.com 正式站在跑的版本**，但這些改動目前只存在於工作目錄，**還沒 git commit
    也沒 push**。正式站的程式碼跟 GitHub main branch 目前不同步，之後任何一次
    `git push` 到 main 觸發的 CI/CD 都會用 repo 裡的版本覆蓋掉現在正式站跑的這份——
    內容相同所以不會變差，但如果你打算先手動改點別的東西再 commit，要注意目前線上
    跑的已經是超前 git 一個版本的狀態，建議儘快 commit + push 讓兩邊對齊
- [x] YARTIX 去識別化 & 改名為「購票系統」
  → **2026-07-25 補追：原本只做了一半。** `titleZh`／`descriptionZh` 早就改成「購票系統」，
    但英文 `title` 欄位（`"YARTIX Ticketing"`）跟詳細頁 intro 文字裡的真實客戶名稱
    「台灣鐵道文化意象 TWRIC」其實一直還在，會顯示在作品卡片副標題、詳細頁副標題、
    分頁 `<title>` 標籤／SEO metadata 上——這次全部清乾淨，同時把 URL slug
    `yartix-ticketing` → `ticketing-system`、圖片檔名 `yartix.png` →
    `ticketing-system.png`，`next.config.ts` 加 301/308 redirect 保留舊網址（避免已收錄的
    舊網址直接變 404）
  → **2026-07-26 補：詳細頁的連結文字已改成「原始碼 · Source Code」**（`src/app/projects/
    [slug]/page.tsx`），不再把 `project.github.replace("https://", "")` 這種會直接印出
    repo 完整路徑的寫法當連結文字——不管 repo 實際叫什麼名字，畫面上都不會顯示
  → **2026-07-26 再補：使用者要求進一步去識別化。**
    1. `github` 欄位暫時清空（`""`）——卡片跟詳細頁的 GitHub 按鈕在 repo 改名前直接不顯示，
       徹底不留 href 可以 hover／複製連結看到舊 repo 名稱這條路
    2. 移除卡片縮圖與詳細頁截圖（`image` 欄位拿掉，`public/image/projects/
       ticketing-system.png` 已刪除）
    3. 顯示名稱從「購票系統 / Ticketing Platform」改成更中性的「活動報名系統 /
       Event Registration System」（`titleJa` 同步改成「イベント受付システム」），
       不再直接對應原產品「Ticketing」的命名
  → **還沒做完，需要你動手（我這台機器沒裝 `gh` CLI，且這是外部系統，不會自己動）**：
    GitHub repo `kbs0830/YARTIX-TICKETING-TEST` 這個名稱本身還在。到 repo → Settings →
    改名（不要用專案代號類名稱，用純技術性描述，例如 `flask-registration-api` 這類），
    GitHub 會自動幫舊網址做 redirect，不用擔心壞連結，改完告訴我新名稱，我把
    `src/lib/projects.ts` 的 `github` 欄位填回去，GitHub 按鈕才會重新出現
- [x] 麵包店電商網站移除
- [x] FRC 機器人加入作品集（2023 全國冠軍聯盟）
- [x] 時間軸加入 About（2021–2026）
- [x] 頭像 `public/image/大頭貼.jpg`
- [x] Hero 副標題 → `学生開発者 · Claude × Gemini`
- [x] 狀態卡：大二、交通運輸興趣、開発環境
- [x] 社群：Facebook + Instagram
- [x] Contact 按鈕版型統一（4 顆同尺寸）
- [x] 自動跟隨機器人加入作品集（2024 全國佳作）
- [x] SEO meta tags 更新
- [x] 技能補充：Jetson Nano、Raspberry Pi、OpenCV、Arduino
- [x] Footer `© 2026 PINGWEI LI`
- [x] 響應式優化（Hero CTA 堆疊、section padding）
- [x] NavBar active section 高亮（IntersectionObserver）
- [x] NavBar 行動端漢堡選單（drawer 展開）
- [x] Scroll progress bar（頂端 2px accent 細線）
- [x] 3D 場景行動端停用（< 768px 改顯示 CSS 漸層）
- [x] Hero 初始閃白修正（dynamic loading fallback）
- [x] 返回頂端按鈕（BackToTop）
- [x] OG 社群預覽圖（opengraph-image.tsx 動態生成）
- [x] HeroScene 效能修正（useMemo）
- [x] ProjectCard hover lift（hover:-translate-y-1）
- [x] 時間軸 dot 依序出現（per-item stagger animation）
- [x] Skills tag hover（hover accent border + text）
- [x] Favicon 自訂（icon.tsx，PL 靛藍）
- [x] prefers-reduced-motion 支援（globals.css）
- [x] 鍵盤 focus-visible 樣式（globals.css）
- [x] Email 複製回饋（clipboard + 已複製！toast）
- [x] 暗色模式（CSS variable + localStorage toggle）
- [x] icon.tsx + opengraph-image.tsx + BackToTop 從舊分支移植
- [x] 刪除舊分支（master、fix/layout-width-og-image）
- [x] About section 加入「足跡 · Footprint」— 已到訪國家（日本／泰國／香港／美國）與規劃中（韓國／新加坡／馬來西亞／越南）
- [x] 自訂 404 頁面（`not-found.tsx`，日式風格，帶回首頁按鈕）
- [x] Security Headers（`next.config.ts` 加 X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy）
- [x] favicon.ico 清除（改用 icon.tsx，擴充 32/192/512 三種尺寸）
- [x] Error Boundary for R3F（HeroScene 加 SceneErrorBoundary，WebGL 崩潰時 fallback 到 CSS 漸層）
- [x] Twitter / X Card meta tag（layout.tsx metadata）
- [x] 專案 Tag 篩選（Portfolio section filter bar）
- [x] Hero 副標動態打字效果（Framer Motion staggerChildren typewriter）
- [x] Hero 3D 場景互動（隨游標位置微微傾斜，尊重 prefers-reduced-motion）
- [x] Skills 分類可展開 / 收合（accordion，預設展開第一組）
- [x] About 時間軸 hover 展開更多細節（含鍵盤 Enter/Space）
- [x] Skills 熟練度視覺化（1–5 點細小圓點指示）
- [x] Print / PDF 樣式（`@media print`，A4 履歷格式）
- [x] 頁面 Loading 骨架屏（呼應 Hero 3D 場景的稀疏細線骨架屏）
- [x] Scroll-triggered 文字逐字揭示（About / Portfolio / Contact 標題）
- [x] 磁吸按鈕效果（Magnetic Button，Hero CTA + Contact 連結）
- [x] 自訂滾動條樣式（Firefox scrollbar-color / scrollbar-width）
- [x] PWA Manifest（`src/app/manifest.ts`）
- [x] `/now` 頁面
- [x] `/uses` 頁面
- [x] GitHub 貢獻熱力圖（ghchart.rshah.org 嵌入）
- [x] Keyboard Shortcuts（G / E / 1-2-3 快速跳轉，`?` 呼出提示浮窗）
- [x] 彩蛋：Konami Code（↑↑↓↓←→←→BA 觸發全螢幕彩蛋）
- [x] 彩蛋：終端機模式（`` ` `` 叫出偽終端機）
- [x] 時區 / 現地時間顯示（Footer 高雄 + 福岡雙時區，每 30 秒更新）
- [x] Spotify 正在聽（SpotifyNowPlaying 元件 + `/api/spotify/now-playing` route，Client Secret + refresh token 已補齊）
- [x] Husky + lint-staged（commit 前自動跑 lint-staged `eslint --fix` + 全專案 `tsc --noEmit`）
- [x] Renovate Bot（`.github/workflows/renovate.yml`，用現有 self-hosted runner 跑 Renovate CLI，
  不需安裝 GitHub App，每週一自動開 PR，不自動合併）
- [x] 訪客來源統計小工具（Footer，自己刻的，不用 Clustrmaps：讀 Cloudflare Tunnel 自動帶的
  `cf-ipcountry` header，只聚合國家層級次數存 `data/visitor-stats.json`，不記 IP；
  `/api/visitor-stats` 吐彙總資料，`VisitorStats.tsx` 顯示「共 N 次造訪 · 來自 M 國 + 前 5 名國旗」）
- [x] LOG 分析（見 `docs/archive/2026-07-LOG分析.md`）：10 天 log 顯示應用層 0 錯誤、20 次部署全成功；發現並修好
  訪客統計被偽裝瀏覽器 UA 的掃描器污染的問題（改成前端執行 JS 後才 POST 回報計數，
  不執行 JS 的掃描器從根本上排除，不再只靠容易被繞過的 UA 黑名單）
  → 順帶一提：`/api/visitor-stats/route.ts` 的 Turbopack NFT over-trace build 警告當時
    以為修好了，後來加了 POST handler（多了 `fs.readFileSync`/`writeFileSync`/`mkdirSync`）
    warning 又跑出來，`turbopackIgnore` 註解只蓋到那一行 `path.join`，沒有全面解決；
    不影響這個專案的部署方式（沒用 `output: standalone`），純粹是 build log 裡的雜訊，
    先不繼續花時間
- [x] 專案詳細頁 `/projects/[slug]`（App Router 動態路由，`generateStaticParams` 全站
  7 個作品都 SSG 出獨立頁面）——內容來自實際 clone `kbs0830/school`、
  `kbs0830/FoodLens-Advisor`、`kbs0830/YARTIX-TICKETING-TEST` 三個 repo 讀到的真實
  README/原始碼，不是編造的；FRC 機器人／自動跟隨機器人沒有原始碼倉庫（實體硬體專案），
  詳細頁維持原本卡片上就有的內容，沒有虛構新細節。YARTIX 附真實截圖（`www.png`）。
  卡片改成整張可點擊（overlay `<Link>` + GitHub icon 保留獨立可點）
  → 開發時抓到一個真的會讓「每一個」slug（包括合法的）都變成 404 的 bug：Next 16 的
    `params` 是 `Promise`，一開始沒 `await` 就直接讀 `.slug`，SSG 出來的每一頁
    `.meta` 都寫著 `"status": 404`，本機沒有真的用瀏覽器點過去測絕對不會發現——
    純打字檢查跟 `next build` 的 TypeScript 檢查都沒抓到這個，是實際 `curl` 每個
    路徑確認 200 才抓到的
- [x] 404 頁面排版統一（跟 `/uses`、`/now`、`/projects/[slug]` 這幾個 standalone page
  共用同一套排版：左上角「← 返回首頁」小連結、mono 標籤、serif 標題，不再是整頁垂直
  置中＋一顆突兀的實心大按鈕）——用 Playwright 實際跑 production build 截圖（亮/暗、
  桌機/手機）比對過，不是只看程式碼猜
- [x] Bundle Analyzer（`pnpm analyze`）
  → 一開始裝了 `@next/bundle-analyzer`，結果它官方明講不支援 Turbopack（這專案 build
    預設就是走 Turbopack），只會印警告、不產生報表，裝了等於沒用，已經移除。改用
    Next 16 內建的 `next experimental-analyze`（互動式 treemap，預設 port 4000）
  → 最大的 chunk 確實是 Three.js + @react-three（884KB，第二名的兩倍多），但已經是
    `HeroSection.tsx` 用 `next/dynamic({ssr:false})` 動態載入、手機版完全不載入的
    狀態，不是沒做過優化；試過把 `HeroScene.tsx` 的 `import * as THREE` 改成具名
    import（只引入實際用到的 7 個 class），重新 build 比對位元組數完全沒變化——
    Turbopack 對這個套件的 tree-shaking 已經做得夠好，具名 import 沒有實際幫助，
    只是保留下來當比較好的寫法。這顆 chunk 的大小本質上就是「用 R3F 做 3D 背景」
    這個決定要付的成本，已經是目前架構下能做的最大程度延遲載入，要再更小需要換掉
    R3F（大改，不在這次範圍內）
- [x] 頁面切換動畫（`src/app/projects/[slug]/template.tsx`，進入詳細頁 fade + slide-up）
  → App Router 沒有原生穩定支援退場動畫的方式（`AnimatePresence` 要保留舊畫面到動畫
    結束才卸載，跟 App Router 的導覽模型會打架），只做進場動畫，沒做 TODO 原本寫的
    「退場」那半段
- [x] Lighthouse 全站跑一次（`npx lighthouse`，production build，桌機模式）
  → 修之前：Performance 74 / Accessibility 96 / Best Practices 100 / SEO 100
  → 修之後：Performance 74（原因見下，故意先不動）/ **Accessibility 100**
    / Best Practices 100 / SEO 100
  → 真的抓到並修好 3 個 WCAG AA 對比度不足的問題：
    1. `LocalClock.tsx`／`VisitorStats.tsx`（Footer）用 `text-(--border)` 當文字顏色——
       `--border` 是設計給邊框線用的極低對比色，拿來當文字對比度只有 1.37:1（需要
       4.5:1），暗色模式下幾乎看不見，改成 `text-(--muted)`
    2. Portfolio tag 篩選 active 狀態在暗色模式對比度 4.32:1，差一點點沒過 4.5:1，
       把 `globals.css` 暗色模式的 `--accent` 從 `#5b8fc7` 微調到 `#6295cc`（色差小到
       肉眼幾乎看不出來，只有這一個 token，改動範圍最小）
    3. GitHub 熱力圖 `<img>` 沒有 `width`/`height`，補上（663×104，實際查 SVG 回應
       header 取得的真實尺寸），順便加 `h-auto` 維持比例
  → Performance 沒動的原因（決策點，等你回覆）：LCP 量到 6.9s、分數只有 0.07，
    細查 `lcp-breakdown-insight` 抓到 LCP 元素是 Hero 副標下面那段英文介紹文字，
    「element render delay」高達 1.75s——直接原因是 Hero 那組 `fadeUp` 進場動畫
    本身的 `delay`(0.1~0.6s 不等) + `duration`(0.8s)，這段文字要等動畫播完才算
    「視覺上完成渲染」，跟 CLAUDE.md 設計原則明講的「gentle fade-in」是同一件事的
    兩面；另外還有一個 102KB 的全域 CSS 檔案是 render-blocking，量到浪費 1.5s，
    這是 Tailwind 把全站（含終端機彩蛋、Konami 彩蛋、列印樣式等）所有用到的
    utility class 都打包進同一個透過 root layout 載入的 `globals.css` 的架構性代價，
    要拆分需要更大幅度的 CSS 架構調整。這兩個都不是我想在沒問過你之前就動的東西——
    前者要削弱你已經明確要的動畫效果，後者是牽動全站的架構改動，都先停在這裡等你
    決定要不要犧牲設計/花更大力氣換 Performance 分數
- [x] Uptime 監控（使用者自己申請 UptimeRobot 帳號完成，每 5 分鐘檢查
  `https://kbs0830.com`）——這步驟需要外部帳號，我沒辦法代辦，是使用者自己完成的
  → 記得確認 Alert Contact 收件信箱設成 `otemon.pcwork@gmail.com`（自動通知專用），
    不是 `1394kbs@gmail.com`（真人聯絡用），我這邊看不到帳號設定沒辦法直接確認
- [x] Playwright E2E 測試（`e2e/*.spec.ts`，`pnpm test:e2e`）——測了 NavBar 捲動變色、
  NavBar 錨點連結、Email 複製 toast、暗色模式切換＋重新整理後記住選擇，4 個測試，
  本機跑過 dev/production build 都過。開發時有一個測試（捲動變色）用完整套件平行跑
  會偶發失敗、單獨跑不會，改用 `window.scrollTo` 取代 `mouse.wheel` 後穩定重跑 3 次
  都過，不是邏輯錯誤只是事件模擬時機的問題
  → CI 沒有塞進 `deploy.yml`（那是已經很小心調過的正式站部署關鍵路徑），另外開一個
    `.github/workflows/e2e.yml` 平行跑，測試結果只是給你看的訊號，失敗不會擋掉部署
  → ⚠️ 副作用記錄：這次為了測這個跟前面 Lighthouse/Bundle Analyzer，在這個資料夾
    （就是正式站 Task Scheduler 服務在跑的同一份）反覆執行了好幾次 `next build`，
    中間有一次跟正在跑的正式站 process 的 build 對不上，watchdog 在 11:31 抓到
    一次 chunk 500（4 秒內自動重啟恢復，訪客應該沒感覺到），細節見
    `logs/watchdog.log`。以後這種需要反覆本機 build 測試的工作，要嘛做完馬上重啟
    正式站對齊，要嘛換一份獨立目錄跑，不要讓正式站在同一份目錄上跟著我的測試 build
    一起震盪
- [x] 作品卡片縮圖顯示 + FRC 機器人真實照片（`frc-robot.jpg`，使用者提供的 5 張裡只選了
  沒拍到人臉的機體照）
- [x] 專案架構圖（簡單版）：`src/components/ui/MermaidDiagram.tsx`（動態 import mermaid，
  不拖慢其他頁面），4 個有真實詳細資料的作品（FoodLens、活動報名系統、日圓匯率、記帳系統）
  各加一張 Mermaid flowchart，內容整理自已經寫好的 `detail.sections`，不是新編的細節。
  FRC／自動跟隨機器人／school 沒有足夠真實架構資訊可畫，沒有加
  → **2026-07-26 補：自動跟隨機器人也補上了**——使用者提供了實際參賽的競賽作品說明書
    PDF，裡面有完整的辨識/控制流程圖與硬體規格，不再是「沒有足夠真實資訊」的狀態，
    已經照說明書內容加上 `architectureDiagram`。FRC／school 依然沒有足夠真實架構資訊，
    維持不加
- [x] 技術部落格 `/blog`（`next-mdx-remote/rsc` + `gray-matter`，`content/blog/*.mdx`）——
  3 篇文章，內容是這次 session 真的踩過的坑：Next.js `params` 變 `Promise` 的 404 陷阱、
  訪客統計被機器人污染的除錯過程、Lighthouse 抓到的 3 個 WCAG 對比度問題，不是編造內容。
  Footer 加一個不顯眼的 `Blog` 連結（`/now`、`/uses` 至今都沒有站內連結能點到，這次
  額外幫 blog 加一個，因為 TODO 原本寫的動機是 SEO，完全沒人連得到會浪費這個動機）
- [x] 履歷 PDF 下載：`/resume` 頁面（教育／技能／作品，全部取自網站上已有的真實資料，
  沒有新編造任何經歷），`scripts/generate-resume-pdf.js` 用 Playwright 印成
  `public/resume.pdf`（A4，套用 `@media print` 樣式），Contact section 加下載按鈕。
  內容之後如果改了（教育、技能、作品異動）要記得重跑 `pnpm resume:pdf` 更新 PDF，
  不會自動同步
