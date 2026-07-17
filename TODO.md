# TODO — kbs0830_web

**2026-07 現況：** 下面所有還沒打勾的項目都卡在需要使用者提供素材（截圖／履歷 PDF／
架構圖）、申請外部帳號（Cloudflare／EmailJS 等）、或做設計/架構決定（犧牲動畫效果換
Performance 分數、要不要零停機部署）——不是還沒空做，是純技術上已經沒有能自己接著做
的項目了。每項底下都有具體卡在哪、需要你做什麼決定。

---

## 🔴 高優先 — 內容 & 功能完整性

- [ ] **作品集截圖 / Thumbnail**
  卡片純文字層次感偏低，加 thumbnail 後視覺差很多
  → 卡片本身這次才發現一直沒真的接上圖片顯示（`image` 欄位加了但只有詳細頁用到，
    卡片上完全沒畫面），已經補上（有 `image` 的作品卡片頂部會顯示縮圖，hover
    從淡灰階變全彩，沒有圖的維持原本純文字卡片）
  → 目前有真實圖片的：YARTIX（`yartix.png`，取自 repo 裡的 `frontend/static/www.png`）、
    FRC 機器人（`frc-robot.jpg`，2026-07 使用者提供的機體照片，選了拍機器人本體、
    沒有拍到人臉的那張——原本提供的 5 張裡有 4 張是隊員合照/自拍，會拍到其他真人的臉，
    沒有事先確認過那些隊友是否同意公開露臉，先不用，只用了純機體照)
  → 其餘 5 個作品缺截圖：FoodLens / 日圓匯率 / 記帳系統都是本機或已下線的服務，
    需要你自己跑起來截圖；自動跟隨機器人是實體硬體，需要你提供照片

- [ ] **Demo 連結欄位**
  projects.ts 加 `demo?` 欄位，FoodLens / 購票系統可附 live demo 或 YouTube 展示連結
  → 讓訪客直接體驗，而非只看文字
  → 查過 YARTIX 的 `render.yaml`，只有部署設定沒有找到目前還活著的公開網址，而且那是
    真實售票活動用的系統（處理過真人報名/付款資料），就算 Render 上還留著也不該公開連過去；
    FoodLens README 沒提到任何 live demo。這欄位目前沒有安全可用的真實連結可以填，先跳過

- [ ] **專案架構圖**
  每個作品加一張系統架構圖（Excalidraw / draw.io 匯出 SVG）
  → `/projects/[slug]` 詳細頁目前用條列文字呈現架構重點（從各專案真實 README 整理），
    不是視覺化 SVG 圖表，讓面試官「瞬間理解」的效果打了折扣。要做真的圖表需要你確認
    要不要投入時間畫（或用 AI 產生示意圖再微調），先維持文字版

- [ ] **履歷 PDF 下載**
  Contact section 加「下載履歷」按鈕，`public/resume.pdf`
  → 招募方第一個問的就是這個，獨立於上面幾項、隨時可做

- [ ] **技術部落格 / 筆記 `/blog`**
  寫過什麼就記下來：踩過的坑、學到的東西、對某個技術的想法
  → Next.js MDX + gray-matter，Markdown 寫文，自動生成頁面
  → 對 SEO 幫助最大，長期複利效果，但範圍最大，排最後

---

## 🟠 中優先 — 技術品質

- [ ] **Noto Serif JP 字體子集化** → 調查過，故意先不做，原因見下
  → 查了 build 產物：`next/font/google` 對 Noto Serif JP 其實已經自動切成 374 個
    `@font-face`（3 個字重 × 每個字重按 unicode-range 切成一百多塊），瀏覽器只會
    下載頁面上「實際出現的字」對應的那幾塊，不是整包 7.2MB 全下載，這部分已經是
    Google Fonts 內建幫你做掉的
  → 加 `text=` 參數會把這一百多塊壓成 1 塊更小的自訂子集，理論上更好，但實際試了發現
    這個字體不是只用在少數幾個固定的日文漢字標籤——`/projects/[slug]` 的 `<h1>`
    直接把 `project.titleZh`（動態、隨 `projects.ts` 增減專案而變）用這個字體渲染，
    其他 11 個檔案也有混用固定標籤跟動態內容。手動列一份「目前用到的字」的固定字元
    清單來 subset，之後你在 `projects.ts` 加新專案、標題用到清單外的字，就會悄悄
    fallback 到別的字體、你可能不會馬上發現——這種「現在測起來沒事，未來悄悄壞掉」
    的風險我不想在沒跟你確認前就引入，先維持現狀（Google Fonts 自動 unicode-range
    已經是合理的折衷）

- [ ] **部署通知**
  CI/CD 成功／失敗時發 Discord Webhook 或 LINE Notify，或直接寄 Email
  → 目前不知道遠端 build 有沒有炸
  → 若採 Email 通知，收件位址同上用 `otemon.pcwork@gmail.com`

- [ ] **Cloudflare 防火牆規則封鎖常見掃描路徑**
  → 2026-07 log 分析發現：10 天內 39% 的請求（7799 筆）是自動化漏洞掃描器打
    `/wp-admin`、`/.env*`、`/.git/config`、`/cgi-bin/luci` 這類路徑，全部正確
    404、沒有任何實際洩漏，屬於任何公開 IP 都會收到的網路背景雜訊，不是被鎖定攻擊
  → 加幾條 Cloudflare WAF/Firewall Rules 直接在邊緣擋掉這些已知路徑，能大幅減少
    log 雜訊、省一點頻寬，非緊急，詳見 `LOG分析.md` 第 2 節

- [ ] **零停機部署**
  → 2026-07 log 分析發現：20 次部署裡有 2 次在 Task Scheduler 重啟的瞬間交接空窗
    撞上少量請求，共 4 筆 500（占全部請求 0.02%），`verify-deploy.ps1` 每次都在
    重啟後立刻確認恢復正常，影響範圍很小
  → 目前架構（單一 process 給 Task Scheduler 直接管理）本來就無法完全避免這個
    空窗，要做到零停機需要雙 process 交替之類的架構改動，複雜度是否值得由你評估，
    詳見 `LOG分析.md` 第 3 節

---

## 🟡 中低優先 — UX 升級

- [ ] **聯絡表單**
  EmailJS 或 Formspree，訪客直接在頁面輸入留言
  → 不是每個人都有郵件客戶端
  → 曾做過 mailto 版但使用者覺得不需要，已移除；要做的話等你申請 EmailJS/Formspree 帳號再說

- [ ] **圖片燈箱（Lightbox）**
  專案詳細頁截圖點擊後放大，支援鍵盤左右切換
  → 自製或用 yet-another-react-lightbox（輕量）
  → 目前只有 YARTIX 一個作品有真實截圖可以點，其他 6 個要等「作品集截圖」那項補上圖片
    才有意義，先跳過

---

## 🟢 低優先 — 加分 & 個性

- [ ] **Analytics（Umami 自托管）**
  Docker 部署，隱私友好，無 cookie banner
  → 了解哪個 section 被看最久、哪個作品被點最多
  → 需要在桌機決定要不要跑 Docker、佔用資源，這個部署決定要你來拍板，先跳過

- [ ] **多語言路由（i18n）**
  `/ja`、`/zh` 路由，Next.js App Router i18n
  → 針對日本訪客完整日文版
  → 規模大（每頁都要日文全文翻譯＋路由架構），且跟目前「中文優先」語言方針要先對齊，先跳過，之後想做再開新的討論

- [ ] **開源貢獻 section**
  若有 PR 合併到外部 repo，GitHub API 自動拉取展示
  → 未來加分項
  → 抓「合併到別人 repo 的 PR」需要 GitHub Search API + 篩選邏輯，且要先確認你有沒有這類 PR 可展示，先跳過

- [ ] **GitHub README 同步**
  `kbs0830/kbs0830` profile README 設計與個人網站風格統一
  → 進 GitHub 主頁也有一致體驗
  → 這個改的是另一個 repo（`kbs0830/kbs0830`），不在這份 codebase 裡，先跳過

---

## ✅ 已完成

- [x] YARTIX 去識別化 & 改名為「購票系統」
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
- [x] LOG 分析（見 `LOG分析.md`）：10 天 log 顯示應用層 0 錯誤、20 次部署全成功；發現並修好
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
