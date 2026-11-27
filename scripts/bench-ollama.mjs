// Ollama 基準測試（TODO H2，2026-11-27，文章 rtx-3070-local-llm-benchmark）：
//   node scripts/bench-ollama.mjs <輸出json> <模型...>      例：node scripts/bench-ollama.mjs bench.json gemma3:4b llama3.2:3b
// 量：冷啟動載入秒數、顯存（/api/ps 的 size_vram）、生成速度 tok/s（短題、長提示各 3 次取中位數）、
// 長提示的處理速度與首字等待、GPU 功耗／溫度（nvidia-smi 每 250ms 取樣）。固定 temperature 0、seed 1。
// ⚠️ 會把 Ollama 裡所有模型卸載再逐一載入（網站的 /ask 會暫時變慢）；單次測量的短題速度會飄 ±30%，要跑兩輪以上看範圍。
// 長提示用 content/blog 兩篇文章當內容：文章改了，數字不能跟舊的比。開頭每次加不同編號，避免前綴快取讓處理速度假得離譜。
import fs from "node:fs";
import { spawn, execFileSync } from "node:child_process";

const OLLAMA = "http://127.0.0.1:11434";
const [out, ...models] = process.argv.slice(2);
const repo = new URL("../content/blog/", import.meta.url);
const strip = (f) => fs.readFileSync(new URL(f, repo), "utf8").replace(/^---[\s\S]*?---/, "").replace(/\s+/g, " ");
const CONTEXT = (strip("tunnel-down-four-days.mdx") + " " + strip("task-scheduler-72-hours.mdx")).slice(0, 2600);
const SHORT = "請用繁體中文，分三段說明為什麼自架網站需要做健康檢查，每段兩三句。";
const LONG = `你是這個網站的小助理，只根據下面的參考資料回答。\n【參考資料】${CONTEXT}\n\n【問題】這個網站曾經因為什麼原因掛掉？請用三句話回答。`;

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ps() {
  return (await (await fetch(`${OLLAMA}/api/ps`)).json()).models ?? [];
}
async function unloadAll() {
  for (const m of await ps()) {
    execFileSync("ollama", ["stop", m.name]);
  }
  for (let i = 0; i < 20 && (await ps()).length; i++) await sleep(500);
  await sleep(1500);
}

function startSampler() {
  const rows = [];
  const p = spawn("nvidia-smi", ["--query-gpu=power.draw,temperature.gpu,utilization.gpu,memory.used", "--format=csv,noheader,nounits", "-lms", "250"]);
  let buf = "";
  p.stdout.on("data", (d) => {
    buf += d;
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const l of lines) {
      const [pw, t, u, m] = l.split(",").map((x) => Number(x.trim()));
      if (Number.isFinite(pw)) rows.push({ pw, t, u, m });
    }
  });
  return { rows, stop: () => p.kill() };
}

async function gen(model, prompt, options) {
  const res = await fetch(`${OLLAMA}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, keep_alive: "5m", options: { temperature: 0, seed: 1, ...options } }),
    signal: AbortSignal.timeout(600_000),
  });
  if (!res.ok) throw new Error(`${model} ${res.status} ${await res.text()}`);
  const r = await res.json();
  return {
    loadS: r.load_duration / 1e9,
    promptTok: r.prompt_eval_count,
    promptTps: r.prompt_eval_count / (r.prompt_eval_duration / 1e9),
    ttftS: (r.load_duration + r.prompt_eval_duration) / 1e9,
    genTok: r.eval_count,
    genTps: r.eval_count / (r.eval_duration / 1e9),
    text: r.response,
  };
}

const results = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : {};
for (const model of models) {
  console.log(`\n=== ${model}`);
  try {
    await unloadAll();
    const idle = startSampler();
    await sleep(1500);
    const idleW = median(idle.rows.map((r) => r.pw));
    const idleMem = median(idle.rows.map((r) => r.m));
    idle.stop();

    const s = startSampler();
    const cold = await gen(model, "你好", { num_predict: 4, num_ctx: 4096 }); // 冷啟動：load_duration
    await sleep(500);
    const loaded = (await ps()).find((m) => m.name.startsWith(model.split(":")[0]) || m.name === model);
    const memAfterLoad = s.rows.at(-1)?.m ?? null;
    const shortRuns = [];
    for (let i = 0; i < 3; i++) shortRuns.push(await gen(model, SHORT, { num_predict: 256, num_ctx: 4096 }));
    const longRuns = [];
    for (let i = 0; i < 3; i++) longRuns.push(await gen(model, `（第 ${i + 1} 次提問，編號 ${Date.now()}）
${LONG}`, { num_predict: 120, num_ctx: 6144 })); // 開頭放不同的字：避免前綴快取讓處理速度失真
    const after = (await ps()).find((m) => m.name.startsWith(model.split(":")[0]) || m.name === model);
    s.stop();
    const busy = s.rows.filter((r) => r.u > 30);
    results[model] = {
      idleW, idleMemMiB: idleMem,
      coldLoadS: Number(cold.loadS.toFixed(1)),
      sizeGB: loaded ? Number((loaded.size / 1e9).toFixed(2)) : null,
      vramGB: loaded ? Number((loaded.size_vram / 1e9).toFixed(2)) : null,
      vramGB6144: after ? Number((after.size_vram / 1e9).toFixed(2)) : null,
      sizeGB6144: after ? Number((after.size / 1e9).toFixed(2)) : null,
      gpuMemUsedMiB: Math.max(...s.rows.map((r) => r.m)),
      shortTps: Number(median(shortRuns.map((r) => r.genTps)).toFixed(1)),
      longPromptTok: longRuns[0].promptTok,
      longPromptTps: Number(median(longRuns.map((r) => r.promptTps)).toFixed(0)),
      longTtftS: Number(median(longRuns.map((r) => r.ttftS)).toFixed(2)),
      longGenTps: Number(median(longRuns.map((r) => r.genTps)).toFixed(1)),
      avgW: busy.length ? Math.round(busy.reduce((n, r) => n + r.pw, 0) / busy.length) : null,
      peakW: Math.round(Math.max(...s.rows.map((r) => r.pw))),
      maxTempC: Math.max(...s.rows.map((r) => r.t)),
      memAfterLoad,
      shortSample: shortRuns[0].text.slice(0, 300),
      longAnswer: longRuns[0].text.slice(0, 300),
    };
    console.log(JSON.stringify({ ...results[model], shortSample: undefined, longAnswer: undefined }));
    fs.writeFileSync(out, JSON.stringify(results, null, 2));
  } catch (e) {
    console.log("FAILED", e.message);
    results[model] = { error: String(e.message).slice(0, 200) };
    fs.writeFileSync(out, JSON.stringify(results, null, 2));
  }
}
await unloadAll();
console.log("\nDONE");
