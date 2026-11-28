// Claude Code 的 Stop hook（.claude/settings.json）：session 要結束時，如果有 commit 還沒 push 到 origin/main，
// 擋下來請它先推。部署只 build 已 push 的程式碼（乾淨副本 .live，2026-11-28 TODO C13），沒推＝沒上線。
//
// - 只看「已 commit、沒 push」：資料夾裡沒 commit 的檔案可能是別的 session 改到一半，不算
// - 只比本機的 origin/main（不 fetch，結束時不等網路）；push 會順便更新它，所以推完就不會再擋
// - stop_hook_active＝已經擋過一次，這次放行，不會無限迴圈（故意不上線的，例如開 PR，說明一下就能結束）
// - 不是 git 資料夾、沒有 origin/main、部署用的 .live：直接放行
"use strict";

const { execFileSync } = require("node:child_process");

function git(cwd, args) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

function main(input) {
  if (input.stop_hook_active) return;
  const cwd = input.cwd || process.cwd();
  let top;
  try {
    top = git(cwd, ["rev-parse", "--show-toplevel"]);
  } catch {
    return;
  }
  if (/[\\/]\.live$/.test(top)) return;
  let ahead;
  try {
    ahead = git(top, ["log", "--oneline", "--no-decorate", "origin/main..HEAD"]);
  } catch {
    return;
  }
  if (!ahead) return;
  const lines = ahead.split("\n");
  const shown = lines.slice(0, 10).join("\n") + (lines.length > 10 ? `\n…還有 ${lines.length - 10} 個` : "");
  const inWorktree = /[\\/]\.claude[\\/]worktrees[\\/]/.test(top);
  const how = inWorktree
    ? "git fetch && git rebase origin/main && git push origin HEAD:main"
    : "git push（被拒絕就先 git pull --rebase）";
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        `有 ${lines.length} 個 commit 還沒 push 到 origin/main，部署只 build 已 push 的程式碼，所以它們還沒上線：\n${shown}\n\n` +
        `驗證過就推：${how}，再看 logs/deploy.log 的「build 的是 <commit>」確認部署。` +
        "如果是故意不上線（開 PR、等使用者確認），跟使用者說明哪些 commit 沒推、為什麼，就可以結束。",
    }),
  );
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(raw || "{}");
  } catch {
    // 讀不到輸入就當一般情況檢查
  }
  try {
    main(input);
  } catch {
    // hook 出錯不該擋住 session
  }
});
