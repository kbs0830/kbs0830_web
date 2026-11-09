# TODO — kbs0830_web

這裡**只放還沒做的**；做完的搬到 [DONE.md](DONE.md)（2026-11-09 拆開）。
做完任何一項跟 Claude 說，它會回查、從這裡刪掉、記進 DONE.md。

📬 有日期的項目會自動寄提醒信到 otemon（`reminders.json`）：11/12 匯出檢索統計、11/18 Web Vitals、
2026 年底 GHA 鈦金、2027/04/18 網域續約、2027/08/31 年級更新、2027 年底 IHG 酒廊、2028 年底華航金卡。

---

## 🙋 你要動手的（要你的帳號或管理員權限，Claude 做不到）

1. [ ] **Search Console 看驗證結果** 🔴 11/05 按了「驗證修正」，顯示「驗證中」是正常的，~11/19 前看結果，不用再按
   → 網站自己的紀錄 11/06 起 Googlebot 已經回來爬了；11/12 有提醒信叫你匯出「檢索統計資料」（檢索次數回升、5xx 歸零＝恢復）
2. [ ] **Bing 收錄回查**：Bing 搜 `site:kbs0830.com` 有結果、或 Bing Webmaster → URL Inspection 顯示「Indexed」才算數；
   還是「Discovered but not crawled」就把畫面給 Claude
3. [ ] **IG 簡介放網站連結** 🟠
4. [ ] **Cloudflare 的 HTTP→HTTPS 導向** 🟡 現在 `http://kbs0830.com/` 200、`http://www.kbs0830.com/` 404
   → Rules → Overview →「Redirect from HTTP to HTTPS」範本 → **Deploy**（不是 Save as Draft）；
     或 SSL/TLS → Edge Certificates → Always Use HTTPS 打開
   → 生效後再打開 **HSTS**（同一頁）
5. [ ] **網域續約** 🟡 kbs0830.com 在 Cloudflare Registrar，**2027-05-18 到期**（4/18 有提醒信）
   → Domain Registration → Manage：Auto-renew 開著、信用卡到時候還有效（過期＝整站全斷）
6. [ ] **UptimeRobot 監控設定** 🟡 10 月月報 0%，但實際只斷約 4 天——監控本身設錯（告警信有寄出、你有收到）
7. [ ] **cloudflared 升級**（log 每天在提醒）：系統管理員 PowerShell 跑
   `Stop-Service Cloudflared` → `winget upgrade Cloudflare.cloudflared` → `Start-Service Cloudflared`
8. [ ] **GitHub 門面**（改的是別的 repo）
   → pin `FoodLens-Advisor`、`YARTIX-TICKETING-TEST`；這兩個的 README 補截圖／架構圖／安裝步驟
   → profile README（`kbs0830/kbs0830`）做成跟網站一樣的風格（要做 Claude 可以幫忙寫）

## 🤔 你要決定或提供素材的

**內容**
- [ ] **定位一句話**：Hero 副標要不要從「学生開発者 · Claude × Gemini」改成「Full-stack Developer · AI × Web」之類
  （2026-07 外部 review 的第 1 點）。決定後同步改 title／OG／JSON-LD `jobTitle`／履歷
- [ ] **`/now` 更新**：內容從 7 月沒動過，告訴 Claude 現在在忙什麼；順便加「最後更新」日期
- [ ] **作品截圖**：FoodLens／日圓匯率／記帳系統（不要有真人臉、個資）。有截圖之後才值得做「圖片點擊放大」
- [ ] **作品量化成果**：購票系統處理過幾筆報名、匯率系統整合幾家銀行、並行爬蟲快多少…**有真的數字才放**
- [ ] **履歷要不要加證照／經歷**（之前問過還沒回）
- [ ] **履歷高中英文校名**：現在寫 Kaohsiung Municipal Zhongzheng Vocational High School，要跟證書一致的話給 Claude 官方英文名
- [ ] **機型**：想記哪班的機型，給 Claude 航班代碼＋機型（`/flights` 會自動顯示）
- [ ] **部落格新文章**：要真的踩過的坑才寫。題材庫：Tailwind v4 `[--var]` 全站 116 處、Task Scheduler wrapper 孤兒 process、
  pnpm v11 native build、PowerShell 5.1 沒 BOM 變 Big5、node.exe 無聲死掉 4 小時→自己寫 watchdog

**設計／取捨**
- [ ] **首頁 LCP**：~11/18 看真實訪客 Web Vitals（有提醒信），首頁 LCP p75 ≤2.5s 就不用動；
  超過再決定要不要把 Hero 進場動畫縮短（會削弱「gentle fade-in」）
- [ ] **時間軸互動**：現在是滑鼠移上去／點一下展開、移開收起；想要回到「點一下固定展開、再點收起」跟 Claude 說
- [ ] **先隱藏的東西**，想恢復哪個跟 Claude 說：
  → **下載履歷按鈕**（`/resume` 頁跟 PDF 照舊在，只是沒入口；恢復方法在 `ContactSection.tsx` 註解）
  → **Facebook**（Contact 連結、JSON-LD `sameAs`；`e2e/privacy.spec.ts` 要一起改）
  → **頁尾版本號**（`BuildInfo.tsx` 註解有說明）
  → **頁首以外的桌機特效**：游標光圈、點擊漣漪、卡片聚光燈＋3D 傾斜、小標解碼、背景直書大字、時間軸畫線（commit `cdf68f9`）

**要你建帳號／金鑰才能做**
- [ ] **桌機以外的外部監控**：停電、整台當機時 watchdog 也跟著停。用 GitHub 雲端 runner 每 10 分鐘打一次網站、
  連續失敗寄信到 otemon。要你在 repo 加兩個 Secret（SMTP 帳密），程式 Claude 寫
- [ ] **Cloudflare 設定寫成腳本**（需要一組 Cloudflare API token）：www 導向、HTTP→HTTPS、擋掃描器的 WAF 規則
  （log 裡 39% 是掃描器打 `/wp-admin`、`/.env`），部署時順便檢查規則還在不在
- [ ] **Renovate patch 更新自動合併**（需要一組 fine-grained PAT）：內建 token 開的 PR 不會觸發 workflow、沒測試結果可依據
- [ ] **聯絡表單**：要申請 EmailJS／Formspree 帳號（之前 mailto 版你說不需要）

**大功能，要先拍板做不做**
- [ ] **Umami 自架分析**：要在桌機跑 Docker
- [ ] **日文版 `/ja`**：每頁都要日文全文翻譯，跟「中文優先」方針要先對齊
- [ ] **開源貢獻區塊**：要先有合併到別人 repo 的 PR 可以展示

**其他**
- [ ] **Claude Code 遠端 session 的問題**：下次發生時把錯誤訊息或狀況記下來給 Claude

## ⚙️ 還沒做的點子（Claude 可以直接做，說「做 ○○」就開工）

**首頁／內容**
- [ ] **首頁顯示最新文章**（2～3 篇），部落格不再只靠頁尾一個小連結
- [ ] **技能 ↔ 作品互連**：點技能看用到它的作品，作品頁的技術 tag 連回去
- [ ] **造訪數改成每一頁都算**（現在「共 N 次造訪」只在首頁回報）

**部落格（現在 8 篇）**
- [ ] 文章底部「上一篇／下一篇」＋相關文章（依 tag）
- [ ] 長文目錄（TOC）
- [ ] Tag 頁 `/blog/tags/devops` 這種，sitemap 一起加
- [ ] 系列文：「自架網站維運」那 5 篇串起來，開頭標「系列第 N 篇」
- [ ] 支援 Markdown 表格（裝 `remark-gfm`）

**作品／分享**
- [ ] 每個作品專屬分享圖（作品名＋一句話＋技術 tag）
- [ ] 公開的 `/stats` 頁：Cloudflare 30 天趨勢、AI 爬蟲排行、訪客國家——「自架網站」本身的展示

**監控／維運**
- [ ] 每週流量週報（每週一寄到 otemon：訪客、爬蟲、Web Vitals、部署次數、watchdog 救了幾次）
- [ ] 每季提醒「實際從 GitHub 下載備份解密一次」（備份沒還原過等於沒有）

**品質／安全**
- [ ] 無障礙自動檢查：E2E 加 axe-core，每次 push 掃對比度、alt、label
- [ ] Content-Security-Policy：先 report-only 上線，確認沒擋到東西再正式開
- [ ] 在 Firefox 實際點一次作品卡片換頁動畫（View Transitions；Safari 要你用 iPhone 看）
- [ ] 手寫的 `useMemo`／`useCallback` 可以拿掉（React Compiler 已經在做），沒有效能問題，不急

## ⏳ 等別人更新

- [ ] **TypeScript 7**：typescript-eslint 還不支援（11/04 查 8.72.1 peer 仍是 `<6.1.0`），支援了再升
- [ ] **`THREE.Clock` deprecation warning**：來自 R3F 內部，等 R3F 改用 `THREE.Timer`

## 評估過、先不做（記下理由免得重查）

- **Noto Serif JP 字體子集化**：Google Fonts 已經自動切成 374 塊、只下載用到的字；自己用 `text=` 子集化的話，
  之後作品標題用到清單外的字會悄悄變成別的字體，風險大於好處
