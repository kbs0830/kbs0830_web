# TODO — kbs0830_web

---

## 🔴 高優先 — 內容 & 功能完整性

- [ ] **作品集截圖 / Thumbnail**
  卡片純文字層次感偏低，加 thumbnail 後視覺差很多
  → 截圖放 `public/image/projects/`，在 projects.ts 加 `image?` 欄位

- [ ] **專案詳細頁 `/projects/[slug]`**
  點卡片目前沒有任何動作，無法呈現完整深度
  → App Router 動態路由，展示完整說明、截圖、技術挑戰、架構圖

- [ ] **Demo 連結欄位**
  projects.ts 加 `demo?` 欄位，FoodLens / 購票系統可附 live demo 或 YouTube 展示連結
  → 讓訪客直接體驗，而非只看文字

- [ ] **履歷 PDF 下載**
  Contact section 加「下載履歷」按鈕，`public/resume.pdf`
  → 招募方第一個問的就是這個

---

## 🟠 中優先 — 技術品質

- [ ] **自訂 404 頁面**
  `src/app/not-found.tsx`，日式風格，帶回首頁按鈕
  → 目前是 Next.js 預設，體驗很破碎

- [ ] **Security Headers**
  `next.config.ts` 加 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`
  → 基本防護 + Google 安全評分

- [ ] **Noto Serif JP 字體子集化**
  日文字體完整版約 2–4 MB，對 LCP 影響很大
  → 用 `subset-iCal` 或 Google Fonts `text=` 參數只載入用到的字

- [ ] **favicon.ico 清除**
  `src/app/` 同時有靜態 `favicon.ico` 和動態 `icon.tsx`
  → 刪掉舊的 `favicon.ico`，只保留 `icon.tsx`

- [ ] **Error Boundary for R3F**
  HeroScene 若 WebGL 不支援或崩潰，目前整個頁面會白屏
  → 加 React Error Boundary，fallback 到 CSS 漸層背景

- [ ] **Image 格式優化**
  `public/image/大頭貼.jpg` 確認是否有 `sizes` 屬性、是否可轉 WebP
  → 改善 LCP 分數

- [ ] **Lighthouse 全站跑一次**
  Performance / Accessibility / Best Practices / SEO 四項目標全 90+
  → 找出低垂果實（圖片未壓縮、render-blocking font、缺 alt 等）

---

## 🟡 中低優先 — UX 升級

- [ ] **專案 Tag 篩選**
  Portfolio section 加 filter bar，依 tag（Python / Next.js / AI…）篩選卡片
  → 讓技術面試官快速找到相關作品

- [ ] **聯絡表單**
  EmailJS 或 Formspree，訪客直接在頁面輸入留言
  → 不是每個人都有郵件客戶端

- [ ] **Hero 副標動態打字效果**
  `学生開発者 · Claude × Gemini` 改為逐字顯示的 typewriter 效果
  → 只需 Framer Motion `staggerChildren`，成本低但視覺感強

- [ ] **Skills 分類可展開 / 收合**
  技能列表目前全展開，加 accordion 讓頁面不那麼長
  → 特別是手機版，改善捲動體驗

- [ ] **About 時間軸：hover 展開更多細節**
  目前每筆只有兩行，hover 可展開更多說明（英文補充、成果數據）

- [ ] **Print / PDF 樣式**
  `@media print` CSS，隱藏 3D / NavBar / 動畫，排成 A4 履歷格式
  → 打招呼用

- [ ] **頁面 Loading 骨架屏**
  首次載入時，Suspense fallback 改為 skeleton 而非空白
  → 特別是 Portfolio 卡片區塊

---

## 🟢 低優先 — 加分項目

- [ ] **Analytics（Umami 自托管）**
  Docker 或直接部署，隱私友好，無 cookie banner
  → 了解哪個 section 被看最久、哪個作品被點最多

- [ ] **PWA Manifest**
  `src/app/manifest.ts`，讓手機版可「加到主畫面」
  → 圖示、名稱、主題色

- [ ] **/now 頁面**
  `/now` — 當下在做什麼、在學什麼、在聽什麼
  → 個人風格標誌，類似 nownownow.com 傳統

- [ ] **/uses 頁面**
  `/uses` — 開發環境、硬體、軟體、工具清單
  → 工程師圈很受歡迎的頁面類型

- [ ] **GitHub 貢獻熱力圖**
  About section 嵌入 contribution graph（GitHub Readme Stats 或自製 SVG fetch）
  → 視覺化開發活躍度

- [ ] **暗色模式 OG image**
  目前 opengraph-image.tsx 固定亮色背景
  → 可依系統偏好動態切換（`prefers-color-scheme` in ImageResponse）

- [ ] **多語言路由（i18n）**
  `/ja`、`/zh` 路由，Next.js App Router i18n 支援
  → 針對日本訪客完整日文版（目前只有日文點綴）

- [ ] **Keyboard Shortcuts**
  `G` → GitHub、`E` → Email、`1/2/3` → section 快速跳轉
  → 工程師喜歡的細節

- [ ] **彩蛋（Easter Egg）**
  Konami Code 觸發特殊動畫或隱藏訊息
  → 展示個性，技術訪客會注意到

- [ ] **開源貢獻 section**
  若有 PR 合併到外部 repo，獨立區塊展示
  → 未來加分項

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
