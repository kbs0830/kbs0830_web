---
name: kbs-site
description: kbs0830_web 各頁面與區塊的設計紀錄全文：NavBar／Footer／彩蛋、Hero（3D、WebGPU、流星）、About、作品集、Contact、/blog、/changelog、/status、/colophon、/api/v1 與 /mcp、/developers、/airports、/resume，以及完整專案目錄結構。要改或新增任何頁面、區塊、元件，或找某個功能的檔案在哪時先讀。
---

## Site Sections

### 0. 全站共用（NavBar / Footer / 彩蛋）
- **NavBar**：固定導覽列，scroll 後半透明，`自己紹介` / `製作物` / `連絡先` 三個日文漢字錨點，
  IntersectionObserver 高亮目前 active section，行動端漢堡選單（drawer），深色模式切換
  （見上方「深色模式」章節）
- **Scroll progress bar**：頂端 2px accent 細線
- **手機閱讀（2026-11-05）**：作品篩選列在手機是一列橫向滑動（`.filter-scroll`，邊緣淡出）；作品卡片手機只顯示
  中文說明（英文 `hidden sm:block`，詳細頁仍完整）；文章／作品詳細頁／清單內文手機 15px、行距 1.8～1.9；
  文章程式碼區塊手機貼齊螢幕邊；獨立頁面（PageShell）有閱讀進度條；文章顯示估計閱讀時間（`blog.ts` 的 `readingMinutes`）
- **Footer**：`© 2026 PINGWEI LI` ＋ `BuildInfo`（「最後更新」＝build 時 HEAD 的 commit 時間，台灣時間到分鐘；`next.config.ts` 的 `env` 寫死，零 JS。版本號 2026-11-05 依使用者要求先拿掉）＋ `LocalClock`（高雄／福岡雙時區現地時間，每 30 秒更新；2026-11-22 加天氣「晴 23°」：`/api/weather` → `lib/weather.ts`，Open-Meteo 30 分鐘抓一次，讀不到只顯示時間）
  ＋ `PresenceCount`（「● いま N 人」，2026-11-23 TODO B4：layout 的 `Presence` 每頁前景時 30 秒 POST `/api/presence`，背景／關分頁 sendBeacon 離開；
  `lib/presence.ts` 只在記憶體記 sessionStorage 分頁代碼 → 最後時間，70 秒過期，不寫檔、重啟歸零；只收有 `cf-ipcountry` 的，所以本機測試要自己帶這個 header）
  ＋ `VisitorStats`（訪客來源國家統計，見下方「第三方整合」）
- **頁面瀏覽（2026-11-23，使用者：「繼續改頁面瀏覽方便程度」）**：
  - 全站頁面清單只有一份 `lib/site-map.ts`（`HOME_SECTIONS`＋`SITE_GROUPS` 三組：文章／旅／本站）。**新增獨立頁面要加進去**（sitemap.ts 另外加）
  - `SiteFooter`：頁面索引＋版權＋最後更新，首頁跟每個 `PageShell` 頁都有（之前子頁面只有「← 返回首頁」，/now、/uses、/travel 等沒有站內入口）。
    首頁多傳 `extra`（時鐘、人數、訪客國家）；子頁不放，少打 API。PageShell 外框改 `flex-1`（body 是 flex-col）讓短頁面頁尾也貼底；內容包 `<main>`
  - `QuickJump`（掛在 layout，每頁都有）：Ctrl+K／⌘K，或 NavBar 的放大鏡、PageShell 右上「搜尋」（`QuickJumpButton` 送 `quickjump:open` 事件）。
    頁面清單編在 client；作品＋文章第一次打開才抓 `/jump-index.json`（force-static，約 5 KB；不放 layout props，免得每頁 HTML 都多帶一份）。
    結果是一般 `<Link>`，↑↓ 只移動高亮、Enter＝點那個連結。別的彈窗（終端機）開著時不疊。全站 `:focus-visible` 沒包 layer，輸入框外框用 inline style 關掉、改底線變色。
    E2E `e2e/quick-jump.spec.ts`
- **BackToTop**：返回頂端按鈕
- **KeyboardShortcuts**（`src/components/ui/KeyboardShortcuts.tsx`）：`G` → GitHub、`E` → Email、
  `1/2/3` → section 快速跳轉，`?` 呼出快捷鍵提示浮窗
- **KonamiEgg**：↑↑↓↓←→←→BA 觸發「ようこそ」全螢幕彩蛋
- **TerminalMode**：按 `` ` `` 叫出偽終端機，支援 `help` / `ls projects` / `cat about.txt` /
  `ssh kbs0830@kbs0830.com` 等指令
- **Print 樣式**：`@media print` 隱藏 3D / NavBar / 動畫，排成 A4 履歷格式
- **2026-11-24 頁首頁尾小修（決策表 F1／F4／F10／Q5／I8）**：
  - `ThemeToggle`（`components/ui/ThemeToggle.tsx`）從 NavBar 抽出來，PageShell 右上「搜尋」旁也有一顆——之前子頁面沒辦法切主題
  - 手機選單（NavBar 抽屜）：錨點下面多一組常用頁（`pages`：部落格、履歷、旅行）；打開時焦點移到第一個連結；Esc（焦點回漢堡鈕）、
    點 header 以外、捲動超過 40px 都會收起。E2E `navbar.spec.ts`「手機選單」
  - 頁尾 `© 2026–{年}`：年份用 `BUILD_COMMIT_TIME`（不是 build 當下的時鐘）；`BuildInfo` 時間後面加回 7 碼 hash（**不要加 opacity**，a11y 對比會掛）
  - 系列文最後有「系列下一篇」卡片＋每篇最後一行 RSS 訂閱
  - ⚠️ E2E：子頁面沒有 `data-hydrated`，互動測試不能用 `gotoReady`，要 `toPass` 重試（見 `theme.spec.ts`、`tools.spec.ts`）

- **2026-11-24 手機版規則（使用者很在意手機）**：
  - ⚠️ **手機特調只改 640px 以下，桌機（sm: 以上）一律維持原樣**（2026-11-25 使用者：「桌機版不用改，我只是要你手機版特調而已」）。
    同一個元素手機、桌機要不同時，用 `sm:hidden`／`hidden sm:block` 各放一份，改完一定截桌機 1280 比對。
    目前只在手機的：封面版面＋片假名「リー ビンウェイ」、分頁只顯示中文、作品卡片「中文＋狀態 → 英文 · 日文」、區塊標題只放中文、
    課程卡片不重複狀態、右上角選單收全站目錄、頁尾只留即時資訊＋版權、子頁面右下角 ↑
  - 手機上「不換行的一行字」一定要讓所有外層都能縮（`min-w-0`、格線 `grid-cols-1`），不然整頁比螢幕寬、固定的導覽列跟著變寬；
    `navbar.spec.ts` 有 360px「沒有左右捲動」的測試
  - 作品標題一律「中文大字 → 英文 → 日文」（使用者：「一行中文一行日文有點浪費」），英日併一行小字、不換行；卡片手機版是「80px 縮圖＋標題＋兩行說明＋前 3 個 tag」
  - **手機的全站目錄收在右上角選單**（使用者：「多利用右上角選單做收納，重點顯示，剩下收起來」）：目錄是 `SiteIndex`，
    首頁 NavBar 抽屜、子頁面 `PageMenu`（PageShell 右上，手機才有）共用；收起規則 `useMenuDismiss`（Esc／點外面／捲動 40px）。
    手機頁尾不列頁面，只剩即時資訊（首頁）跟版權。`SiteFooter inset`：首頁 `inner`、PageShell 預設 `outer`——對齊靠這個
  - 手機「重點顯示」：課程專題 `mobileLimit: 2`（ProjectFilter，有選 tag 就全部顯示；收起來的卡片還在 HTML 裡）、最新文章手機 2 篇
  - 右下角只剩 `BackToTop`（↑）。同一天加過手機的「↓ 到頁尾」，目錄收進選單後就拿掉了，不要加回來
  - 封面手機版：名字 64px 兩行（h1 用 w-min，不能插 <br>，HeroNameScramble 要單一 text node）、按鈕在底部兩顆並排；`a11y.spec.ts` 有「a11y 手機」掃描
  - ⚠️ globals.css 裡沒包 `@layer` 的規則會壓過所有 Tailwind utility：全站 text-wrap 規則已移進 `@layer base`，新增全域規則也要包
  - 改手機版要實際量高度（390×844，`scrollHeight / innerHeight`）跟截圖；首頁 2026-11-24 從 14.6 → 7.3 個螢幕

### /tools 小工具（2026-11-24，決策表 J 系列）
- 清單在 `lib/site-map.ts` 的 `TOOL_PAGES`（`/tools` 總覽、Ctrl+K 都讀這份）；頁尾只放一個「小工具」入口（7 個放進頁尾會擠成兩行，試過）
- 共同規則：能在瀏覽器算的在瀏覽器算；輸入放網址參數（`useSearchParams`，頁面要包 `<Suspense>`）可以分享結果；不存訪客輸入；
  每頁最下面 `ToolNote`（資料來源＋連回對應作品／頁面）。新增工具：加進 `TOOL_PAGES`＋`sitemap.ts`＋`llms.txt` 那行
- `/tools/jpy`：`JpyExchange` 讀既有的 `/api/jpy-rate`，走勢圖共用 `JpyRateLive` 匯出的 `Trend`
- `/tools/taiwan-fukuoka`：`taiwanFuk()`（`lib/airport-board.ts`）從福岡看板篩台灣機場（`TW_AIRPORTS`），時間都是福岡時間；force-dynamic＋AutoRefresh
- `/tools/fukuoka-weather`：`getFukuokaForecast()`／`clothingAdvice()`（`lib/weather.ts`），force-dynamic
- `/tools/airport-distance`：`public/data/airports.json`＝OurAirports（公共領域）精簡版，大中型＋有定期航班＋有 IATA，3,245 個，
  只有這頁會下載；我飛過的機場用 `lib/flights.ts` 的中文名。要更新資料：重抓 ourairports-data 的 airports.csv／countries.csv 照同樣條件篩
- `/tools/japan-tax`：`splitTax()`，稅額小數捨去
- `/tools/ai-crawlers`：`/api/tools/robots?domain=`。robots 解析在 `lib/robots.ts`（RFC 9309），**抓外部網址一律用 `lib/safe-fetch.ts`**
  （只收網域、連線時檢查解析出來的 IP、轉址每跳重查、逾時／大小上限）；每 IP 10 分鐘 15 次、全站每小時 300 次、同網域快取 10 分鐘。
  單元測試 `lib/robots.test.ts` 有私有 IP／網域正規化的案例，改 safe-fetch 要一起跑
- `/tools/user-agent`：分類規則在 `scripts/lib/bot-patterns.js`（不碰 fs，client 可以 import；`raw-traffic.js` 也用它）

### 1. Hero
- **手機封面（2026-11-25，只在 640px 以下）**：名字一行（`text-[min(14vw,4rem)]`、`whitespace-nowrap`）；片假名「リー ビンウェイ」**直書**貼右側
  （`[writing-mode:vertical-rl]`、`sm:hidden`）；按鈕上方 `HeroTwoCities`＝高雄 ⇄ 福岡兩地時鐘（`useSyncExternalStore`＋15 秒，伺服器 `--:--`；
  `<p>` 不能加 `aria-label`，axe 會擋）。桌機一個 class 都沒動，改之前截 1280 確認
- **版本統計（B13，2026-11-25）**：`HeroBackground` 每個分頁 POST 一次 `/api/hero-stats` `{variant: lite|gl|gpu}`（sessionStorage `hero-reported`），
  WebGPU 退回再送 `{fallback}`（route 歸成 slow／init／no-webgpu-backend／other）。`lib/hero-stats.ts` → `data/hero-stats.json`（`HERO_STATS_FILE`），
  `/stats`「首頁 3D 背景拿到哪一版」。過濾：沒 `cf-ipcountry`、`classify(ua).kind !== "browser"`、`isNotMe()` 都不記
- **WebGPU 版第五個形狀「cities」（B14）**：`hero-shapes.ts`，高雄（左下）⇄ 福岡（右上）兩點＋光圈＋弧線＋地名；雙擊順序 stars→name→routes→icon→cities
- **桌機互動（2026-11-05）**：游標靠近粒子被推開、游標跟附近粒子連成星座線、點空白處送出衝擊波、往下捲相機後退；
  Hero 捲出畫面 `frameloop="never"` 完全停畫。名字滑鼠移上去會解碼一次；底部「SCROLL」光點沿細線往下滑
- **⚠️ 2026-11-22 晚改回線條版**：使用者試了 WebGPU 粒子版：「有點複雜（煩），線條就不錯，有時加個流星」→ `HeroBackground` 的 `AUTO_WEBGPU = false`，桌機一律 WebGL 版，
  WebGL 版加了**流星**（`HeroScene.tsx` 的 `Meteor`：每 4～8 秒從右上往左下劃過一顆（11/23 使用者要快一點，原本 8～16 秒；約四次有一次兩顆，`PAIR_CHANCE`）、不到 1 秒、頭亮尾淡，減少動態不出現）。11/23 又調了：粒子 90→50、線條改 44 條 3D 方向＋依鏡頭距離調透明度（遠淡近濃）、背景加兩個很淡的線框（測地球面、八面體，`Structures`，反向慢轉出視差）。WebGPU 版程式、`hero-webgpu.spec.ts` 都留著（測 `?hero=webgpu`），
  **不要自己把自動判斷改回來**。下面是當初 WebGPU 版的紀錄
- **三種版本（2026-11-22）**：`HeroBackground` 先 `navigator.gpu.requestAdapter()`——拿得到真的 GPU（不是 fallback adapter）、沒開減少動態
  → **WebGPU 版 `HeroSceneGPU.tsx`**；不然 → WebGL 版 `HeroScene.tsx`（下面這段）；手機 → `HeroSceneLite.tsx`。
  WebGPU 版（使用者：「電腦版要更多可玩性」，四個玩法都要、密度依效能）：粒子全在 GPU compute shader（three/webgpu＋TSL），
  移動游標＝流場、按住＝聚集／放開＝散開、拖曳＝畫星座（星點吸粒子，4 秒後淡掉）、雙擊＝名字→航線圖→網站圖示→星空（10 秒自己回星空）。
  數量 1,200 起、每秒量 fps：≥57 加 50%、<48 減 30%，上限 8,000（16,384 太吵壓到標題）；亮點固定 90 顆、其餘淡細點；星空模式標題那塊調淡。
  最少數量還 <40 fps 連兩次、或 renderer 退回 WebGL2 後端、或丟錯 → 換 WebGL 版，並記在 sessionStorage（`hero-tier`）這個分頁不再試。
  彈簧 k=4／阻尼 4.4（阻尼比約 1.1，不彈）。測試用 `?hero=webgpu`（關掉自動退回）／`?hero=webgl`。左下角一行玩法提示。
  ⚠️ 坑：① 只看 `navigator.gpu` 不夠，要拿得到 adapter——不然 WebGPURenderer 退回 WebGL2 後端掉到 12 fps；
  ② Playwright 內建的 Chromium 少 `dxcompiler.dll`，拿得到 adapter 但 requestDevice 失敗（剛好驗證了退回路徑）。
  要在這台桌機用真顯卡測：`chromium.launch({ channel: "chrome", args: ["--enable-unsafe-webgpu","--enable-gpu","--use-angle=d3d11","--ignore-gpu-blocklist"] })`，
  `window.__heroRenderer`／`__heroParticles`／`__heroFps` 看狀態；③ `uniformArray` 只在 render 時同步，只有 compute 用的資料要用 `instancedArray`（storage buffer）；
  ④ vec3 storage buffer 更新時**照每顆 3 個 float 寫**：three 第一次上傳把陣列換成每顆 4 個，但之後每次 needsUpdate 又當成 3 個重新補位（照 4 個寫形狀會全亂，11/22 寫測試時差點改壞）。
  **E2E `e2e/hero-webgpu.spec.ts`（TODO C11）**：用系統 Chrome＋真顯卡，`window.__heroProbe` 從 GPU 讀回粒子位置，確認按住聚集、拖曳星點、雙擊後粒子真的就位。
  拿不到 GPU 的機器跳過；`e2e.yml` 設 `HERO_WEBGPU_REQUIRED=1`，CI 拿不到就失敗。其他測試用內建 Chromium，全部走 WebGL 版
- 全螢幕 R3F 3D 背景：稀疏細線 + 靛藍粒子，慢速旋轉，隨游標位置微微傾斜（lerp 平滑，
  尊重 `prefers-reduced-motion`）。**`<Canvas>` 外面一定要包一層 `absolute inset-0` 的 div**：
  直接把 className 給 Canvas 會被它自己的 inline `position:relative; height:100%` 蓋掉，
  canvas 退回 150px 高——2026-11 才發現 3D 背景一直只佔畫面最上面一條
- 只在桌機（≥768px）載入 3D 場景；server 端還不知道裝置時先畫骨架屏（`useMediaQuery` 回傳 `null`），
  手機不會下載 three.js chunk
- **手機（2026-11-05）**：`HeroSceneLite.tsx`，同一個畫面語言改用 Canvas 2D 自己做 3D 投影（約 2KB、不載 three.js）。
  手機傾斜（陀螺儀；iOS 要跳授權視窗所以不做）或手指滑過會微微轉。最多 30fps、捲出 Hero／切分頁完全停
  （實測捲走後 2 秒 0 次繪製）、reduced-motion 只畫一張靜態圖、DPR 上限 2
- 標題：`PINGWEI LI`（大字，無本名）
- 副標：`学生開発者 · Claude × Gemini`，`useTypewriter` 逐字打字效果
- CTA：`查看作品 · View Work` / `聯絡我 · Contact`（磁吸按鈕效果，滑鼠靠近微微吸引游標）
- 載入中：呼應真實場景的稀疏細線骨架屏（非空白）；R3F 崩潰時 `SceneErrorBoundary` fallback
  到 CSS 漸層背景

### 2. About（自己紹介 · 關於我）
- **2026-11-05 改成「上面介紹＋狀態卡，下面四個分頁」**（使用者：「分類好、不要太冗長」）：
  歷程 Timeline／技能 Skills／開発活動 Activity／足跡 Footprint，用 `<Tabs>`。首頁桌機高度 7077→5732px、手機 8988→7320px。
  新增 About 內容時放進對應分頁，不要再往分頁下面接新區塊
- 首頁三區小標加編號 `01 — About`／`02 — Work`／`03 — Contact`
- 中文主文（高雄↔福岡生活、AI+Web 交叉點）＋ 英文補充說明，標題 scroll-triggered 逐字 reveal
- **Status card**：現況（大三・20 歲；2026-11-06 使用者告知，學年／生日會過期，見 reminders.json）、地點、交通運輸興趣、日語學習（N5 学習中）、開発環境
- **Spotify 正在聽**（`SpotifyNowPlaying` 元件 ＋ `/api/spotify/now-playing` route）：見下方
  「第三方整合」
- **時間軸**（2021–2026）：per-item stagger 進場動畫，dot 依序出現，hover / click（含鍵盤
  Enter/Space）展開一行補充說明
- **Skills**：5 組分類（AI/ML、後端、前端、工具、目前學習中），accordion 可展開/收合
  （預設只展開第一組），每個技能 chip 內建 1–5 點細小圓點指示熟練度
- **GitHub 貢獻熱力圖**：`ghchart.rshah.org/2d5a8e/kbs0830` 公開無需驗證的 contribution graph
  （白底 SVG，暗色模式下是白色卡片，屬已知取捨）
- **足跡 · Footprint**：已到訪國家（日本／韓國／越南／泰國／香港／美國）與規劃中（新加坡／馬來西亞），
  標題下有一行粗顆粒度統計（已到訪/規劃中國家數，不含日期），最下面連到 `/flights`。
  **2026-11-05 航班明細搬到獨立頁 `/flights`**（使用者：「主角還是關於 code」），首頁只留國家跟城市。
  航班資料在 `src/lib/flights.ts`（使用者提供的 byAir 匯出檔整理，**只留航班代碼＋起降機場**，日期／時間／座位／
  訂位代碼／備註一律不放——有日期就拼得出行程；`flights.test.ts` 會擋日期時間格式混進來）。
  `/flights` 頁：統計（航班／機場／航空公司／大圓距離）、`RouteMap.tsx` 東亞航線圖（Server Component 靜態 SVG、
  沒有底圖、弧線用 CSS 畫出來）、航線（前 10 條，其餘 `<details>`）、機場、航空公司。排除的兩班：JX206（沒搭到）、
  GK17（同日另有 UA837，使用者確認搭 UA837）。機型對照表獨立放在 `src/lib/aircraft.ts`（`aircraftByFlight: Record<string,
  string>`，代碼 → 機型），這是使用者自己維護的航迷小筆記，純靜態編譯進頁面（首頁是
  static prerender，改完要 build/push 才會生效，不是即時資料庫）。**資料本身沒有官方來源**，
  新增/修改機型一律要使用者親口告知對應的航班代碼，不要自己猜或編造機型。「代碼 →
  代碼(機型)」的格式化邏輯是 `aircraft.ts` 裡的 `formatFlightCode()`（原本寫死在
  `AboutSection.tsx` 裡的 inline expression，抽出來純粹是為了能補單元測試，行為沒變）。
  **旅行地球 `/travel`（2026-11-21，TODO A5）**：飛行＋住宿畫在同一顆地球（`components/canvas/TravelGlobe.tsx`，Canvas 2D 正射投影、
  桌機手機同一套、不載 three.js；經緯線＋大圓航線弧線（越長拱越高）＋城市點，沒有底圖）。拖曳轉、「全球／東亞」切換、點城市看住過幾間／起降幾次，
  下面的城市清單是鍵盤操作的入口。慢慢自轉；reduced-motion 不轉；捲出畫面／背景分頁停畫。資料 `lib/travel.ts`（機場 80 km 內併到住過的城市）。
  /flights、/hotels 照舊（明細），開頭都有「在地球上看 →」
  **住宿紀錄 `/hotels`（2026-11-09）**：使用者 Google 地圖「已儲存 → 飯店」的 Takeout 匯出，78 間，使用者確認**全部住過**。
  資料在 `src/lib/hotels.ts`（名稱＋城市＋集團，**不放日期／房型／價格**；城市靠名稱＋地圖連結裡 S2 cell 解出的約略座標交叉確認，
  集團不確定就歸「其他」）。`HotelMap.tsx` 跟 RouteMap 同風格：東亞圖（台灣併成一點）＋台灣放大圖，**只標城市不標飯店位置**（使用者選的）。
  足跡分頁底下跟 `/flights` 頁尾都有連過去。**會籍**（`MEMBERSHIPS`，2026-11-09 使用者給的：飯店／航空／機場貴賓室／郵輪／租車）只寫計畫名稱＋等級（**權益、效期不寫**，使用者說的），
  **會員編號一律不放**（`hotels.test.ts` 擋 6 位以上數字）；名稱照官方寫法校過。有效期的三筆（GHA、IHG 酒廊、華航）
  在 `reminders.json` 有到期提醒。陣列空的時候整區不顯示

### 3. 製作物（作品集）

**分兩區塊：個人専案 ／ 課程専題**，Portfolio section 頂部有依 tag（Python / Next.js / AI…）
（2026-11-09 起篩選列只直接列「2 個以上作品用到」的 tag，只出現一次的收在「+N 更多」；選中的那個收合後還會留著）
**技能 ↔ 作品互連（2026-11-09）**：About 的技能 chip 對得到作品 tag（`projects.ts` 的 `tagForSkill()`，會去掉版本號：
「Next.js 16」→「Next.js」）就變成 `<a href="#portfolio" data-filter-tag>`，`ProjectFilter` 在 document 上監聽點擊、不重新載入；
作品詳細頁的 tag 是一般 `<a href="/?tag=X#portfolio">`（整頁載入，`ProjectFilter` 用 `useSyncExternalStore` 讀網址）——
用 next/link 的話 client 換頁時網址參數不一定已經換好
篩選卡片的 filter bar（`src/components/sections/PortfolioSection.tsx`），卡片 hover lift。

個人専案（`isPersonal: true`，見 `src/lib/projects.ts`）：
- **FoodLens Advisor**：YOLOv8 + Gemini AI，影像留本機，隱私優先，薄客戶端架構
- **YARTIX Ticketing**：Flask 活動報名售票系統（台灣鐵道文化意象），LINE/Email 付款、Google Sheets
- **FRC Robot Team**：2023 全國冠軍聯盟
- **Auto-Following Robot**：2024 全國專題競賽動力機械群全國佳作

課程専題（school 私有倉庫 `kbs0830/school`，位於桌面 `C:\Users\user\Desktop\school`，
私有但本機已有 git 憑證可讀）：
- **日圓匯率分析系統**：Flask + SQLite + 多銀行並行爬蟲 + Yahoo Finance API + LKG 容錯 + 購買力決策引擎
- **個人記帳分析系統**：PyQt5 桌機 GUI、資料存 CSV（**不是 SQLite**，2026-11-09 對過原始碼；深色模式／主題切換也是沒做的規劃，已拿掉），程式設計三小組専題（2026/01）
- **2026-11-09 新增**（使用者：「全部都放，能放的都放，記得去識別化」，內容都對過原始碼／報告）：
  **路口排雷**（`C:\Users\user\Desktop\road-refactor`，系統分析與設計小組専題；v2 的 17 個 commit 全是使用者信箱提交，所以寫「v2 重構版由我完成」；
  GitHub repo `jjhhhhf/road` 的 README 有組員本名，**不連過去**；截圖是本機跑的展示帳號，CARTO 地圖磚在本機會要 API key 所以沒截地圖）、
  **空氣品質分類**（Orange）、**SQL 分析**（抓到參考答案少 JOIN）、**顧客流失預處理**、**均線交叉回測**
  （⚠️ 原程式的數字有 bug：沒持股時跌破 MA60 也記一筆 0 張賣出、賣出時手續費稅用加的、不檢查資金——所以網站不放報酬數字，截圖是用它的訊號邏輯畫的買賣點）
- **學習記録總覽**：HTML/CSS/PHP、Python、資料庫、大數據、AI 深度學習、投資決策；詳細頁列其餘練習（卡皮巴拉餐廳 RWD、PHP CRUD、程設二、期中考等）
- **去識別化**：課程報告／檔名有學號、本名、班級組別（例：記帳系統原本寫的「智商二乙 第十一組」已拿掉），一律不放

狀態標籤：`完成`（靛藍）/ `製作中`（琥珀）/ `課程専題`（紫）/ `學習記録`（灰）
底部日文備注：「学習記録は非公開リポジトリに保存されています。」

**⚠️ `projects.ts` 曾列過的「麵包店電商網站」課程専題已依使用者要求移除**，改動這份清單前
先確認 `src/lib/projects.ts` 目前實際內容，不要照這份文件的舊描述回填。

`/projects/[slug]` 詳細頁（`src/app/projects/[slug]/page.tsx`）：`generateStaticParams`
把全部作品 SSG 成獨立頁面，卡片整張可點擊（overlay `<Link>`，GitHub icon 用 z-index
疊在上面保持獨立可點）。有 `image` 的作品卡片頂部會顯示縮圖（hover 灰階轉全彩）。
`detail.architectureDiagram`（Mermaid flowchart 語法）只有 FoodLens／YARTIX／自動跟隨機器人／
日圓匯率／記帳系統這 5 個有真實架構資訊的作品才有；FRC／school 沒有，故意沒加，不要為了「補齊」而編。

**架構圖是部署前預先畫好的靜態 SVG（2026-11-04）**：
- `scripts/render-diagrams.mjs`（`pnpm diagrams`）用 Playwright Chromium + mermaid 把每張圖畫成
  亮色／暗色兩份 SVG，存 `src/generated/diagrams/<key>-{light,dark}.svg`（**進版控**）。
  key = 圖的原始碼＋`lib/mermaid-config.ts` 主題設定的雜湊（`lib/diagram-key.ts`），改圖或改設定就換 key
- `ArchitectureDiagram.tsx`（Server Component）build 時讀 SVG 嵌進 HTML，兩份都放，`globals.css` 依
  `data-theme` 只顯示一份——切換主題圖會跟著變（舊版只在載入時畫一次，切主題不會變）
- 找不到對應 SVG 時退回 `MermaidDiagram.tsx` 瀏覽器端即時渲染（動態 import mermaid），網站不會壞
- 效果：作品詳細頁 JS 2.8MB → 565KB，沒有「載入架構圖…」閃一下，沒 JS／列印也看得到圖
- `deploy.ps1` 每次 build 前跑腳本（沒變就秒過），有新 SVG 會在部署成功後自動 commit
- 腳本用 Google Fonts 載 Geist Mono 量文字寬度，跟網站實際字體一致；字體載不到就整個不畫（寧可退回
  瀏覽器端，也不要產生方框尺寸不對的圖）
- 腳本直接 import `.ts`（Node 24 內建型別剝除），所以 `tsconfig.json` 開了 `allowImportingTsExtensions`，
  被腳本 import 的 `lib/*.ts` 彼此之間要寫 `./xxx.ts` 副檔名、不能用 `@/` alias

### 4. Contact（連絡先）
- 中文主文，英文次之
- Email + GitHub 按鈕（磁吸效果），Email 複製回饋（clipboard + 已複製！toast）
- 沒有留言表單：曾做過 mailto 版，使用者覺得不需要已移除；見 `TODO.md`「聯絡表單」
- 「下載履歷」按鈕 **2026-11-05 依使用者要求先隱藏**（`ContactSection.tsx` 留了恢復方法），`/llms.txt`、Markdown 版也拿掉 PDF 連結；
  `/resume` 頁面跟 `public/resume.pdf` 照舊（部署照常自動重印）

### 5. `/blog`（獨立頁面，非首頁 section）
內容來源 `content/blog/*.mdx`（frontmatter 用 `gray-matter` 解析，`src/lib/blog.ts` 讀取），
`/blog` 列表頁 + `/blog/[slug]` 用 `next-mdx-remote/rsc` 渲染，`generateStaticParams` SSG。
**文章內容必須是真的踩過的坑，不能編造**——目前 8 篇都是實際 debug 過程的記錄（Next.js
`params` Promise 陷阱、訪客統計被機器人污染、Lighthouse WCAG 對比度問題、Task Scheduler 72 小時上限、Tunnel 斷 4 天、
`/blog/.env` 回 500（cwd 是 System32）、VS Code 鎖住 `.next`（雙槽部署由來）、CI 灌了 1037 筆假訪客）。
**草稿放 `content/drafts/`**（`blog.ts` 不讀、不進 git），使用者看過才搬進 `content/blog/`、日期改成發佈當天。
**2026-11-09 加的功能**（`lib/blog.ts`，都有單元測試）：
- 系列文：frontmatter `series: "自架網站維運"` ＋ `seriesOrder: N`，文章開頭出現系列導覽（目前 5 篇）。新文章屬於同系列就照加
- 上一篇／下一篇（依日期）、相關文章（共同 tag，**不含同系列**——系列導覽已經列了）
- 目錄：4 個以上 `##` 小標才出現，原生 `<details>` 預設收起；h2 的 id 跟目錄都用 `headingId()`，改規則兩邊一起變
- tag 頁 `/blog/tags/<tagSlug>`：`Next.js` → `next-js`（網址結尾不能像 `.js` 檔，server.js 會當靜態資源不計流量）。
  **tag 頁 noindex、不進 sitemap（2026-11-12）**：Search Console「已檢索 - 尚未建立索引」27 頁，tag 頁是文章清單的子集、
  內容重複；讓 Google 專心收文章。頁面照常可以開、站內連結照跟（`robots: { index: false, follow: true }`）。
  **網址只能英數字**：中文 tag 要在 `blog.ts` 的 `TAG_SLUGS` 加對照（`隱私` → `privacy`）——直接用中文時 Next 預先產生的頁面
  跟瀏覽器送來的編碼網址對不上，上線 404（build、單元測試都過）。單元測試跟 `e2e/sitemap.spec.ts`（sitemap 每個網址都要 200）會擋
  sitemap、Markdown 版（`/blog/tags/next-js.md`）都有；中文 tag（`隱私`）的 Markdown 版 `Link` header 要 `encodeURI`
  （header 只能 ASCII，build 時第一次就因為這個炸掉）
- 首頁作品集下面有「最新文章」3 篇（`components/sections/LatestPosts.tsx`）

**2026-11-21 部落格升級（TODO A6）**，都沒有裝新套件：
- 全文搜尋：`lib/blog-search.ts`＋`/blog/search-index.json`（build 時產生，約 30 KB）＋`BlogSearch`（第一次聚焦才下載索引，中文直接「包含」比對，多個詞 AND）。沒用 Pagefind：要在正式站目錄裝套件、中文斷詞還要另外測
- 程式碼區塊右上角「複製」（`CopyCodeButton`，唯一的 client 部分）
- frontmatter `commits: ["短hash"]` → 文章最後「對應的修改」連到 GitHub commit。**新文章有對應的修正就填**
- RSS 全文：`<content:encoded>` 用 `lib/md-html.ts` 轉（只支援文章用到的語法；文章用到表格、圖片要補，`md-html.test.ts` 會逐篇檢查）
- 留言 giscus：`lib/giscus.ts` 是 null 就整塊不出現、CSP 也不放行 giscus.app；**要使用者開 Discussions＋裝 giscus app** 才能填（步驟寫在那個檔案）。
  按「載入留言」才載入官方 client.js（打開文章不會連第三方）
- E2E `blog-features.spec.ts`：⚠️ 文章頁不能用 `gotoReady`（它等的 data-hydrated 只有首頁有）

**支援 Markdown 表格（2026-11-09 裝了 remark-gfm）**：表格、~~刪除線~~、任務清單都能用；表格窄螢幕可以左右滑。之前沒裝時
`| a | b |` 會原樣印出一排直線。新增文章前
先確認真的有實際發生過的技術細節可以寫，不要為了「補內容」硬掰。Footer 有一個不顯眼的
`Blog` 連結（`/now`、`/uses` 至今都沒有站內連結能點到，純靠 sitemap／直接網址發現；
但 blog 加這個功能的動機就是 SEO，完全沒有站內連結會抵銷這個動機，所以額外加了）。

### 5.5 `/changelog`（2026-11-21，TODO B1）
- build 時跑 `git log` 撈 `feat` commit（`lib/changelog.ts`），頁尾「最後更新」（`BuildInfo`）整段連過來。靜態頁，每次部署重新產生
- ⚠️ git 在 `next.config.ts` 讀（env `BUILD_FEAT_LOG` 傳給頁面），而且**用 `execFileSync("git", [...])`，不要 `execSync("git log --format=%h…")`**：
  上線當天自己 build 都正常，CI runner 部署的 build 卻整頁空白、沒有錯誤——runner 環境下經過 cmd.exe 的 `%…%` 格式字串被動到，
  git 有輸出但找不到 feat 那幾行（改 execFileSync 才好，第三次部署才修對）。讀不到時 build log 會有 `[changelog]` 警告
- commit 訊息會**原文公開**：本名、信箱、token、內網、雷達位置不要寫進 `feat` 的標題。寫到了會被 `PRIVATE_PATTERN` 整則濾掉；
  要改寫或隱藏舊的某一則，在 `OVERRIDES` 加「短 hash → 新文字／null」。`changelog.test.ts` 會拿真的 git log 檢查

### 5.6 `/status` 維運狀態（2026-11-21，TODO A4）
- 近 90 天可用率長條、部署紀錄（含自動退回）、watchdog 自動重啟紀錄、**事故報告**。`force-dynamic`，沒有 Markdown 版（跟 /stats 一樣）
- 資料 `lib/status.ts`：`data/uptime.log`（**watchdog 每一輪寫一行** `時間 o=origin p=外網 m=維修`，1／0／-；超過 2 MB 只留最後 4 萬行；
  有進每日備份）、`logs/deploy.log`、`logs/watchdog.log`（依修改時間快取）。路徑：server.js 設 `UPTIME_FILE`、`LOGS_DIR`
- **只公開彙總**：log 原文（路徑、chunk 檔名、錯誤訊息）不出去，watchdog 事件只轉成「網站／外網／runner × 自動恢復與否」
- uptime.log 2026-11-21 才開始記，之前的日子是灰的（頁面有說明）；可用率＝origin 正常而且外網沒失敗
- 事故報告在 `lib/incidents.ts`：**真的發生過的事才寫**，照「影響 → 怎麼發現 → 原因 → 修法 → 之後」；新的加最上面，有文章就填 `post`
- 跟 `public/status/*.svg`（狀態色分頁圖示）同路徑前綴，兩邊都正常（測過）；維修模式會擋 `/status` 頁面、照常放行 `/status/*.svg`

### 5.7 `/colophon` 本站構造（2026-11-21，TODO A8）
- 「部署架構」做成給人看的一張圖：訪客 → Cloudflare → Tunnel → server.js → Next.js 雙槽 → data/，旁邊雷達、告警信、watchdog、部署、備份
- 每個方塊上是即時數字（`lib/colophon.ts` 的 `readSiteFacts()`，只收集既有資料：status、Cloudflare、真人造訪、backup.log、雷達彙總）；`force-dynamic`
- 點方塊跳到下面的說明卡（`<a href="#id">` ＋ Tailwind `target:`，零 JS）。作品「個人網站（本站）」的 `live` 連過來
- 說明文字照 CLAUDE.md 寫，**架構改了（加服務、換部署方式）這頁要跟著改**；不放內網 IP、雷達位置

### 5.8 公開 API `/api/v1`、MCP 伺服器 `/mcp`、說明頁 `/developers`（2026-11-21，TODO A9／A10）
- 資料共用 `lib/public-api.ts`（來源同 projects／blog／page-content／flights，**不另外維護**）；名字只用 PINGWEI LI，不放本名
- API：`/api/v1`（入口）、`/profile`、`/projects`、`/projects/{slug}`、`/posts`、`/posts/{slug}`（含 MDX 全文）、`/now`、`/flights`、`/openapi.json`。
  全部 `force-static`（build 時產生），CORS `*`、快取一小時。OpenAPI 在 `lib/openapi.ts`，**改 API 回傳欄位要一起改**（`public-api.test.ts` 會比對 required 欄位）
- MCP：`lib/mcp.ts`＋`app/mcp/route.ts`，Streamable HTTP、無狀態（不發 session、GET 回 405、通知回 202）、只回 JSON。8 個唯讀工具
  （get_profile、list_projects、get_project、list_posts、get_post、search、get_now、get_flight_stats）。新增工具加進 `TOOLS`，/developers 跟 Markdown 版自動列出
- `/developers` 有 Markdown 版；`/llms.txt` 也列了 API 跟 MCP。E2E `e2e/api.spec.ts` 真的打一輪 API 跟 MCP

### 5.9 `/airports` 機場時刻表＋課程作品的「線上版」（2026-11-22，TODO D2／D5／D6）
- **`/airports`**（使用者：「順便做一個即時時刻表（小港機場／福岡機場）」）：最上面「高雄 ⇄ 福岡」今天的直飛班機，下面小港、福岡各一組出發／抵達分頁（`<Tabs>`），
  只列「接下來」的（還沒結束的＋30 分鐘內剛起飛／抵達／取消的，最多 30 班）。`force-dynamic`、沒有 Markdown 版，`AutoRefresh` 每 3 分鐘 `router.refresh()`（背景分頁不刷）
- 資料 `lib/airport-board.ts`（伺服器 3 分鐘抓一次）：小港＝高雄國際航空站政府開放資料 `kia.gov.tw/Announce/NewsArea/InstantSchedule_{INT,DOM}{DEP,ARR}.json`；
  福岡＝福岡空港官網自己的 `/api/flight_schedule/flight_schedule.json`（**不是正式開放資料，官網改版就會壞**，抓不到那塊不顯示）。
  福岡的聯營另外列一行（`remarks2: "Code Share"`）→ 併進主航班；國際線城市只有片假名 → `FUK_PLACES` 換中文；狀態用英文那欄對應（`FUK_STATUS`，新的狀態字樣要補）
- 延誤／取消用 `--warn`（「出事了」）。頁面不拿雷達資料比對（雷達不公開位置）
- **小港延誤統計（J3，2026-11-25）**：`src/instrumentation.ts` 的 `register()` 開 `lib/airport-delay-recorder.ts`，每 20 分鐘（第一次 60 秒後）
  拿 `getBoards().khh` 記進 `data/airport-delays.json`（`AIRPORT_DELAYS_FILE`；key `代號|dep/arr|表定`，同一班同一天只留最後狀態，留 120 天）。
  `summarizeDelays` 只算已結束的班次：準點＝15 分鐘內、取消數、最常延誤（≥5 次、平均晚 >0）。**滿 7 天才顯示**在 `/airports`。
  build 時不開；`AIRPORT_DELAY_RECORDER=0` 關掉（3200 測試建議帶，或把檔案指到暫存）
- **作品頁 `liveWidget`**：`projects.ts` 的 `liveWidget: "jpy-rate" | "air-quality"` → 作品頁放 `JpyRateLive`／`AirQualityLive`（client，讀 `/api/jpy-rate`、`/api/air-quality`）
  - 匯率（`lib/jpy-rate.ts`）：台銀 `rate.bot.com.tw/xrt/flcsv/0/day`（**沒帶瀏覽器 UA 會被擋成驗證頁**）＋玉山外匯頁的 JSON-LD；Yahoo `JPYTWD=X` 走勢（`range=90d` 實際回 4 個月，自己切 90 天）。
    決策照作品原本：預算 ÷ 日圓價格＝目標匯率，現金賣出 ≤ 目標 →「現在就買」。作品的 6 家銀行只剩 2 家抓得到，不硬爬
  - 空氣品質（`lib/air-quality.ts`）：Open-Meteo（CAMS 模型，不是測站）六項污染物，**環境部 114 年版即時 AQI 公式**（PM2.5 良好上限 12.4、PM 用 0.5×12h＋0.5×4h），
    對照表 2026-11-22 從環境部官網抄的。環境部開放資料要 api_key，有了可以改抓測站
- 外部 API 一覽在 README「外部資料」


- `/now`：當下在做什麼、在學什麼（nownownow.com 傳統）
- `/uses`：開發環境、硬體（RTX 3070 / Zenbook A14）、軟體、工具清單
- 兩者都要記得設定 `alternates.canonical`，見下方 SEO 章節

### 7. `/resume`（獨立頁面）
教育／技能／作品，內容全部取自網站上已經有的真實資料（timeline、skills、projects.ts），
**沒有編造任何新的經歷、證照或年資**。**證照（2026-11-09）** 是使用者給的 104 履歷 PDF
「資格認證」那段照抄（`lib/page-content.ts` 的 `certifications`）；同一份 PDF 的電話、地址、役別、工作經歷、求職條件**都沒用**
（經歷要不要放還在問，見 TODO）。套用 `globals.css` 既有的 `@media print` 樣式
（列印時去色、A4 排版）。`public/resume.pdf` 是用 `scripts/generate-resume-pdf.js`
（Playwright headless Chromium 印 `/resume` 頁面）產生的**靜態快照**，不是即時渲染——
2026-11 起部署時偵測到 `/resume` 內容來源有變會**自動重印並 commit**（見「CI/CD」）；手動重印：
`pnpm resume:pdf`（預設打 `http://localhost:3000`，可傳其他 URL 當參數）。腳本會等
`document.fonts.ready` 才印——2026-11 之前沒等，PDF 裡全是系統備用字體（微軟正黑體／細明體）。


## Project Structure

```
kbs0830_web/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Noto Serif JP + Geist 字體，lang="zh-Hant"，inline dark-mode script + Person JSON-LD
│   │   ├── page.tsx             # 組合所有 sections + Footer + 全站彩蛋/工具（見 Site Sections 0）
│   │   ├── globals.css          # CSS variables 設計系統，@source not "../../**/*.md" 排除文件污染編譯
│   │   ├── not-found.tsx        # 自訂 404
│   │   ├── error.tsx / global-error.tsx  # render 錯誤 boundary（console log + timestamp/digest/path）
│   │   ├── icon.tsx / apple-icon.tsx / favicon.ico  # 網站圖示（2026-11-12 換成「終端機視窗＋右上角指示燈」，使用者挑的）。
│   │   │                        # 圖形唯一來源 lib/brand-icon.ts（full／small／apple 三版）；favicon.ico 用 scripts/build-favicon.mjs 產生，
│   │   │                        # 改圖示要重跑那支。櫻花粉 #f2a7b8 只用在圖示，網站強調色照舊只有靛藍。不放字母（使用者不要 P）
│   │   │                        # 狀態色（視窗顏色）：正常＝靛藍、本機 next dev＝綠、維修模式＝琥珀、頁面出錯＝紅（StatusFavicon.tsx）、
│   │   │                        # 右上角的點＝新功能指示燈（使用者：「櫻花粉指示燈指右上角的點，不是整個 ICON」）：平常暖白（沒亮），
│   │   │                        # 新功能上線 12 小時亮櫻花粉、稍微大一點，視窗照舊靛藍（deploy.ps1 的 Update-FeatureRelease：這次部署範圍有 `feat` 開頭的 commit
│   │   │                        # 就寫 data/feature-release.json → /api/visitor-stats 回 newFeature（只給到期時間）→ VisitBeacon 換圖示；出錯的紅色優先）
│   │   │                        # 所以 commit 訊息要照慣例：真的是新功能才用 feat，修 bug／文件用 fix／docs，不然會誤亮櫻花粉
│   │   ├── opengraph-image.tsx  # OG 社群預覽圖，動態生成
│   │   ├── manifest.ts          # PWA manifest
│   │   ├── robots.ts / sitemap.ts
│   │   ├── now/page.tsx         # /now
│   │   ├── uses/page.tsx        # /uses
│   │   ├── resume/page.tsx      # /resume，見「第三方整合」章節的「履歷 PDF」
│   │   ├── blog/
│   │   │   ├── page.tsx         # /blog 列表
│   │   │   └── [slug]/page.tsx  # /blog/[slug]，next-mdx-remote/rsc 渲染
│   │   ├── projects/[slug]/
│   │   │   ├── page.tsx         # 專案詳細頁
│   │   │   └── template.tsx     # <ViewTransition enter="page-enter">，配合卡片標題/縮圖 morph（CSS 在 globals.css）
│   │   └── api/
│   │       ├── spotify/now-playing/route.ts   # Spotify 正在聽後端（+ route.test.ts）
│   │       └── visitor-stats/route.ts         # 訪客來源國家統計彙總（+ route.test.ts）
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── HeroScene.tsx           # R3F 3D 背景（細線 + 粒子），滑鼠互動
│   │   │   └── SceneErrorBoundary.tsx  # WebGL 崩潰 fallback
│   │   ├── ui/
│   │   │   ├── NavBar.tsx
│   │   │   ├── icons.tsx               # GitHub/Moon/Sun 共用 SVG icon（原本三處各自複製一份 SVG path，已收斂成單一來源）
│   │   │   ├── Eyebrow.tsx             # 標題上方小標籤（mono 字＋寬字距＋uppercase），原本 9 個檔案 13 處逐字重複，已收斂
│   │   │   ├── TagBadge.tsx            # tag/skill 小徽章樣式，原本 4 個檔案逐字重複，已收斂
│   │   │   ├── BackToTop.tsx
│   │   │   ├── LocalClock.tsx          # Footer 雙時區時鐘
│   │   │   ├── VisitorStats.tsx        # Footer 訪客來源國家統計
│   │   │   ├── KeyboardShortcuts.tsx
│   │   │   ├── KonamiEgg.tsx
│   │   │   ├── TerminalMode.tsx
│   │   │   ├── SpotifyNowPlaying.tsx
│   │   │   ├── ArchitectureDiagram.tsx # 專案架構圖：嵌入預先畫好的 SVG（見「製作物」）
│   │   │   ├── MermaidDiagram.tsx      # 架構圖的瀏覽器端備援（SVG 還沒畫好時才用）
│   │   │   ├── WebVitals.tsx           # 回報真實訪客 Web Vitals（見「第三方整合」）
│   │   │   ├── Magnetic.tsx            # 磁吸按鈕效果（直接改 style.translate，不 re-render）
│   │   │   ├── Tabs.tsx                # 分頁（About），面板 hidden="until-found"
│   │   │   ├── Reveal.tsx              # 捲動淡入（見「動畫架構」）
│   │   │   ├── RevealHeading.tsx       # scroll-triggered 逐字 reveal 標題
│   │   │   ├── Collapse.tsx            # 展開/收合
│   │   │   ├── Modal.tsx               # 原生 <dialog> 彈窗（終端機、快捷鍵說明）
│   │   │   ├── Underline.tsx           # 文字連結 hover 底線（Hero/Contact 共用）
│   │   │   ├── PageShell.tsx           # 獨立頁面共用外框（窄欄 + ← 返回連結 + 可選頁首 eyebrow/title/intro）
│   │   │   ├── SectionHeading.tsx / BulletList.tsx / StatusBadge.tsx / ProjectHighlight.tsx / JsonLd.tsx
│   │   │   │                           # 獨立頁面跟作品卡片共用的小區塊，見「Server / Client 分工」
│   │   │   └── MaintenancePage.tsx
│   │   └── sections/                   # 四個 section 都是 Server Component，見「Server / Client 分工」
│   │       ├── HeroSection.tsx         # + HeroBackground.tsx / Typewriter.tsx（client）
│   │       ├── AboutSection.tsx        # 資料在 lib/about.ts
│   │       ├── PortfolioSection.tsx    # + ProjectFilter.tsx（client，tag 篩選）
│   │       └── ContactSection.tsx      # + CopyEmailButton.tsx（client）
│   └── lib/
│       ├── site.ts            # SITE_URL／EMAIL／GitHub・FB・IG 連結（全站唯一來源）
│       ├── projects.ts        # 作品資料（slug, title, tags, github, detail.architectureDiagram...；狀態顏色在 StatusBadge）
│       ├── aircraft.ts        # 足跡航班機型對照表 + formatFlightCode()（+ aircraft.test.ts）
│       ├── about.ts           # About 的技能、時間軸、足跡、現況資料
│       ├── hooks.ts           # useMediaQuery / useScrolledPast / useRevealOnce
│       ├── isTyping.ts        # 鍵盤快捷鍵的「正在輸入」防呆
│       └── blog.ts            # 讀 content/blog/*.mdx，gray-matter 解析 frontmatter（+ blog.test.ts）
├── content/
│   └── blog/*.mdx             # 部落格文章，內容必須是真的踩過的坑，不能編造
├── scripts/
│   ├── server.js                    # 自訂 production server（request/error log + 訪客國家統計 + 30 分鐘一次的 MEM 診斷 log）
│   ├── deploy.ps1                    # pull + build + restart + 健檢，manual/CI 共用
│   ├── verify-deploy.ps1             # 部署後健檢（呼叫 lib/health-check.ps1）
│   ├── watchdog.ps1                  # 每 5 分鐘健康檢查（網站 + GitHub Actions runner 存活），異常自動重啟（Task Scheduler: kbs0830_Watchdog）
│   ├── backup.ps1                    # 每日備份到 D: ＋ GitHub 私有 repo（加密），由 watchdog 觸發，見「自動備份」
│   ├── setup-autostart.ps1           # 一次性（管理員執行）：排程工作取消 72h 上限/改 S4U、Cloudflared 服務帶 tunnel 參數
│   ├── spotify-get-refresh-token.js  # 一次性小工具：取得 Spotify refresh token
│   ├── generate-resume-pdf.js        # 重新產生 public/resume.pdf（pnpm resume:pdf）
│   ├── render-diagrams.mjs           # 架構圖預先畫成 SVG（pnpm diagrams），deploy.ps1 每次 build 前跑
│   └── lib/
│       ├── logger.ps1          # 共用時間戳記 log + 5MB 輪替（deploy.ps1 / watchdog.ps1 共用）
│       ├── health-check.ps1    # 共用健康檢查邏輯（verify-deploy.ps1 / watchdog.ps1 共用）
│       └── notify.ps1          # Email 告警＋冷卻（deploy.ps1 / watchdog.ps1 / backup.ps1 共用），見「健康監控」
├── .husky/pre-commit          # commit 前 lint-staged + tsc --noEmit（見上方「Git hooks」）
├── .github/workflows/
│   ├── deploy.yml              # push to main → 自動部署
│   ├── renovate.yml            # 每週一自動跑 Renovate CLI 開 PR（見「依賴更新」）
│   └── e2e.yml                 # push to main → 平行跑 Playwright，不擋部署
├── e2e/*.spec.ts               # Playwright E2E 測試（pnpm test:e2e）
├── vitest.config.mts           # Vitest 設定（node 環境、@/* alias），src/**/*.test.ts（pnpm test:unit）
├── renovate.json               # Renovate 設定
├── data/                       # 執行期資料（gitignore，不進版控）：visitor-stats.json 等
├── public/resume.pdf           # generate-resume-pdf.js 產生的靜態快照，/resume 內容有變時部署會自動重印
├── .env.local                 # 不進版控，見「第三方整合」章節的 Spotify 環境變數
├── pnpm-workspace.yaml        # pnpm 11 設定：allowBuilds（sharp／unrs-resolver 不跑 build script）、
│                              # minimumReleaseAgeExclude（提早安裝的安全性更新，升下一版要清掉舊的）
├── src/generated/diagrams/    # render-diagrams.mjs 預先畫好的架構圖 SVG（進版控）
├── eslint.config.mjs          # scripts/**/*.js 關掉 no-require-imports（見「Git hooks」）
├── CLAUDE.md
├── TODO.md                   # 只放還沒做的（你要動手／要決定／Claude 可直接做的點子）
├── DONE.md                   # 已完成紀錄（2026-11-09 從 TODO.md 拆出來）；做完的事從 TODO 搬過來
└── package.json
```
