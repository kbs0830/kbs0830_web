# TODO — kbs0830_web

---

## 🔴 高優先 — 內容 & 功能完整性

- [ ] **專案詳細頁 `/projects/[slug]`**
  點卡片目前沒有任何動作，無法呈現完整深度
  → App Router 動態路由，展示完整說明、截圖、技術挑戰、架構圖、GitHub 統計
  → 優先度提升：下面的「Demo 連結欄位」「專案架構圖」都是這個頁面的內容，中低優先的
    「頁面切換動畫」「圖片燈箱」也都卡在這個頁面還沒蓋，先做完這個能一次解鎖四項

- [ ] **作品集截圖 / Thumbnail**
  卡片純文字層次感偏低，加 thumbnail 後視覺差很多
  → 截圖放 `public/image/projects/`，在 projects.ts 加 `image?` 欄位

- [ ] **Demo 連結欄位**
  projects.ts 加 `demo?` 欄位，FoodLens / 購票系統可附 live demo 或 YouTube 展示連結
  → 讓訪客直接體驗，而非只看文字

- [ ] **專案架構圖**
  每個作品加一張系統架構圖（Excalidraw / draw.io 匯出 SVG）
  → 讓技術面試官瞬間理解你在做什麼

- [ ] **履歷 PDF 下載**
  Contact section 加「下載履歷」按鈕，`public/resume.pdf`
  → 招募方第一個問的就是這個，獨立於上面幾項、隨時可做

- [ ] **技術部落格 / 筆記 `/blog`**
  寫過什麼就記下來：踩過的坑、學到的東西、對某個技術的想法
  → Next.js MDX + gray-matter，Markdown 寫文，自動生成頁面
  → 對 SEO 幫助最大，長期複利效果，但範圍最大，排最後

---

## 🟠 中優先 — 技術品質

- [ ] **Noto Serif JP 字體子集化**
  日文字體完整版約 2–4 MB，對 LCP 影響很大
  → Google Fonts `text=` 參數只載入用到的字元

- [ ] **Image 格式優化**
  `public/image/大頭貼.jpg` 確認是否有 `sizes` 屬性、是否可轉 WebP
  → 改善 LCP 分數

- [ ] **Lighthouse 全站跑一次**
  Performance / Accessibility / Best Practices / SEO 四項目標全 90+
  → 找出低垂果實（圖片未壓縮、render-blocking font、缺 alt 等）

- [ ] **Uptime 監控**
  UptimeRobot 免費方案，每 5 分鐘 ping 一次，掛掉發 Email / LINE Notify
  → 桌機有時重開機會停服，要知道網站什麼時候斷了
  → Email 通知收件位址用 `otemon.pcwork@gmail.com`（自動通知專用信箱），不要用
    `1394kbs@gmail.com`（那個保留給真人聯絡）

- [ ] **部署通知**
  CI/CD 成功／失敗時發 Discord Webhook 或 LINE Notify，或直接寄 Email
  → 目前不知道遠端 build 有沒有炸
  → 若採 Email 通知，收件位址同上用 `otemon.pcwork@gmail.com`

---

## 🟡 中低優先 — UX 升級

- [ ] **聯絡表單**
  EmailJS 或 Formspree，訪客直接在頁面輸入留言
  → 不是每個人都有郵件客戶端
  → 曾做過 mailto 版但使用者覺得不需要，已移除；要做的話等你申請 EmailJS/Formspree 帳號再說

- [ ] **頁面切換動畫**
  進入 `/projects/[slug]` 詳細頁時加 slide-in / fade 過場
  → Framer Motion `AnimatePresence` + layout transitions
  → 卡住：前提的 `/projects/[slug]` 詳細頁還沒蓋（見高優先清單第一項），這項要等那個先做完

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

- [ ] **訪客地圖 / 來源統計小工具**
  Footer 或 About 顯示訪客地圖（Clustrmaps 嵌入）
  → 很多個人網站都有，增加互動感
  → 需要你先去 Clustrmaps 註冊帳號拿嵌入碼，先跳過

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

- [ ] **Playwright E2E 測試**
  測 NavBar 捲動行為、Email 複製 toast、暗色模式切換
  → CI 跑，push 前確保基本功能沒壞

- [ ] **Bundle Analyzer**
  `@next/bundle-analyzer`，看清楚哪個套件最肥
  → Three.js + R3F 可能可以動態 import 進一步拆分

- [ ] **Renovate Bot**
  GitHub App，自動開 PR 更新 npm 依賴
  → 保持套件新鮮，不要積累技術債

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
