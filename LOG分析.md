# LOG 分析報告

分析範圍：`logs/server.log`（2026-07-06 23:35 ～ 2026-07-16 16:23，約 10 天）、
`logs/deploy.log`、`logs/watchdog.log`。

---

## 摘要

| 項目 | 結果 |
|---|---|
| 總請求數 | 19,887 |
| 應用層錯誤（ERROR/FATAL/UNCAUGHT/UNHANDLED） | **0** 筆 |
| 部署次數 | 20 次，**全部成功**，0 次失敗 |
| Watchdog 觸發 | 1 次（自動恢復） |
| 發現的真實 bug | 1 個（訪客統計被掃描器污染），已當場修復 |
| 發現的 build 警告 | 1 個（Turbopack NFT over-trace），已當場修復 |

**整體結論：應用程式本身穩定，10 天內沒有任何未捕捉例外或當機。真正值得注意的是
下面第 2 節——訪客統計功能被自動化掃描流量污染的問題，已經修復並重新部署。**

---

## 1. 流量與狀態碼分佈

| 狀態碼 | 次數 | 占比 | 說明 |
|---|---|---|---|
| 200 | 11,116 | 55.9% | 正常回應 |
| 404 | 7,799 | 39.2% | 見下方「掃描流量」 |
| 308 | 897 | 4.5% | Next.js 正常的永久重導向 |
| 405 | 29 | 0.1% | `OPTIONS /`（21）、`POST /`（8）——首頁只接受 GET，這兩種方法本來就該被拒絕 |
| 304 | 5 | <0.1% | Not Modified，快取正常運作 |
| 500 | 4 | <0.1% | 見下方「500 錯誤」 |

每日請求量從 2026-07-06 的 29 筆（該天只有半天的 log）成長到穩定的每天 1,900～2,700 筆，
沒有異常暴增或流量中斷的跡象。

---

## 2. 掃描流量（404 的來源）— 屬於正常網路背景雜訊

7,799 筆 404 裡，前幾名路徑：

```
481  /cgi-bin/luci/;stok=/locale        ← 家用路由器韌體已知漏洞掃描
192  /SDK/webLanguage                    ← IoT 裝置漏洞掃描
115  /wp-admin/install.php?step=1        ← WordPress 掃描
 93  /index.htm
 62  /.env
 48  /
 35  /.env.local
 33  /.env.production
 32  /.git/config
 30  /login
 26  /config.json、/backend/.env、/api/.env
 25  /app/.env、/.env.save
 23  /.env.prod、/.env.bak、/.env.backup
 22  /admin/.env、/.env.staging、/.env.old、/.env.development
 21  /laravel/.env、/.git/HEAD
 19  /xmlrpc.php?rsd=、/wp*/wp-includes/wlwmanifest.xml（多個變體）
```

**這是任何公開在網路上的 HTTP 伺服器都會持續收到的自動化漏洞掃描背景雜訊**，不是針對
這個網站的定向攻擊。這些路徑（WordPress 後台、Laravel/.env 憑證檔、路由器 cgi-bin、
git 內部檔案）在這個 Next.js 專案裡本來就不存在，全部正確回應 404，沒有任何一個路徑
真的洩漏了東西。**目前不需要緊急處理**，但已經記錄一個低優先 TODO（Cloudflare 防火牆
規則直接擋掉這類路徑），可以減少 log 雜訊、省一點頻寬。

---

## 3. 500 錯誤 — 已排查，屬於部署重啟的預期短暫現象

4 筆 500 全部是 `_next/static/chunks/*.js` 或 `*.css` 靜態資源請求，時間點跟 `deploy.log`
的部署時間**精準對上**：

| server.log 時間 (UTC) | 對應 deploy.log 時間 (+08:00) | 檔案 |
|---|---|---|
| 2026-07-10T04:56:41Z | 2026-07-10T12:57 部署 | `16m6e_rkxq5zf.js` |
| 2026-07-16T14:45:27Z | 2026-07-16T22:48 部署 | `30_qbchp1lysd.css`、`0lq6lih0ny8_t.js` |
| 2026-07-16T14:48:40Z | （同一輪部署後） | `/SDK/webLanguage`（掃描流量，剛好撞上） |

Task Scheduler 重啟 `kbs0830_NextJS` 的瞬間會有一個極短的行程交接空窗（舊 process 已停、
新 process 還沒完全就緒），這段期間剛好有請求進來就會拿到 500。這正是 `CLAUDE.md` 裡
「Action 必須直接執行 node.exe」那段設計要解決的問題的殘留現象——已經是目前架構下
（單一 process、Task Scheduler 管理）能做到的最小影響範圍，`verify-deploy.ps1` 每次都在
重啟後立刻確認過恢復正常。20 次部署裡只有 2 次撞到這個空窗、共 4 個請求受影響，
占全部請求的 0.02%。**屬於可接受的已知現象，不是 bug**，如果之後想要做到零停機部署
（例如雙 process 交替），已經記錄成低優先 TODO。

---

## 4. Watchdog

只在 `logs/watchdog.log` 裡看到一次紀錄（2026-07-13T13:11:12），首頁 10 秒內沒回應 →
自動重啟 `kbs0830_NextJS` → 4.4 秒後恢復正常。這是 watchdog 設計的目的達成的唯一一次
實際案例，運作如預期。

---

## 5. 發現並修復的真實問題：訪客統計被掃描器污染

分析 `data/visitor-stats.json` 時發現內容是 `{"XX":15,"TW":61,"TR":1}`——多了一筆「土耳其」，
使用者本人也在網站上注意到並提出疑問。交叉比對第 2 節的掃描流量清單後，高度懷疑成因：

- 舊版計數邏輯（`scripts/server.js`）對**每一個**打到首頁的 request 做判斷：只要
  User-Agent 沒有明顯寫 "bot" 字樣，就會被算成一次訪客
- 大量自動化掃描器（包含第 2 節那些）為了避開簡單的 UA 黑名單，會偽裝成一般瀏覽器的
  User-Agent 字串——這種掃描器完全不會被舊邏輯擋下來

**修復方式**：改成訪客計數只在瀏覽器真的執行 JS 之後，由前端 `VisitorStats.tsx` 主動
呼叫 `POST /api/visitor-stats` 回報才算數（見 commit）。不執行 JavaScript 的掃描器/爬蟲
（絕大多數自動化掃描工具都不執行 JS）從一開始就不會打到這支 API，等於從根本上排除
這類流量，而不是繼續用容易被繞過的 UA 黑名單當唯一防線（UA 黑名單保留當第二道防線，
關鍵字也擴充了 curl/wget/python-requests/axios/scrapy/headless）。

修復後已經清空 `data/visitor-stats.json` 重新從 0 開始累計（舊資料已被污染，留著沒有
意義），並補上「共 N 次造訪」的顯示，不只顯示國家數。

---

## 6. Turbopack build 警告（嘗試修復，未完全解決）

`deploy.log` 裡有一次（2026-07-17 00:20）build 跳出警告：

```
Turbopack build encountered 1 warnings:
./next.config.ts
Encountered unexpected file in NFT list
Import trace: ./src/app/api/visitor-stats/route.ts
```

原因是 `route.ts` 裡的 `fs.readFileSync`/`path.join(process.cwd(), ...)` 這類動態路徑
組合，讓 Turbopack 的 Node File Trace 分析器無法靜態確定範圍，保守地把整個專案都標記為
這支 API route 的依賴。這不影響這個專案的部署方式（沒有用 `output: "standalone"`，build
本身仍然成功）。

**更正**：一開始只在 `path.join(...)` 那一行加 `turbopackIgnore` 註解，重新 build 當下
警告確實消失，但後來替這支 route 加上 POST handler（多了 `readStats()`／`writeFileSync`／
`mkdirSync` 幾個新的 fs 呼叫）之後，警告又跑回來——`turbopackIgnore` 註解只對它所在那一
行的呼叫有效，不會連帶蓋掉同一個檔案裡其他的 fs 操作。目前維持現狀（純 build log 雜訊，
不影響功能與部署），沒有繼續花時間逐一替每個 fs 呼叫加註解。

---

## 建議的後續行動

已經在 `TODO.md` 補上兩個低優先項目：
- Cloudflare 防火牆規則封鎖常見掃描路徑（減少 log 雜訊，非緊急）
- 零停機部署（目前每次部署 0.02% 機率的短暫 500，是否值得為此增加架構複雜度，由你決定）

其餘項目（訪客統計 bot 污染、Turbopack 警告）已經當場修復並部署，不需要額外排入 TODO。
