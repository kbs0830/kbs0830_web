---
name: kbs-integrations
description: kbs0830_web 第三方整合與 SEO 全文：自架訪客來源統計、未過濾流量、Cloudflare 設定腳本、CSP、/stats 訪客分析、Web Vitals、自家 FR24 雷達、Spotify 正在聽，以及 SEO（metadata、canonical、sitemap、JSON-LD、llms.txt、OG 圖）。碰 CSP、Cloudflare API、統計資料、Spotify、雷達、metadata／sitemap／robots，或新增頁面要補 SEO 時先讀。
---

## 第三方整合

### 訪客來源統計（自架，非 Clustrmaps）
- 不用第三方服務（不需要註冊帳號）：`scripts/server.js` 的 `recordVisit()` 讀 Cloudflare Tunnel
  轉發請求時本來就帶著的 `cf-ipcountry` header（Cloudflare edge 加的），只排除 `/api/`、
  `/_next/`、有副檔名的靜態資源、非 200、常見 bot UA 之後，把「國家」層級的次數累加寫進
  `data/visitor-stats.json`（`.gitignore`，只留在桌機本地，不進版控，跟 `logs/` 同等級）
- **只存國家代碼＋次數，不存 IP、不存任何個人可識別資訊**
- 沒有 `cf-ipcountry` header（沒經過 Cloudflare：CI E2E、本機測試、印履歷 PDF）的回報完全不寫入（2026-11-05 起，
  之前記成 `XX`，累積 1037 筆假資料才發現）。跟 Web Vitals 同一條規則
- **2026-11-09 起每一頁都算**：回報是 layout 的 `VisitBeacon.tsx`（每換一頁 POST 一次），頁尾 `VisitorStats` 只讀（GET），
  不然首頁會算兩次。之前只有首頁頁尾會回報，直接開文章／作品頁的訪客沒算到
- `src/app/api/visitor-stats/route.ts` 讀這份 JSON 回傳彙總（total／countryCount／前 5 名），
  `src/components/ui/VisitorStats.tsx`（Footer）用 regional indicator symbol 公式把國碼即時轉成
  國旗 emoji 顯示，不需要維護國碼對照表
- 改 `scripts/server.js` 之後要記得跑一次 `node node_modules/eslint/bin/eslint.js scripts/server.js`——
  這個檔案是 CommonJS，`eslint.config.mjs` 裡已經對 `scripts/**/*.js` 關掉
  `@typescript-eslint/no-require-imports`，不要因為 lint 錯誤誤以為要把它改寫成 ESM

### 未過濾流量（2026-11-06，含 AI 爬蟲）
- 使用者要「頁底加上沒清洗的瀏覽人數，包含 AI 等等的」。Footer 第二行：`未過濾 N 次 · 瀏覽器 · AI 爬蟲 · 搜尋引擎 · 其他機器人`，
  滑鼠移上去（title）看統計起始日跟最常來的 5 個爬蟲
- **跟上面「造訪」是兩套數字，不要合併**：造訪要瀏覽器執行 JS 才算（真人估計）；這份是 `scripts/server.js` 在
  `res.on("finish")` 對每個頁面請求計數（`scripts/lib/raw-traffic.js` 的 `recordRawHit`），不執行 JS 的爬蟲才數得到
- 依 UA 分類，AI 名單要先比（`Applebot-Extended` 是 AI、`Applebot` 是搜尋）；偽裝成 Chrome 的掃描器會算成「瀏覽器」，這是「未過濾」的本意
- 不算的只有：沒 `cf-ipcountry`（localhost 健檢／測試）、UA 含 `WindowsPowerShell`（watchdog 每 5 分鐘從外網打首頁）、
  Next 連結預先載入（`next-router-prefetch`）、`/_next/`、`/api/`、圖片字型等靜態資源
- 資料 `data/raw-traffic.json`（gitignore、有進每日備份），只存分類次數＋爬蟲名稱次數，不存 IP／UA／網址。
  `/api/visitor-stats` 回傳的 `raw` 欄位讀它（`RAW_TRAFFIC_FILE` 環境變數，server.js 設）。測試：`scripts/lib/raw-traffic.test.ts`
  （vitest `include` 有加 `scripts/**/*.test.ts`）
- 2026-11-06 才開始記，之前的 `server.log` 沒有 UA，補不回來

### Cloudflare 設定腳本（2026-11-09，`scripts/cloudflare-config.ps1`，同日已套用）
- **第 5 項：靜態頁快取（2026-11-09 上線）**：Cloudflare 照 Next 的
  Cache-Control 存靜態頁（s-maxage 一年），排除 `/api/`、`/stats`、`Accept: text/markdown`。**deploy.ps1 切槽後馬上 `-Purge`**
  （舊 HTML 引用舊版 JS chunk，新版 server 已經不提供），退回時也清。token 沒權限時快取那項 skipped、清快取也 skip，不擋部署
- ⚠️ 快取生效後，**快取命中的請求不會到桌機**：`/stats` 的「未過濾流量」、爬蟲排行只數得到沒命中快取的請求（會明顯變少）。
  真人造訪（JS 回報）、Web Vitals、Cloudflare 的數字不受影響
- 管 Always Use HTTPS、HSTS（半年、不含子網域、不 preload）、www → 裸網域 301、WAF 自訂規則擋掃描器
  （path 含 `/wp-`、`.php`、`/.env`、`/.git`、`xmlrpc`）。**新增路由前確認路徑不含這些字串**，不然會被 Cloudflare 擋（403）
- 預設只檢查；`-Apply` 才改，改完 curl 回查 4 項。deploy.ps1 每次部署帶 `-Check -Quiet` 跑，漂移寫 deploy.log＋寄信（1 天冷卻），不擋部署
- 金鑰 `.env.local` 的 `CLOUDFLARE_CONFIG_TOKEN`（Zone Settings／Single Redirect／Zone WAF 三個 Edit，只限 kbs0830.com）；沒設就 skip。
  跟讀流量的 `CLOUDFLARE_ANALYTICS_TOKEN` 分開。token 名稱 `kbs0830-config`，無到期日；撤銷＝dashboard → My Profile → API Tokens 刪掉
- 這下面「www 導向」那段 9 月／11 月的 dashboard 手動操作說明，現在都由這支腳本管；`http://` 也會導 https 了
- www 導向：dashboard 用範本建的那條（沒有 ref）也算數，不會重複建；其他規則用 `ref` 認自己建的那條
- ⚠️ 開 HSTS 之後瀏覽器半年內只走 https，**不能再關 HTTPS**；要撤回先把 max-age 改 0 等舊的過期

### CSP（2026-11-09 正式開）
- `next.config.ts` 的 `contentSecurityPolicy()`：**會擋**。先 report-only 上線，同一天在強制模式下把全站 43 頁＋互動功能用
  Chrome、Firefox 跑過 0 違規才正式開
- 被擋的照樣回報到 `/api/csp-report`，只存「指令＋被擋的網域＋頁面路徑 → 次數」到 `data/csp-reports.json`（`CSP_REPORT_FILE`，
  server.js 設），只收有 `cf-ipcountry` 的。看結果：`curl https://kbs0830.com/api/csp-report`
- **新增外部資源（圖片網域、script、API、iframe）一定要加進 policy**，不然正式站會被擋；`e2e/csp.spec.ts` 會掃 sitemap 每一頁
- dev（`next dev`、CI 的 E2E）多給 `'unsafe-eval'` 跟 `ws: wss:`（Fast Refresh／熱更新要用）；正式站沒有。header 是 `next build`
  時算好寫進 routes-manifest 的；`scripts/server.js` 開頭也明確設 `NODE_ENV=production`
- `'unsafe-inline'` 拿不掉：深色模式 inline script、JSON-LD、Next 的 hydration script 都是 inline；改 nonce 會讓所有頁面變動態
- Cloudflare 的 email 保護會插 `/cdn-cgi/scripts/…/email-decode.min.js`，同網域，`'self'` 就涵蓋
- ⚠️ **Cloudflare 會在 edge 插東西，只對真的瀏覽器**：Web Analytics 的 `static.cloudflareinsights.com` beacon（送資料到
  `cloudflareinsights.com`）——curl、本機、E2E 都看不到。正式開 CSP 後幾分鐘就從 `/api/csp-report` 抓到被擋，已加進
  script-src／connect-src。**改 Cloudflare 設定（開新功能）後要看一次 csp-report**

### 訪客分析 `/stats`（2026-11-09 公開流量頁 → 2026-11-12 升級成訪客分析）
- 使用者要「訪客分析的頁面」。真人訪客：每日瀏覽／造訪／新訪客、熱門頁面（路徑轉成頁名）、從哪裡來（只記網域）、
  裝置／瀏覽器／作業系統、24 小時時段；下面接國家、Cloudflare（含機器人）、到達主機的請求＋爬蟲排行
- 明細資料：`lib/visit-detail.ts` → `data/visits-detail.json`（`VISITS_DETAIL_FILE`，server.js 設；有進每日備份）。
  `VisitBeacon` 每頁 POST `{path, ref, newSession, newVisitor}` 到 `/api/visitor-stats`；新訪客／工作階段是瀏覽器自己的
  localStorage／sessionStorage 旗標，**不是 cookie、不送 ID**。只存分類次數：路徑只收本站路由格式、來源只留網域、UA 粗分後不存。
  每日數字留 120 天。單元測試 `visit-detail.test.ts`（含「存下來的沒有完整 UA／query」）
- 頁尾「未過濾 N 次…」那行 2026-11-12 依使用者要求拿掉（快取之後它只數得到沒命中的請求），細節留在 /stats

### 公開流量頁 `/stats`（2026-11-09 第一版，以下是當時的紀錄）
- 使用者要做（TODO 點子）。Cloudflare 近 30 天趨勢圖（伺服器端畫的 SVG）、未過濾流量四類佔比、爬蟲排行（AI／搜尋引擎標籤）、真人訪客國家
- 資料跟頁尾同一份：讀取集中在 `lib/site-stats.ts`（國家、未過濾、爬蟲排行；爬蟲分類直接 import `scripts/lib/raw-traffic.js` 的 `classify`，
  名單只維護一份）＋ `lib/cloudflare-analytics.ts` 的 `readCloudflareDays()`
- `dynamic = "force-dynamic"`：每次請求現讀資料檔。**所以沒有 Markdown 版**（Markdown 是 build 時預先產生的，會是過期數字）——
  這是「新頁面要加 Markdown」規則的刻意例外。sitemap 有、頁尾有 `Stats` 連結
- 國家用 `Intl.DisplayNames` 顯示中文國名：Windows 不支援國旗 emoji，只放國旗會變成「TW TW 61」

### Cloudflare 流量數字（2026-11-06）
- 使用者看 dashboard 覺得頁底數字太少（「我的造訪資料沒那麼少啊」）。Footer 加一行
  `Cloudflare · 近 30 天 N 訪客 · N 次瀏覽 · 累計 N 次瀏覽`，title 有累計訪客／請求跟起始日（2026-06-16）
- `src/lib/cloudflare-analytics.ts`：GraphQL Analytics API 的 `httpRequests1dGroups`（免費方案可用），
  `/api/visitor-stats` 回傳的 `cloudflare` 欄位。**一小時最多抓一次、背景抓不等它**；失敗 10 分鐘內不重試
- 每天的數字合併存 `data/cloudflare-daily.json`（`CLOUDFLARE_STATS_FILE`，有進每日備份）——Cloudflare 只留一段時間，
  存在本機的累計才不會哪天變少。第一次抓一年，之後只抓最近 3 天
- 金鑰：`.env.local` 的 `CLOUDFLARE_ANALYTICS_TOKEN`，權限**只有「區域 → 分析 → 讀取」限 kbs0830.com**（讀 DNS 被拒，已驗證）。
  沒設就不顯示。⚠️ 使用者第一次是用「讀取 Cloudflare Radar 資料」範本建的，Radar 是全球統計、讀不到自己網站——
  GraphQL 回 `does not have permission 'com.cloudflare.api.account.zone.analytics.read'` 就是這個
- Zone ID `bedff9fea6cd187647a5f2dbd02ae833`（不是機密）寫死在 lib 裡：分析唯讀的金鑰沒有權限 `GET /zones` 查它
  （當初是從 `~/.cloudflared/cert.pem` 只解出 zoneID 那一欄）
- 「訪客」是每天不重複 IP 的加總（跟 dashboard 30 天視圖同算法），含機器人；同一人隔天再來算兩次

### 真實訪客 Web Vitals（2026-11-04，自架）
- `components/ui/WebVitals.tsx`（掛在 `layout.tsx`）用 Next 的 `useReportWebVitals` 收 LCP／INP／CLS／
  FCP／TTFB，`sendBeacon` 送到 `/api/web-vitals`；作品／文章頁統一記成 `/projects/slug`、`/blog/slug`
- 只存「頁面路徑 × 指標 → 最近 200 筆數值」到 `data/web-vitals.json`（gitignore），不存 IP／UA。
  路徑、指標名稱、數值範圍都有白名單驗證；bot／headless UA 不計
- **只收帶 `cf-ipcountry` header 的請求**（＝經過 Cloudflare 的真實訪客）。第一版只靠 UA 過濾，上線幾分鐘
  就被 CI 的 E2E 灌了 40 幾筆——Playwright `devices["Desktop Chrome"]` 的 UA 是一般 Chrome、不含 headless，
  而且 E2E 打的是同一台桌機、同一個 `data/` 目錄。本機測試要看到資料的話，請求要自己加這個 header
- **看數據：`curl https://kbs0830.com/api/web-vitals`**，回傳每頁每個指標的樣本數 `n` 跟 `p75`
  （Google 判 Core Web Vitals 用 p75：LCP ≤2500ms、INP ≤200ms、CLS ≤0.1 算 good）
- 用途：TODO「首頁 LCP 決策點」要不要縮短 Hero 進場動畫，看真實訪客的 p75，不再只靠 Lighthouse 模擬值
- 檔案路徑、同步 read-modify-write 的理由跟訪客統計一樣（`server.js` 設 `WEB_VITALS_FILE`）

### 自家 FR24 雷達（2026-11-21）
- **獨立頁 `/radar`**（2026-11-21，使用者：「自家雷達 · My Radar 沒能給更好看的頁面嗎?」）：大數字「現在幾架」＋裝飾雷達圓盤（`RadarLive.tsx`，
  每 30 秒更新；圓盤**不畫光點**——沒有座標也不放假位置；掃描線 `globals.css .radar-sweep`，reduced-motion 不轉、離線不畫）、
  今天／最多同時／近 7 天／在線率、「一天的節奏」（每小時最多同時幾架，近 7 天平均＝`day.hourPeak`）、近 30 天、近 7 天航空公司、關於。
  `force-dynamic` 每次請求讀 `lib/radar.js` 的 `detail()`，所以**跟 /stats 一樣沒有 Markdown 版**（刻意例外）；Cloudflare 不會存（no-store）。
  圖表元件 `StatCharts.tsx`（BarChart／ShareList／Tiles，從 /stats 抽出來共用）。sitemap、/stats 頁名、a11y／privacy E2E 都加了
- **在哪裡看得到**（使用者：「雷達、飛行紀錄、住宿紀錄可以不用藏那麼深，FR24 自架站點是一個特色」）：`/radar`；/flights 頁首的摘要（`#radar`，連到 /radar）、
  首頁 About 現況卡下面的小卡（`RadarBadge`）、足跡分頁的連結、首頁頁尾 `Flights`／`Radar`、作品集的個人專案 **`fr24-receiver`**
  （詳細頁「看即時狀態」＝`Project.live` → /radar）。作品頁內容是 11/20～21 真的除錯數字，**不寫「收得到地面滑行的飛機」**（等於說住機場旁）
- 使用者自己架的 ADS-B 接收器（樹莓派 Pi24 映像＋SDR 棒；FR24 雷達代碼不寫進 repo——repo 是公開的，接收器在使用者家），在區網 `192.168.50.147`：
  `:8754/monitor.json`（fr24feed 狀態）、`/dump1090/data/aircraft.json`（現在收到的飛機）。`.env.local` 的 `RADAR_HOST`，沒設就整個不跑
- `scripts/server.js` 在 `app.prepare()` 之後（Next 那時才把 `.env.local` 載進 process.env）呼叫 `lib/radar.js` 的
  `startRadarPoller`：每 30 秒讀一次 → 彙總寫 `data/radar.json`（`RADAR_FILE`，可從外面指定；有進每日備份）
- `/api/radar`（`force-dynamic`、no-store）回 `summarize()`：現在／今天／最多同時幾架、今天的航空公司（呼號前三碼，
  `AIRLINE_NAMES` 只放確定的，其他顯示三碼）、近 7 天架次＋在線率。`RadarStatus.tsx`（client）每分鐘讀、背景分頁不讀，
  載入中畫同樣大小的骨架（數字 –）避免 CLS，`configured: false` 才整塊拿掉。「怎麼架的 →」夾在文字裡要一直有底線（axe `link-in-text-block`）
- **隱私**：`monitor.json` 有 FR24 分享金鑰（fr24key）跟內網 IP——只挑需要的欄位，金鑰／IP 不存也不出去。
  **不存座標、不算涵蓋範圍／最遠距離**（畫出收到的飛機位置就看得出接收器＝使用者家在哪）。今天看過的飛機識別碼只為了數不重複、
  換日就丟、不經 API。「列出頭上這幾班（航班代碼＋高度）」問過使用者還沒選，先不做。`radar.test.ts` 會擋公開資料出現識別碼／IP／座標
- watchdog 看 `data/radar.json` 的 status：離線超過 15 分鐘寄信（key `radar`，原因分「讀不到／卡在關機／SDR 斷線」；**2026-11-23 起只寄第一封＋恢復一封，沒好才每 24 小時提醒**，恢復信寫離線幾小時（`data/alerts/radar.since`）；
  原本 60 分鐘冷卻，11/23 斷 11 小時寄了 11 封，使用者嫌吵。冷卻中不寫 watchdog.log）、
  08–21 點在線但 2 小時 0 架寄信（小港有宵禁，晚上本來就少）（key `radar-quiet`，12 小時冷卻）；status 超過 5 分鐘沒更新（server 沒在讀）不判斷。週報有「自家雷達」一段
- ⚠️ fr24feed 重啟可能卡在「關到一半」（`monitor.json` 的 `shutdown: yes`、`rx_connected: 0`，FR24 那邊照樣 connected）：
  網頁的 Restart 沒用（它以為自己正在關），要拔電或 `sudo systemctl restart fr24feed`。**`restart.html` 一打開（GET）就會觸發重啟**，不要為了看內容去抓它
- **機型統計（2026-11-22，TODO D4）**：新收到的飛機拿識別碼問 adsbdb.com（免費、不用金鑰），快取 `data/aircraft-types.json`（跟 radar.json 同資料夾；識別碼 → ICAO 機型，不公開）。
  每 30 秒最多查 4 架、查不到的 30 天後再試、網路錯誤這輪就停。`day.types` 只存「機型 → 架數」，/radar「機型（近 7 天）」顯示。**不做航線統計**（航線交會處＝接收器位置）
- **外部 API 共用快取 `lib/live-cache.ts`**（天氣、之後的匯率／空氣品質／機場）：伺服器抓、記憶體快取、失敗給上一次成功的（LKG）、失敗後 1 分鐘內不重試
- 收訊：增益 `--gain 40`（settings 的 Process arguments；沒設＝最大，雜訊蓋掉訊號、一則都解不出來）

### Spotify「正在聽」
- 元件：`src/components/ui/SpotifyNowPlaying.tsx`，後端：`src/app/api/spotify/now-playing/route.ts`
- 用 `SPOTIFY_REFRESH_TOKEN` 換 access token，抓「正在播放／最近播放」單曲
- 三個環境變數（`.env.local`，不進版控）：`SPOTIFY_CLIENT_ID`、`SPOTIFY_CLIENT_SECRET`、
  `SPOTIFY_REFRESH_TOKEN`——缺任何一個，API 直接回傳 `isPlaying:false`，前端元件不顯示，
  不影響其他功能
- `scripts/spotify-get-refresh-token.js` 是取得 refresh token 的一次性小工具：先不帶參數執行印出
  授權網址，登入同意後從導回網址複製 `code=` 到 `&` 之前那段（**不要**把後面 `&ubi=...` 之類的
  追蹤參數一起複製進去），再帶著 code 執行一次，refresh token 會自動寫進 `.env.local`
- authorization code 只有幾分鐘效期、一次性失效（不管換 token 成功或失敗都會失效），
  失敗要請使用者回到第一步重新拿新的 code，不能重複用舊的

---

## SEO

| 項目 | 位置 |
|---|---|
| 全站預設 metadata（title/description/OG/Twitter card） | `src/app/layout.tsx` |
| Person＋WebSite JSON-LD（`@graph`，含 `sameAs`、`alternateName`、大頭照、學歷） | `src/app/layout.tsx` 的 `jsonLd` |
| ProfilePage JSON-LD（首頁＝這個人的個人檔案頁） | `src/app/page.tsx` |
| Sitemap | `src/app/sitemap.ts` |
| robots.txt | `src/app/robots.ts` |
| OG 分享圖（⚠️ 2026-11-21 部署 build 因為分享圖的中文字型壞掉失敗過一次：`og-font.ts` 現在檢查字型檔頭、重抓一次，`og-card.tsx` 先試畫，畫不出來退回英文，不讓 build 失敗） | `src/app/opengraph-image.tsx`（全站預設）、`src/app/blog/[slug]/opengraph-image.tsx`（每篇文章一張）、`src/app/projects/[slug]/opengraph-image.tsx`（每個作品一張：作品名＋一句話成果＋tag，2026-11-09）。中文字型共用 `lib/og-font.ts`：build 時跟 Google Fonts 要 Noto Serif TC 子集，抓不到退回英文 |
| 子頁面分享卡片（og/twitter title、description、url、圖） | `src/lib/share-meta.ts` 的 `withShare()`——**新增頁面的 metadata 用它包**，不然會繼承首頁的「PINGWEI LI — Portfolio」。自己有 opengraph-image 的頁面：作品頁、/flights、/hotels、/stats、/radar、/now、/uses、/changelog 用 `withShare(meta, { ownImage: true })`（獨立頁的圖共用 `lib/og-card.tsx` 的 `pageCardImage`，新頁照抄三行）（不寫 images，讓檔案慣例掛上），文章頁自己寫 openGraph |
| RSS | `src/app/feed.xml/route.ts`（標題＋摘要＋連結，作者只寫 PINGWEI LI）；`/blog`、文章頁、首頁的 `<head>` 有 `application/rss+xml` |
| `/.well-known/security.txt`（RFC 9116，2026-11-23 TODO B8；聯絡 `SECURITY_EMAIL`＝otemon，使用者指定；Expires＝build＋180 天） | `src/app/.well-known/security.txt/route.ts` |
| `/llms.txt`（給 AI 讀的網站摘要，build 時從 projects／blog／about 產生） | `src/app/llms.txt/route.ts` |
| IndexNow（部署時通知 Bing／Yandex） | `scripts/deploy.ps1` 的 `Submit-IndexNow`，金鑰檔 `public/<key>.txt` |
| Markdown for Agents（每頁的 Markdown 版：`Accept: text/markdown` 或網址加 `.md`，首頁 `/index.md`） | `src/lib/markdown.ts` → `src/app/md/[[...path]]/route.ts`，轉址在 `next.config.ts` 的 `rewrites` |

**人名搜尋／AI 搜尋（2026-11-04）**：
- 所有 JSON-LD 的「人」都用同一個 `@id`（`lib/site.ts` 的 `PERSON_ID`），首頁 ProfilePage、文章 author
  都指過去，搜尋引擎才會認成同一個人
- AI 爬蟲（GPTBot、ClaudeBot、PerplexityBot…）`robots.txt` 全部允許。**Cloudflare 有「封鎖 AI 爬蟲」
  開關**（Security → Bots／AI Crawl Control），開了的話 `robots.txt` 寫什麼都沒用——用假 UA 打不出來
  （Cloudflare 是用 IP 驗證真的爬蟲），要去 dashboard 看
- ChatGPT 搜尋、Copilot 用 Bing 的索引 → IndexNow 讓 Bing 在部署後馬上知道；內容（`src`／`content`／
  `public`）跟上次部署比有變才送，送 sitemap 裡全部網址
- Google 不支援 IndexNow，靠 sitemap＋Search Console
- **Markdown for Agents（2026-11-05）**：Cloudflare 的同名功能要 Pro 方案，自己做。`next.config.ts` 的 `rewrites.beforeFiles`
  依 `Accept` header 或 `.md` 網址轉到 `/md/...`（靜態設定，不用 proxy，每個請求零成本），build 時全部預先產生。
  內容＝頁面可見內容換格式，**加上本名**（只有 AI 會讀；`markdown.test.ts` 確認每頁都有）。回應帶 `Vary: Accept` 跟指回 HTML 的
  `Link: rel="canonical"`；每頁 `<head>` 有 `<link rel="alternate" type="text/markdown">`（metadata 的 `alternates.types`，
  **新增頁面時跟 canonical 一起加**，再把路徑加進 `markdown.ts` 的 `markdownPaths()` 跟 `next.config.ts` 的 `pages`）。
  `/now`、`/uses`、`/resume` 的資料因此搬到 `lib/page-content.ts`（頁面跟 Markdown 共用）

**⚠️ Google Search Console「網頁索引狀態」看到 `www.kbs0830.com` 404 是 DNS/Tunnel 層問題，
不是這裡的 code 問題**——根因跟修法見上方「部署架構」章節那則 `www` DNS/Redirect Rule 說明，
不要在這裡加 rewrite/redirect code 去處理，Cloudflare edge 解決就好。

**⚠️ 加新頁面時必記得設定 `alternates.canonical`。** Next.js 的 metadata 是逐層 merge，
子頁面沒有自己宣告 `alternates` 就會直接繼承 root layout 的 `alternates.canonical: "/"`。
2026-07 就抓到這個問題：`/now` 跟 `/uses` 都曾經在 `<head>` 裡宣告
`<link rel="canonical" href="https://kbs0830.com"/>`，等於告訴 Google 這兩頁都是首頁的
重複內容，實質上讓它們不會被獨立索引。**新增任何 `page.tsx` 都要在該頁的
`export const metadata` 裡加 `alternates: { canonical: "/該頁路徑" }`**，同時記得把新頁面
加進 `sitemap.ts`。
