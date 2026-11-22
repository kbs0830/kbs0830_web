import { chromium, expect, test, type Browser, type Page } from "@playwright/test";

// 首頁 WebGPU 版（HeroSceneGPU）用真顯卡測（TODO C11，2026-11-22）。
// 其他測試用 Playwright 內建的 Chromium：它少 dxcompiler.dll，拿得到 adapter 但 requestDevice 失敗 → 全部走 WebGL 版，
// WebGPU 版壞了沒人知道。這支改用系統裝的 Chrome＋D3D11，CI runner 就在有 RTX 3070 的桌機上。
// 拿不到 GPU 的機器（沒裝 Chrome、筆電沒有 WebGPU）跳過；CI 設 HERO_WEBGPU_REQUIRED=1，拿不到就算失敗，不要悄悄跳過。

type Vec = number[];
interface Probe {
  shape(): string;
  stars(): number;
  gather(): number;
  pointer(): [number, number];
  sample(n?: number): Promise<{ pos: Vec[]; home: Vec[] }>;
}
declare global {
  interface Window {
    __heroRenderer?: string;
    __heroParticles?: number;
    __heroProbe?: Probe;
  }
}

const REQUIRED = !!process.env.HERO_WEBGPU_REQUIRED;
let browser: Browser | null = null;
let skipReason = "";

test.beforeAll(async () => {
  try {
    browser = await chromium.launch({
      channel: "chrome",
      args: ["--enable-unsafe-webgpu", "--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist"],
    });
  } catch (e) {
    skipReason = `沒有系統 Chrome：${e instanceof Error ? e.message.split("\n")[0] : e}`;
  }
});
test.afterAll(async () => browser?.close());

/** 平均距離（只看畫面上的 xy） */
const meanDist = (a: Vec[], b: Vec[]) => a.reduce((s, p, i) => s + Math.hypot(p[0] - b[i][0], p[1] - b[i][1]), 0) / a.length;

/** Hero 裡一個沒有文字／按鈕的空白點（玩法會忽略點在 h1、p、a、button 上的） */
async function blankPoint(page: Page) {
  return page.evaluate(() => {
    const ignored = "a, button, h1, p, input, nav";
    for (const [fx, fy] of [[0.15, 0.7], [0.85, 0.7], [0.15, 0.3], [0.85, 0.3], [0.5, 0.85]]) {
      const x = Math.round(innerWidth * fx);
      const y = Math.round(innerHeight * fy);
      const el = document.elementFromPoint(x, y);
      if (el && !el.closest(ignored)) return { x, y };
    }
    throw new Error("Hero 裡找不到空白的地方");
  });
}

test("首頁 WebGPU 版：真的跑在 GPU 上，四個玩法都有動到粒子", async ({ baseURL }) => {
  test.skip(!browser && !REQUIRED, skipReason);
  expect(browser, skipReason).not.toBeNull();
  test.setTimeout(90_000);

  const context = await browser!.newContext({ baseURL, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.text().includes("[hero] WebGPU 版改回")) errors.push(m.text());
  });

  // 2026-11-22 晚起桌機預設是 WebGL 線條版（HeroBackground 的 AUTO_WEBGPU），WebGPU 版只有 ?hero=webgpu 叫得出來
  await page.goto("/?hero=webgpu");
  const hasAdapter = await page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return !!(gpu && (await gpu.requestAdapter()));
  });
  if (!hasAdapter && !REQUIRED) {
    await context.close();
    test.skip(true, "這台機器的 Chrome 拿不到 WebGPU adapter");
  }
  expect(hasAdapter, "Chrome 拿不到 WebGPU adapter（CI 設了 HERO_WEBGPU_REQUIRED）").toBe(true);

  await expect.poll(() => page.evaluate(() => window.__heroRenderer), { timeout: 30_000 }).toBe("webgpu");
  await expect.poll(() => page.evaluate(() => !!window.__heroProbe), { timeout: 10_000 }).toBe(true);
  // 每秒量一次 fps 調數量：有數字就代表畫面迴圈在跑
  await expect.poll(() => page.evaluate(() => window.__heroParticles ?? 0), { timeout: 10_000 }).toBeGreaterThanOrEqual(600);

  const pt = await blankPoint(page);
  await page.mouse.move(pt.x, pt.y);
  await page.waitForTimeout(500);

  // ① 按住不動 → 粒子往游標聚過來
  // 數「游標 1.5 單位內有幾顆」：遠的粒子拉不到，用全體平均距離看不出來
  const nearCursor = () =>
    page.evaluate(async () => {
      const p = window.__heroProbe!;
      const s = await p.sample(1000);
      const c = p.pointer();
      return { n: s.pos.filter((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < 1.5).length, gather: p.gather() };
    });
  const before = await nearCursor();
  await page.mouse.down();
  await page.waitForTimeout(2000);
  const during = await nearCursor();
  await page.mouse.up();
  expect(during.gather, "按住 2 秒，聚集應該啟動").toBeGreaterThan(0.5);
  expect(during.n, `游標附近的粒子 ${before.n} → ${during.n} 顆，按住應該聚過來`).toBeGreaterThan(Math.max(before.n * 2, before.n + 20));
  await page.waitForTimeout(3000); // 放開、散開、回到原位

  // ② 拖曳 → 留下星座的星點
  await page.mouse.move(pt.x, pt.y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(pt.x + (pt.x < 720 ? i : -i) * 25, pt.y - i * 12, { steps: 3 });
  const stars = await page.evaluate(() => window.__heroProbe!.stars());
  await page.mouse.up();
  expect(stars, "拖曳應該畫出星點").toBeGreaterThan(1);
  await page.waitForTimeout(500);

  // ③ 雙擊 → 換成「名字」，粒子在 GPU 上被彈簧拉到新的家
  await page.mouse.dblclick(pt.x, pt.y);
  expect(await page.evaluate(() => window.__heroProbe!.shape())).toBe("name");
  const right = await page.evaluate(() => window.__heroProbe!.sample());
  const far = meanDist(right.pos, right.home);
  await page.waitForTimeout(4000);
  const later = await page.evaluate(() => window.__heroProbe!.sample());
  const near = meanDist(later.pos, later.home);
  expect(far, "剛雙擊時粒子還在星空，離名字的位置應該很遠").toBeGreaterThan(1);
  expect(near, `4 秒後到新形狀的平均距離 ${far.toFixed(2)} → ${near.toFixed(2)}，應該已經就位`).toBeLessThan(far * 0.25);

  // ④ 再雙擊三次繞回星空
  for (const shape of ["routes", "icon", "stars"]) {
    await page.mouse.dblclick(pt.x, pt.y);
    expect(await page.evaluate(() => window.__heroProbe!.shape())).toBe(shape);
  }

  // 全程沒有退回 WebGL、沒有錯誤
  expect(await page.evaluate(() => window.__heroRenderer)).toBe("webgpu");
  expect(errors).toEqual([]);
  await context.close();
});
