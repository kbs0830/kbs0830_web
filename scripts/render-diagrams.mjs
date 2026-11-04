// 把 projects.ts 裡的架構圖（mermaid）預先畫成靜態 SVG，亮色／暗色各一份，存到
// src/generated/diagrams/<key>-{light,dark}.svg。作品詳細頁直接把 SVG 嵌進 HTML，
// 訪客不用再下載 mermaid（原本詳細頁 2.8MB JS，一半以上是它）。
//
// deploy.ps1 每次 build 前會跑：已經畫過的（key 沒變）直接跳過，只有新增／改過的圖才開瀏覽器畫，
// 用不到的舊 SVG 會刪掉；有變動的話部署成功後自動 commit。手動跑：node scripts/render-diagrams.mjs
//
// 要用 Playwright 的 Chromium 畫：mermaid 要靠瀏覽器量文字寬度決定方框大小。字體跟網站一樣用
// Geist Mono（從 Google Fonts 載入），量出來的寬度才會跟網站上實際顯示的一致。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { projects } from "../src/lib/projects.ts";
import { mermaidConfig } from "../src/lib/mermaid-config.ts";
import { diagramKey } from "../src/lib/diagram-key.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "generated", "diagrams");
const mermaidJs = path.join(root, "node_modules", "mermaid", "dist", "mermaid.min.js");

const charts = projects.flatMap((p) => (p.detail?.architectureDiagram ? [{ slug: p.slug, chart: p.detail.architectureDiagram }] : []));
const wanted = new Map(charts.map((c) => [diagramKey(c.chart), c]));

fs.mkdirSync(outDir, { recursive: true });

// 用不到的舊 SVG（圖改過或作品刪掉了）
for (const file of fs.readdirSync(outDir)) {
  if (!wanted.has(file.replace(/-(light|dark)\.svg$/, ""))) {
    fs.rmSync(path.join(outDir, file));
    console.log(`removed ${file}`);
  }
}

const todo = [...wanted].filter(([key]) => ["light", "dark"].some((t) => !fs.existsSync(path.join(outDir, `${key}-${t}.svg`))));
if (todo.length === 0) {
  console.log(`all ${wanted.size} diagrams up to date`);
  process.exit(0);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400&display=block">
    <style>:root { --font-mono: "Geist Mono"; }</style>
  </head><body></body></html>`, { waitUntil: "networkidle" });
  await page.addScriptTag({ path: mermaidJs });

  const fontOk = await page.evaluate(async () => {
    await Promise.all(["300 13px 'Geist Mono'", "400 13px 'Geist Mono'"].map((f) => document.fonts.load(f)));
    return document.fonts.check("400 13px 'Geist Mono'");
  });
  // 字體沒載到就不要畫：用備用字體量出來的方框寬度在網站上會對不上（文字超出框）
  if (!fontOk) throw new Error("Geist Mono 沒有載入（Google Fonts 連不到？），不產生 SVG");

  for (const [key, { slug, chart }] of todo) {
    for (const theme of ["light", "dark"]) {
      const svg = await page.evaluate(
        async ({ chart, config, id }) => {
          window.mermaid.initialize(config);
          return (await window.mermaid.render(id, chart)).svg;
        },
        { chart, config: mermaidConfig(theme === "dark"), id: `diagram-${key}-${theme}` }
      );
      fs.writeFileSync(path.join(outDir, `${key}-${theme}.svg`), svg);
    }
    console.log(`rendered ${slug} → ${key}`);
  }
} finally {
  await browser.close();
}
