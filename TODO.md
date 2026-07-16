# TODO — kbs0830_web

---

## 🔴 高優先 — 內容 & 功能完整性

- [ ] **作品集截圖 / Thumbnail**
  卡片純文字層次感偏低，加 thumbnail 後視覺差很多
  → 截圖放 `public/image/projects/`，在 projects.ts 加 `image?` 欄位

- [ ] **專案詳細頁 `/projects/[slug]`**
  點卡片目前沒有任何動作，無法呈現完整深度
  → App Router 動態路由，展示完整說明、截圖、技術挑戰、架構圖、GitHub 統計

- [ ] **Demo 連結欄位**
  projects.ts 加 `demo?` 欄位，FoodLens / 購票系統可附 live demo 或 YouTube 展示連結
  → 讓訪客直接體驗，而非只看文字

- [ ] **履歷 PDF 下載**
  Contact section 加「下載履歷」按鈕，`public/resume.pdf`
  → 招募方第一個問的就是這個

- [ ] **技術部落格 / 筆記 `/blog`**
  寫過什麼就記下來：踩過的坑、學到的東西、對某個技術的想法
  → Next.js MDX + gray-matter，Markdown 寫文，自動生成頁面
  → 對 SEO 幫助最大，長期複利效果

- [ ] **專案架構圖**
  每個作品加一張系統架構圖（Excalidraw / draw.io 匯出 SVG）
  → 讓技術面試官瞬間理解你在做什麼

---

## 🟠 中優先 — 技術品質

- [x] **自訂 404 頁面**
  `src/app/not-found.tsx`，日式風格，帶回首頁按鈕

- [x] **Security Headers**
  `next.config.ts` 加 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`

- [ ] **Noto Serif JP 字體子集化**
  日文字體完整版約 2–4 MB，對 LCP 影響很大
  → Google Fonts `text=` 參數只載入用到的字元

- [x] **favicon.ico 清除**
  刪掉舊的 `favicon.ico`，只保留 `icon.tsx`（並擴充 32/192/512 三種尺寸供 manifest 使用）

- [x] **Error Boundary for R3F**
  HeroScene 加 `SceneErrorBoundary`，WebGL 崩潰時 fallback 到 CSS 漸層背景

- [ ] **Image 格式優化**
  `public/image/大頭貼.jpg` 確認是否有 `sizes` 屬性、是否可轉 WebP
  → 改善 LCP 分數

- [ ] **Lighthouse 全站跑一次**
  Performance / Accessibility / Best Practices / SEO 四項目標全 90+
  → 找出低垂果實（圖片未壓縮、render-blocking font、缺 alt 等）

- [x] **Twitter / X Card meta tag**
  `layout.tsx` metadata 加 `twitter` 欄位

- [ ] **Uptime 監控**

  UptimeRobot 免費方案，每 5 分鐘 ping 一次，掛掉發 Email / LINE Notify
  → 桌機有時重開機會停服，要知道網站什麼時候斷了

- [ ] **部署通知**
  CI/CD 成功／失敗時發 Discord Webhook 或 LINE Notify
  → 目前不知道遠端 build 有沒有炸

---

## 🟡 中低優先 — UX 升級

- [x] **專案 Tag 篩選**
  Portfolio section 加 filter bar，依 tag（Python / Next.js / AI…）篩選卡片
  → 讓技術面試官快速找到相關作品

- [x] **聯絡表單**
  無後端依賴的 mailto 版：填姓名／訊息後組 `mailto:` 連結開啟本機郵件客戶端
  → 如果之後想要「不離開頁面直接送出」，仍可換成 EmailJS / Formspree（需要你申請帳號）

- [x] **Hero 副標動態打字效果**
  `学生開発者 · Claude × Gemini` 改為逐字顯示的 typewriter 效果
  → 只需 Framer Motion `staggerChildren`，成本低但視覺感強

- [x] **Hero 3D 場景互動**
  場景隨游標位置微微傾斜（lerp 平滑），尊重 prefers-reduced-motion
  → 讓 Hero 從裝飾變成可互動的名片

- [x] **Skills 分類可展開 / 收合**
  技能列表改 accordion（預設只展開第一組），標題列可點擊切換
  → 特別是手機版

- [x] **About 時間軸：hover 展開更多細節**
  每筆項目 hover / click（含鍵盤 Enter/Space）展開一行補充說明

- [x] **Skills 熟練度視覺化**
  每個技能 chip 內加 1–5 點的細小圓點指示熟練度
  → 設計上要克制，用細線而非粗進度條
  → 熟練度數字是我依專案經驗estimate 的初稿，數字本身你比我更清楚，有需要再調

- [x] **Print / PDF 樣式**
  `@media print` CSS，隱藏 3D / NavBar / 動畫，排成 A4 履歷格式

- [x] **頁面 Loading 骨架屏**
  Hero 3D 場景載入中改成呼應真實場景的稀疏細線骨架屏，不再是空白

- [x] **Scroll-triggered 文字逐字揭示**
  About / Portfolio / Contact 三個 section 標題改逐字 reveal 動畫進場
  → Framer Motion `staggerChildren`，日式設計感很強

- [x] **磁吸按鈕效果（Magnetic Button）**
  Hero 兩顆 CTA ＋ Contact 四個連結，滑鼠靠近時微微吸引游標
  → mousemove 計算偏移量，translate3d 實現，無需額外函式庫

- [x] **自訂滾動條樣式（Mobile）**
  Firefox 加 `scrollbar-color` / `scrollbar-width`

- [ ] **頁面切換動畫**
  進入 `/projects/[slug]` 詳細頁時加 slide-in / fade 過場
  → Framer Motion `AnimatePresence` + layout transitions
  → 卡住：前提的 `/projects/[slug]` 詳細頁還沒蓋（見高優先清單），這項要等那個先做完

- [ ] **圖片燈箱（Lightbox）**
  專案詳細頁截圖點擊後放大，支援鍵盤左右切換
  → 自製或用 yet-another-react-lightbox（輕量）
  → 卡住：同上，依賴 `/projects/[slug]` 詳細頁

---

## 🟢 低優先 — 加分 & 個性

- [ ] **Analytics（Umami 自托管）**
  Docker 部署，隱私友好，無 cookie banner
  → 了解哪個 section 被看最久、哪個作品被點最多
  → 需要在桌機決定要不要跑 Docker、佔用資源，這個部署決定要你來拍板，先跳過

- [x] **PWA Manifest**
  `src/app/manifest.ts`，讓手機版可「加到主畫面」

- [x] **/now 頁面**
  當下在做什麼、在學什麼
  → 類似 nownownow.com 傳統

- [x] **/uses 頁面**
  開發環境、硬體（RTX 3070 / Zenbook A14）、軟體、工具清單

- [x] **GitHub 貢獻熱力圖**
  About section 嵌入公開無需驗證的 ghchart.rshah.org contribution graph
  → 視覺化開發活躍度，證明你在動
  → 該服務只吐白底 SVG（不隨主題變色），暗色模式下是一塊白色卡片，算是可接受的取捨；有帳號的話之後可換 GitHub 官方 API 自己畫、跟著主題切換

- [ ] **Spotify 正在聽**
  用 Spotify API 顯示「目前正在播放」或「最近在聽」
  → 裝飾性但很有個性，讓作品集有生命感
  → 需要你去 Spotify Developer Dashboard 申請 Client ID/Secret，我這邊沒有帳號無法自己申請，先跳過

- [ ] **訪客地圖 / 來源統計小工具**
  Footer 或 About 顯示訪客地圖（Clustrmaps 嵌入）
  → 很多個人網站都有，增加互動感
  → 需要你先去 Clustrmaps 註冊帳號拿嵌入碼，先跳過

- [x] **Keyboard Shortcuts**
  `G` → GitHub、`E` → Email、`1/2/3` → section 快速跳轉
  → 工程師喜歡的細節，加 `?` 呼出快捷鍵提示浮窗

- [x] **彩蛋：Konami Code**
  ↑↑↓↓←→←→BA 觸發「ようこそ」日文歡迎詞全螢幕彩蛋
  → 展示個性，技術訪客一定會試

- [x] **彩蛋：終端機模式**
  按 `` ` `` 叫出偽終端機，輸入指令可查看作品集資訊
  → `help` / `ls projects` / `cat about.txt` / `ssh kbs0830@kbs0830.com`
  → 很 hacker，和你的技術背景超搭

- [x] **時區 / 現地時間顯示**
  Footer 顯示高雄 + 福岡雙時區現地時間，每 30 秒更新
  → 一句 JS，視覺效果很好

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

## 🛠 開發體驗

- [ ] **Bundle Analyzer**
  `@next/bundle-analyzer`，看清楚哪個套件最肥
  → Three.js + R3F 可能可以動態 import 進一步拆分

- [ ] **Husky + lint-staged**
  commit 前自動跑 `tsc --noEmit` + `eslint`
  → 防止 broken build 推上去

- [ ] **Renovate Bot**
  GitHub App，自動開 PR 更新 npm 依賴
  → 保持套件新鮮，不要積累技術債

- [ ] **Playwright E2E 測試**
  測 NavBar 捲動行為、Email 複製 toast、暗色模式切換
  → CI 跑，push 前確保基本功能沒壞

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
