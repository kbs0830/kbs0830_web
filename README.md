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
| Next.js | 工作排程器 `kbs0830_NextJS` | port 3000 |
| Cloudflare Tunnel | Windows 服務 `Cloudflared` | Tunnel ID: `925b8046-8d6f-487f-8a88-70bb3d70410c` |
| GitHub Actions Runner | 工作排程器 `GitHubActionsRunner` | `C:\actions-runner` |

### 開機自動啟動
三個服務皆已設定開機/登入自動啟動，重開機後無需手動操作。

手動一鍵啟動（若需要）：
```
start-server.bat
```

---

## 自動部署（CI/CD）

GitHub Actions self-hosted runner 跑在桌機上。

push 到 `main` branch 後自動執行：
1. `git pull origin main`
2. `pnpm install`
3. `next build`
4. 重啟 Next.js server

Workflow 設定：`.github/workflows/deploy.yml`

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

## 注意事項

- pnpm v11：`dev` / `build` / `start` 直接呼叫 `node node_modules/next/dist/bin/next`
- ISP 封鎖 inbound port 80/443，故改用 Cloudflare Tunnel
- 區網內裝置需將 DNS 改為 `8.8.8.8` 才能解析 `kbs0830.com`
