# kbs0830_web — PINGWEI LI Personal Website

個人作品集網站。日式簡約設計，動態 3D 背景，部署於桌機本地端（RTX 3070 + i7-12700）直接以 Next.js server 執行。

---

## Owner Profile

| | |
|---|---|
| Display name | **PINGWEI LI**（不顯示中文本名） |
| GitHub | kbs0830 |
| Email | 1394kbs@gmail.com |
| Base | 高雄，台灣 🇹🇼 ↔ 福岡，日本 🇯🇵 |
| Background | Python (FastAPI, Flask)、ML (YOLOv8, ONNX, Gemini)、Web (Next.js, React, TS) |

---

## Design Direction

**Theme:** 日式簡約（Japanese minimalism）— 大量留白、細緻排版、克制的動態。

| Token | Value |
|---|---|
| Background | `#fafaf8` 暖白 |
| Surface | `#f0ede8` 紙感底色 |
| Text | `#1a1a1a` 近黑 |
| Muted | `#6b6b6b` 次要文字 |
| Accent | `#2d5a8e` 深靛藍（唯一強調色） |
| Accent light | `#e8f0f8` hover / 背景 tint |
| Font serif | Noto Serif JP（標題、日文字） |
| Font sans | Geist（內文） |
| Font mono | Geist Mono（標籤、狀態文字） |

**設計原則：**
- 間（Ma）— 留白即設計，不擠滿
- 引き算 — 持續刪減到恰到好處
- 動畫克制：gentle fade-in + Y-translate，不跳不彈
- 3D 場景：稀疏細線 + 低密度粒子，慢速旋轉（非粒子爆炸）
- 60fps 硬性目標

**語言方針：**
- 中文優先，英文次之（雙語標題格式：`中文 · English`）
- 日文漢字點綴：用台灣人一看就懂的日文漢字增加日式感（如：自己紹介、製作物、連絡先、学習中、得意分野、開発環境）
- NavBar 用日文漢字：`自己紹介` / `製作物` / `連絡先`
- 個人名稱只用 `PINGWEI LI`，不顯示中文本名
- 日語程度：N5 学習中（非 N3）

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| 3D / WebGL | Three.js + React Three Fiber + Drei |
| Animation | Framer Motion |
| Styling | Tailwind CSS v4 |
| Package manager | pnpm 11 |
| Tunnel | Cloudflare Tunnel (cloudflared) |
| DNS | Cloudflare |

### pnpm 注意事項

pnpm v11 native build 限制：`sharp` 和 `unrs-resolver` 需要 build scripts。
目前解法：`dev` / `build` / `start` scripts 改為直接呼叫 `node node_modules/next/dist/bin/next`，繞過 pnpm 的 pre-run install check。

```bash
# 啟動 dev server
node node_modules/next/dist/bin/next dev
# 或用 pnpm（會跳 warning 但可用）
pnpm dev
```

---

## 部署架構

**Live URL:** https://kbs0830.com

```
訪客 → Cloudflare CDN → Cloudflare Tunnel → localhost:3000（Next.js）
```

ISP 封鎖 inbound port 80/443，改用 Cloudflare Tunnel（outbound）繞過。

### 桌機服務（開機自動啟動）

| 服務 | 管理方式 |
|---|---|
| Next.js (port 3000) | 工作排程器 `kbs0830_NextJS` |
| Cloudflare Tunnel | Windows 服務 `Cloudflared` |
| GitHub Actions Runner | 工作排程器 `GitHubActionsRunner`，位於 `C:\actions-runner` |

### CI/CD

push 到 `main` → GitHub Actions self-hosted runner → pull + build + restart 全自動。
Workflow: `.github/workflows/deploy.yml`

### 手動啟動

```powershell
# 一鍵啟動 Next.js + Tunnel
start-server.bat

# 手動部署（pull + build + restart）
deploy.bat
```

### 區網存取問題

區網內裝置需將 DNS 改為 `8.8.8.8` 才能解析 `kbs0830.com`（路由器 DNS 快取問題）。

---

## Site Sections

### 1. Hero
- 全螢幕 R3F 3D 背景：稀疏細線 + 靛藍粒子，慢速旋轉
- 標題：`PINGWEI LI`（大字，無本名）
- 副標：`AI 工程師 · 網頁開發者`（中文優先）
- CTA：`查看作品 · View Work` / `聯絡我 · Contact`

### 2. About（自己紹介 · 關於我）
- 中文主文（高雄↔福岡生活、AI+Web 交叉點）
- 英文補充說明
- Status card：現況、地點、日語學習
- Skills 分類（5 組）：AI/ML、後端、前端、工具、目前學習中

### 3. 製作物（作品集）

**分兩區塊：個人専案 ／ 課程専題**

個人専案（`isPersonal: true`）：
- **FoodLens Advisor**：YOLOv8 + Gemini AI，影像留本機，隱私優先，薄客戶端架構
- **YARTIX Ticketing**：Flask 活動報名售票系統（台灣鐵道文化意象），LINE/Email 付款、Google Sheets

課程専題（school 私有倉庫 `kbs0830/school`，位於桌面 `C:\Users\1394k\Desktop\school`）：
- **日圓匯率分析系統**：Flask + SQLite + 多銀行並行爬蟲 + Yahoo Finance API + LKG 容錯 + 購買力決策引擎
- **個人記帳分析系統**：PyQt5 + SQLite 桌機 GUI，程式設計三小組専題（2026/01）
- **麵包店電商網站**：PHP + MySQL 購物車，一下 HTML 課程
- **學習記録總覽**：HTML/CSS/PHP、Python、資料庫、大數據、AI 深度學習、投資決策

狀態標籤：`完成`（靛藍）/ `製作中`（琥珀）/ `課程専題`（紫）/ `學習記録`（灰）
底部日文備注：「学習記録は非公開リポジトリに保存されています。」

### 4. Contact（連絡先）
- 中文主文，英文次之
- Email + GitHub 按鈕

---

## Project Structure

```
kbs0830_web/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Noto Serif JP + Geist 字體，lang="zh-Hant"
│   │   ├── page.tsx           # 組合所有 sections
│   │   └── globals.css        # CSS variables 設計系統
│   ├── components/
│   │   ├── canvas/
│   │   │   └── HeroScene.tsx  # R3F 3D 背景（細線 + 粒子）
│   │   ├── ui/
│   │   │   └── NavBar.tsx     # 固定導覽列，scroll 後半透明
│   │   └── sections/
│   │       ├── HeroSection.tsx
│   │       ├── AboutSection.tsx
│   │       ├── PortfolioSection.tsx
│   │       └── ContactSection.tsx
│   └── lib/
│       └── projects.ts        # 作品資料（slug, title, tags, github...）
├── pnpm.yaml                  # onlyBuiltDependencies config（pnpm v11）
├── CLAUDE.md
└── package.json
```

---

## Key Constraints

1. **名稱**：只用 `PINGWEI LI`，不寫中文本名
2. **語言**：中文優先，雙語格式 `中文 · English`
3. **顏色**：`#2d5a8e` 是唯一強調色，用量克制
4. **動畫**：subtle only，60fps，不跳不彈不閃
5. **環境**：筆電開發（Windows 11）→ git push → 桌機自動部署（GitHub Actions self-hosted runner）
6. **字元支援**：繁體中文 + 日文（Noto Serif JP）
