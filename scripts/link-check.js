// 外部連結檢查的命令列（TODO C8）：node scripts/link-check.js [--base http://localhost:3000]
// 把結果（JSON）寫到 data/link-check.json 並印出摘要；有壞連結 exit 1。由 scripts/link-check.ps1 每月呼叫。
const fs = require("node:fs");
const path = require("node:path");
const { checkSite } = require("./lib/link-check");

const bi = process.argv.indexOf("--base");
const base = (bi > 0 ? process.argv[bi + 1] : process.env.LINKCHECK_BASE) || "http://localhost:3000";
const siteUrl = process.env.SITE_URL || "https://kbs0830.com";
const out = process.env.LINKCHECK_FILE || path.join(__dirname, "..", "data", "link-check.json");

checkSite({ base, siteUrl })
  .then((r) => {
    const result = { checkedAt: new Date().toISOString(), ...r };
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(`檢查 ${r.pages} 頁、${r.links} 個外部連結，壞掉 ${r.broken.length} 個`);
    for (const b of r.broken) {
      const where = `${b.pages.slice(0, 3).join("、")}${b.pages.length > 3 ? ` 等 ${b.pages.length} 頁` : ""}`;
      console.log(`  ✗ ${b.url}　${b.status ?? b.note}　← ${where}`);
    }
    process.exitCode = r.broken.length ? 1 : 0;
  })
  .catch((e) => {
    console.error("連結檢查失敗：", e.message);
    process.exitCode = 2;
  });
