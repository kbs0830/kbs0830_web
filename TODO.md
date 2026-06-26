# TODO — kbs0830_web

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
- [x] **NavBar active section 高亮**（IntersectionObserver）
- [x] **NavBar 行動端漢堡選單**（drawer 展開）
- [x] **Scroll progress bar**（頂端 2px accent 細線）
- [x] **3D 場景行動端停用**（< 768px 改顯示 CSS 漸層）
- [x] **Hero 初始閃白修正**（dynamic loading fallback）
- [x] **返回頂端按鈕**（BackToTop）
- [x] **OG 社群預覽圖**（opengraph-image.tsx 動態生成）
- [x] **HeroScene 效能修正**（useMemo）
- [x] **ProjectCard hover lift**（hover:-translate-y-1）
- [x] **時間軸 dot 依序出現**（per-item stagger animation）
- [x] **Skills tag hover**（hover accent border + text）
- [x] **Favicon 自訂**（icon.tsx，PL 靛藍）
- [x] **prefers-reduced-motion 支援**（globals.css）
- [x] **鍵盤 focus-visible 樣式**（globals.css）
- [x] **Email 複製回饋**（clipboard + 已複製！toast）
- [x] **暗色模式**（CSS variable + localStorage toggle）

---

## 🟡 待辦

- [ ] **作品集截圖**
  卡片純文字層次感偏低，加 thumbnail 後差很多
  → 截圖放 `public/image/projects/`，在 projects.ts 加 `image?` 欄位（需自行截圖）

- [ ] **Vercel Analytics**
  → 目前為自托管架構，需改用其他方案（如 Umami / Plausible）
