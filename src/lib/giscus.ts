// 文章留言 giscus 的設定（TODO A6，2026-11-21）。null＝還沒啟用：留言區不出現、CSP 也不放行 giscus.app。
//
// 啟用步驟（要使用者自己的 GitHub 帳號，見 TODO）：
//   1. github.com/kbs0830/kbs0830_web → Settings → General → Features：勾 Discussions
//   2. 安裝 giscus app：https://github.com/apps/giscus → 只選 kbs0830_web 這個 repo
//   3. https://giscus.app/zh-TW 填 repo、Discussion 分類選「Announcements」（只有維護者能開新討論，訪客只能回覆）
//      頁面下面產生的 data-repo-id、data-category-id 填進來
// 填好、部署後，文章最下面會出現「載入留言」按鈕。這些 ID 不是機密（本來就寫在每個用 giscus 的網站 HTML 裡）。
export const GISCUS: { repo: string; repoId: string; category: string; categoryId: string } | null = null;
