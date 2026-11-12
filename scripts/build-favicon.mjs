// 產生 src/app/favicon.ico（2026-11-12 換新圖示時補：之前 /favicon.ico 是 404，舊瀏覽器、一些爬蟲會預設去要這個）。
// 圖形來源跟 app/icon.tsx 同一份：src/lib/brand-icon.ts 的 small 版。改了圖示要重跑：node scripts/build-favicon.mjs
// 用 Playwright Chromium 把 SVG 畫成 16／32／48 的 PNG，再包成 ICO（ICO 可以直接內嵌 PNG，不用轉 BMP）。
// 腳本直接 import .ts（Node 24 內建型別剝除），所以 brand-icon.ts 不能用 @/ alias。
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brandIconSvg } from "../src/lib/brand-icon.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "src", "app", "favicon.ico");
const sizes = [16, 32, 48];

const browser = await chromium.launch();
const page = await browser.newPage();
const pngs = [];
for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size });
  const svg = brandIconSvg("small").replace("<svg ", `<svg width="${size}" height="${size}" `);
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  pngs.push(await page.locator("svg").screenshot({ omitBackground: true }));
}
await browser.close();

// ICO：6 bytes 檔頭 + 每張 16 bytes 目錄 + PNG 本體
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = icon
header.writeUInt16LE(pngs.length, 4);
let offset = 6 + 16 * pngs.length;
const entries = pngs.map((png, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0); // width
  e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});
fs.writeFileSync(out, Buffer.concat([header, ...entries, ...pngs]));
console.log(`favicon.ico → ${path.relative(root, out)}（${sizes.join("／")}px，${fs.statSync(out).size} bytes）`);

// 狀態色的分頁圖示（SVG）：維修模式頁是 scripts/server.js 直接回的純 HTML，拿不到 lib，所以預先寫成檔案
const statusDir = path.join(root, "public", "status");
fs.mkdirSync(statusDir, { recursive: true });
for (const status of ["ok", "dev", "maintenance", "error"]) {
  fs.writeFileSync(path.join(statusDir, `${status}.svg`), brandIconSvg("small", status));
}
console.log("public/status/{ok,dev,maintenance,error}.svg");
