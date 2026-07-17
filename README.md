# kbs0830_web — PINGWEI LI Personal Website

個人作品集網站，部署於桌機本地端（RTX 3070 + i7-12700），透過 Cloudflare Tunnel 對外提供服務。

**Live:** https://kbs0830.com

---

## 開發流程

```
筆電修改 → git push → GitHub Actions 自動觸發 → 桌機 pull + build + restart
```

### 本機開發
```powershell
node node_modules/next/dist/bin/next dev
```

commit 前會自動跑 Husky pre-commit hook（`lint-staged` + 全專案 `tsc --noEmit`），
擋下型別錯誤或壞掉的程式碼，細節見 `CLAUDE.md`。

想看哪個套件佔了多少 bundle 大小：`pnpm analyze`。沒用 `@next/bundle-analyzer`——
它官方明講不支援 Turbopack（這專案的 build 就是走 Turbopack），改用 Next 16 內建的
`next experimental-analyze`，跑起來會開一個互動式 treemap 網頁（預設 port 4000）。

E2E 測試：`pnpm test:e2e`（Playwright，`e2e/*.spec.ts`）。CI 是獨立的
`.github/workflows/e2e.yml`，跟部署 pipeline 平行跑、不會互相擋，細節見 `CLAUDE.md`。

### 手動部署（桌機）
```powershell
.\deploy.bat
```

---

## 部署架構

```
訪客 → https://kbs0830.com
      → Cloudflare CDN + HTTPS
      → Cloudflare Tunnel（outbound，繞過 ISP port 封鎖）
      → localhost:3000（Next.js production server）
```

### 服務清單（桌機）

| 服務 | 管理方式 | 說明 |
|---|---|---|
| Next.js | 工作排程器 `kbs0830_NextJS` | port 3000，Action 直接執行 `node.exe scripts\server.js`（不可加 wrapper，見 CLAUDE.md） |
| Cloudflare Tunnel | Windows 服務 `Cloudflared` | Tunnel ID: `925b8046-8d6f-487f-8a88-70bb3d70410c` |
| GitHub Actions Runner | 工作排程器 `GitHubActionsRunner` | `C:\actions-runner` |
| 健康監控 Watchdog | 工作排程器 `kbs0830_Watchdog` | 每 5 分鐘跑 `scripts\watchdog.ps1`，異常自動重啟 Next.js |

重啟 Next.js 一律透過 `Stop-ScheduledTask` / `Start-ScheduledTask`，不要直接 `taskkill /im node.exe`
（會 access denied，且殺不乾淨孤兒行程，細節見 `CLAUDE.md`）。

### 開機自動啟動
四個服務皆已設定開機/登入自動啟動，重開機後無需手動操作。

手動一鍵啟動（若需要）：
```
start-server.bat
```

---

## 自動部署（CI/CD）

GitHub Actions self-hosted runner 跑在桌機上。

push 到 `main` branch 後自動執行（`scripts/deploy.ps1`）：
1. `git pull origin main`
2. `pnpm install`
3. `next build`
4. 透過 Task Scheduler 重啟 `kbs0830_NextJS`
5. `scripts/verify-deploy.ps1` 健康檢查（首頁 200、JS chunk 載得到）——沒過就算部署失敗，
   不會悄悄留著壞掉的網站沒人發現

Workflow 設定：`.github/workflows/deploy.yml`；手動部署 `deploy.bat` 呼叫同一份
`deploy.ps1`，跟 CI 共用邏輯。

另有 `.github/workflows/renovate.yml`：每週一用同一台 self-hosted runner 自動跑 Renovate
開 dependency update PR（不需要裝 GitHub App，也不會自動合併），細節見 `CLAUDE.md`。

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

---

## Spotify「正在聽」設定

About section 的 Spotify 小工具需要三個環境變數（`.env.local`，不進版控，範本見
`.env.local.example`）：

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` 從 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
的 app 設定頁取得；`SPOTIFY_REFRESH_TOKEN` 用 `scripts/spotify-get-refresh-token.js` 取得：

```powershell
node scripts/spotify-get-refresh-token.js          # 印出授權網址，登入同意
node scripts/spotify-get-refresh-token.js <code>   # 用導回網址裡的 code 換 refresh token
```

三個變數缺任何一個時，`/api/spotify/now-playing` 直接回傳 `isPlaying:false`，前端不顯示，
不影響其他功能。改完環境變數要重啟 server 才會生效。

---

## 訪客來源統計

Footer 的訪客統計不用第三方服務（不需要註冊帳號）：`scripts/server.js` 讀 Cloudflare Tunnel
本來就帶著的 `cf-ipcountry` header，只聚合「國家代碼＋次數」寫進 `data/visitor-stats.json`
（不進版控，只留在桌機本地，不存 IP、不存任何個人可識別資訊）。`/api/visitor-stats` 吐彙總
資料給 `VisitorStats.tsx` 顯示。細節見 `CLAUDE.md`。

---

## 技術部落格與履歷 PDF

`/blog`：文章放在 `content/blog/*.mdx`（frontmatter 用 `gray-matter` 解析），`next-mdx-remote/rsc`
渲染。新增文章請放真的踩過的坑，不要為了湊數編內容。

`/resume`：內容取自網站上已有的真實資料（教育／技能／作品），套用既有的 `@media print` 樣式。
`public/resume.pdf` 是靜態快照，**改了 `/resume` 頁面內容不會自動更新 PDF**，要記得重跑：

```powershell
pnpm resume:pdf                              # 預設打 http://localhost:3000
node scripts/generate-resume-pdf.js <url>    # 或指定其他 URL（例如本機 next dev 的 port）
```

---

## 注意事項

- pnpm v11：`dev` / `build` / `start` 直接呼叫 `node node_modules/next/dist/bin/next`
- ISP 封鎖 inbound port 80/443，故改用 Cloudflare Tunnel
- 區網內裝置需將 DNS 改為 `8.8.8.8` 才能解析 `kbs0830.com`
- 待辦事項與優先順序見 `TODO.md`；架構細節、設計規範、踩過的坑見 `CLAUDE.md`
