# TODO — 已搬進站長後台

**2026-11-26 起，待辦的正本在站長後台的資料庫**（`data/admin.db` 的 `todos` 表，不進 git），這個檔案不再更新。
（使用者：「以後 todo 直接寫進網站後台，這樣就不用讀 MD，直接看資料庫變化就好」）

- **看／選先做之後不做**：`https://kbs0830.com/admin/todo`（只有站長進得去：家裡 IP、桌機本機，之後加 Cloudflare Access）。每項點「完整說明」看全文
- **Claude 新增、修改、完成**：在桌機跑 `node scripts/admin-db.js todo …`（用法寫在那支檔案開頭）
  - 列出：`todo`（`--all` 含完成）、看全文：`todo show <id>`、使用者的決定：`decisions`
  - 新增：`todo add --title … --section … [--group …] [--code B22] [--size S|M|L] [--you] [--star] --detail …`——說明要寫完整（背景、使用者原話、做法、要使用者做什麼）
  - 完成：`todo done <id> --note "做了什麼"`；不做：`todo drop <id> --note "理由"`
- 做完的事一樣記在 [DONE.md](DONE.md)（給人看的歷史紀錄）
- 備份：`scripts/backup.ps1` 每天備份 `data/admin.db`
- 搬家前最後一版的 TODO.md 在 git 歷史：`git show 128ccd9:TODO.md`

📬 有日期的提醒照舊在 `reminders.json`（自動寄信到通知信箱）。
