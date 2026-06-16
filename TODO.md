# TODO — kbs0830_web

---

## 🔴 高優先 — 導覽 & 定向

- [ ] **NavBar active section 高亮**
  IntersectionObserver 偵測目前位置，對應 nav item 顏色亮起
  → 使用者不知道自己捲到哪個 section

- [ ] **NavBar 行動端選單**
  手機版三個日文字 gap-8 可能溢出，需要漢堡選單或 drawer
  → S24+ 上需確認

- [ ] **Scroll progress bar**
  頁面頂端 1px accent 細線，隨捲動 scaleX 填滿
  → 長頁面需要進度回饋，實作成本低

---

## 🟠 中優先 — 畫面體驗

- [ ] **3D 場景行動端停用**
  手機仍載入 R3F + Three.js（約 400KB），耗電可能 lag
  → 偵測 mobile 改顯示靜態 CSS 漸層，維持視覺不犧牲效能

- [ ] **Hero 初始閃白修正**
  R3F 非同步載入期間 Hero 背景是白色
  → 加 `suspense fallback` 或先用 CSS 底色撐住

- [ ] **返回頂端按鈕**
  捲動超過一螢幕後右下角出現
  → About 加了時間軸 + Skills 後頁面很長，必要

- [ ] **OG 社群預覽圖**
  `og:image` 未設定，分享到 LINE / FB 時沒有縮圖
  → 純文字靜態圖放 `public/og.png` 即可

- [ ] **HeroScene 效能修正**
  `Lines` 元件在 JSX 裡呼叫 `new THREE.BufferGeometry()`
  每次 re-render 建新物件，應移進 `useMemo`
  → 目前不影響 FPS 但有 GC 壓力

---

## 🟡 中低優先 — UI 細節

- [ ] **ProjectCard hover lift**
  目前 hover 只有上方 accent 線展開
  → 加 `hover:-translate-y-1 transition-transform` 讓卡片微浮起

- [ ] **作品集截圖**
  卡片純文字層次感偏低，加 thumbnail 後差很多
  → 截圖放 `public/image/projects/`，在 projects.ts 加 `image?` 欄位

- [ ] **時間軸 dot 依序出現**
  目前整塊一起 fade in，每個 dot 加 delay 依序進場
  → 強化「流動感」

- [ ] **Skills tag hover**
  目前 hover 無反應
  → 加 `hover:border-[--accent] hover:text-[--accent]` 統一互動感

- [ ] **Favicon 自訂**
  目前 Next.js 預設，開多個分頁時無法識別
  → 換成 `PL` 文字 icon

---

## 🟢 低優先 — 使用者體驗

- [ ] **prefers-reduced-motion 支援**
  部分使用者設定關閉動畫（前庭覺問題）
  → `globals.css` 加 `@media (prefers-reduced-motion: reduce)` 全域關閉

- [ ] **鍵盤 focus-visible 樣式**
  tab 鍵導覽時目前無明顯 focus 框
  → `globals.css` 加 `:focus-visible { outline: 2px solid var(--accent); }`

- [ ] **Email 複製回饋**
  點擊 Email 按鈕時同時複製到剪貼簿並顯示「已複製！」1 秒
  → 使用者不一定有郵件客戶端

- [ ] **暗色模式**
  CSS variable 切換，右上角 toggle
  → 深夜瀏覽視覺負擔大

- [ ] **Vercel Analytics**
  了解哪個 section 被看最久、哪個作品被點最多

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
