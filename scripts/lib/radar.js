// 自家 FR24 雷達（ADS-B 接收器）即時狀態（TODO 點子 B13，2026-11-21）。
//
// scripts/server.js 每 30 秒在區網讀一次雷達（.env.local 的 RADAR_HOST，沒設就整個不跑）：
//   - http://<RADAR_HOST>:8754/monitor.json        fr24feed 的狀態（接收器有沒有連上、是不是卡在關機）
//   - http://<RADAR_HOST>/dump1090/data/aircraft.json  現在收到的飛機
// 彙總寫進 data/radar.json，/api/radar 讀它給 /flights 的 RadarStatus 顯示，watchdog 拿 status 判斷要不要寄信。
//
// ⚠️ 隱私（使用者家裡的接收器）：
//   - monitor.json 裡有 FR24 分享金鑰（fr24key）跟內網 IP：這裡只挑需要的欄位，金鑰、IP 一個字都不存
//   - 不存飛機座標、不算涵蓋範圍／最遠距離——把收得到的飛機位置畫出來就看得出接收器（＝家）在哪
//   - 公開的只有：現在幾架、今天幾架、最多同時幾架、航空公司統計、在線率
//   - 今天看過的飛機識別碼（ICAO hex，是飛機的、不是人的）只為了算「今天幾架不重複」，換日就丟掉，不經 API 出去

const fs = require("fs");

const POLL_MS = 30_000;
const KEEP_DAYS = 120;
const RECENT_SECONDS = 60; // aircraft.json 會留 5 分鐘沒訊號的飛機；60 秒內有收到才算「現在」

// ICAO 三碼 → 中文（只放確定的；不在表上的直接顯示三碼）
const AIRLINE_NAMES = {
  CAL: "中華航空", EVA: "長榮航空", SJX: "星宇航空", TTW: "台灣虎航", MDA: "華信航空", UIA: "立榮航空",
  CPA: "國泰航空", HKE: "香港快運", CRK: "香港航空",
  JAL: "日本航空", ANA: "全日空", APJ: "樂桃航空", JJP: "捷星日本", SKY: "天馬航空",
  KAL: "大韓航空", AAR: "韓亞航空", JNA: "真航空", TWB: "德威航空", JJA: "濟州航空", ABL: "釜山航空",
  PAL: "菲律賓航空", CEB: "宿霧太平洋", VJC: "越捷航空", HVN: "越南航空", THA: "泰國航空",
  SIA: "新加坡航空", TGW: "酷航", MAS: "馬來西亞航空", AXM: "亞洲航空",
  CES: "東方航空", CSN: "南方航空", CCA: "中國國際航空", CXA: "廈門航空",
  UAL: "聯合航空", DAL: "達美航空", AAL: "美國航空",
  FDX: "聯邦快遞", UPS: "UPS", GTI: "亞特拉斯航空", CKS: "卡利塔航空",
  QTR: "卡達航空", UAE: "阿聯酋航空", THY: "土耳其航空", KLM: "荷蘭皇家航空",
};

/** 呼號 → 航空公司 ICAO 三碼（CAL123、EVA2195A）；註冊號、空白、軍機等其他格式回 null */
function airlineOf(callsign) {
  const m = String(callsign || "").trim().toUpperCase().match(/^([A-Z]{3})\d{1,4}[A-Z]{0,2}$/);
  return m ? m[1] : null;
}

/** 台灣日期 YYYY-MM-DD */
function twDate(ms) {
  return new Date(ms + 8 * 3600_000).toISOString().slice(0, 10);
}

function emptyState(now) {
  return { since: twDate(now), status: null, days: {}, today: { date: twDate(now), seen: {} } };
}

/**
 * 一次讀取結果併進統計。sample：{ reachable, rxConnected, shutdown, aircraft: [{ hex, flight, seen }] }
 * （reachable＝兩個網址都讀得到）。回傳新的 state，不改傳進來的那份。
 */
function applySample(prev, sample, now) {
  const state = prev && prev.days ? JSON.parse(JSON.stringify(prev)) : emptyState(now);
  const date = twDate(now);
  if (!state.today || state.today.date !== date) state.today = { date, seen: {} };

  const ok = Boolean(sample.reachable && sample.rxConnected && !sample.shutdown);
  const current = ok ? (sample.aircraft || []).filter((a) => a && a.hex && (a.seen ?? 0) <= RECENT_SECONDS) : [];

  const day = (state.days[date] = state.days[date] || { polls: 0, online: 0, peak: 0, unique: 0, airlines: {} });
  // 每小時最多同時幾架（台灣時間；/radar「一天的節奏」用）。null＝那個小時還沒有在線的紀錄（2026-11-21 晚上才加，之前的日子沒有）
  if (!Array.isArray(day.hourPeak)) day.hourPeak = Array(24).fill(null);
  day.polls++;
  if (ok) {
    day.online++;
    const h = new Date(now + 8 * 3600_000).getUTCHours();
    day.hourPeak[h] = Math.max(day.hourPeak[h] ?? 0, current.length);
  }
  day.peak = Math.max(day.peak, current.length);
  for (const a of current) {
    const hex = String(a.hex).toLowerCase();
    const airline = airlineOf(a.flight);
    const known = state.today.seen[hex];
    if (known === undefined) {
      state.today.seen[hex] = airline || "";
      day.unique++;
      if (airline) day.airlines[airline] = (day.airlines[airline] || 0) + 1;
    } else if (!known && airline) {
      // 第一次收到時還沒有呼號（呼號是另一種訊息，常常晚幾秒才到）：補記
      state.today.seen[hex] = airline;
      day.airlines[airline] = (day.airlines[airline] || 0) + 1;
    }
  }

  const prevStatus = state.status || {};
  state.status = {
    checkedAt: now,
    reachable: Boolean(sample.reachable),
    rxConnected: Boolean(sample.rxConnected),
    shutdown: Boolean(sample.shutdown),
    aircraftNow: current.length,
    lastOkAt: ok ? now : prevStatus.lastOkAt || null,
    lastAircraftAt: current.length > 0 ? now : prevStatus.lastAircraftAt || null,
  };

  const cutoff = twDate(now - KEEP_DAYS * 86400_000);
  for (const d of Object.keys(state.days)) if (d < cutoff) delete state.days[d];
  return state;
}

/** /api/radar 回傳的公開資料：只有數字跟航空公司，沒有識別碼、座標、IP、金鑰 */
function summarize(state, now) {
  if (!state || !state.status) return { configured: false };
  const s = state.status;
  const fresh = now - s.checkedAt < 3 * 60_000;
  const online = fresh && s.reachable && s.rxConnected && !s.shutdown;
  const date = twDate(now);
  const today = state.days[date] || { polls: 0, online: 0, peak: 0, unique: 0, airlines: {} };
  const last7 = Object.entries(state.days)
    .filter(([d]) => d > twDate(now - 7 * 86400_000))
    .map(([, v]) => v);
  const sum = (k) => last7.reduce((n, v) => n + v[k], 0);
  return {
    configured: true,
    online,
    aircraftNow: online ? s.aircraftNow : 0,
    today: {
      unique: today.unique,
      peak: today.peak,
      airlines: topAirlines(today.airlines, 6),
    },
    week: { unique: sum("unique"), uptime: sum("polls") ? Math.round((sum("online") / sum("polls")) * 1000) / 10 : null },
    since: state.since,
  };
}

const topAirlines = (counts, n) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([code, count]) => ({ code, name: AIRLINE_NAMES[code] || code, n: count }));

/**
 * /radar 頁用的完整資料（Server Component 直接讀檔呼叫，不經 API）：summarize() 再加
 *   daily：近 30 天每天幾架、最多同時、在線率（沒資料的日子是 null）
 *   hours：近 7 天（含今天）每小時「最多同時幾架」的平均
 *   weekAirlines：近 7 天航空公司前 10
 *   total：開始記錄以來累計架次、最多同時、記錄天數
 * 一樣只有數字跟航空公司，沒有識別碼、座標
 */
function detail(state, now) {
  const base = summarize(state, now);
  if (!base.configured) return base;
  const dates = Array.from({ length: 30 }, (_, i) => twDate(now - (29 - i) * 86400_000));
  const daily = dates.map((date) => {
    const v = state.days[date];
    return { date, unique: v ? v.unique : null, peak: v ? v.peak : null, uptime: v && v.polls ? Math.round((v.online / v.polls) * 1000) / 10 : null };
  });
  const last7 = dates.slice(-7).map((d) => state.days[d]).filter(Boolean);
  const hours = Array.from({ length: 24 }, (_, h) => {
    const vals = last7.map((v) => (Array.isArray(v.hourPeak) ? v.hourPeak[h] : null)).filter((x) => typeof x === "number");
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  });
  const weekCounts = {};
  for (const v of last7) for (const [k, n] of Object.entries(v.airlines || {})) weekCounts[k] = (weekCounts[k] || 0) + n;
  const all = Object.values(state.days);
  return {
    ...base,
    daily,
    hours,
    weekAirlines: topAirlines(weekCounts, 10),
    total: { unique: all.reduce((n, v) => n + v.unique, 0), peak: all.reduce((m, v) => Math.max(m, v.peak), 0), days: all.length },
  };
}

function readState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** 讀一次雷達。只取需要的欄位：monitor.json 有金鑰，整份不要留著 */
async function pollRadar(host) {
  const get = async (url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  };
  try {
    const [m, a] = await Promise.all([get(`http://${host}:8754/monitor.json`), get(`http://${host}/dump1090/data/aircraft.json`)]);
    return {
      reachable: true,
      rxConnected: m.rx_connected === "1",
      shutdown: m.shutdown === "yes",
      aircraft: (Array.isArray(a.aircraft) ? a.aircraft : []).map((x) => ({ hex: x.hex, flight: x.flight, seen: x.seen })),
    };
  } catch {
    return { reachable: false, rxConnected: false, shutdown: false, aircraft: [] };
  }
}

/** server.js 呼叫：每 30 秒讀一次、寫檔。寫檔是同步的（同一個 process 只有這裡寫，API 只讀） */
function startRadarPoller({ host, file, log }) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const sample = await pollRadar(host);
      const next = applySample(readState(file), sample, Date.now());
      fs.writeFileSync(file, JSON.stringify(next));
    } catch (e) {
      if (log) log(`RADAR poll error: ${e && e.message ? e.message : e}`);
    } finally {
      running = false;
    }
  };
  tick();
  return setInterval(tick, POLL_MS).unref();
}

module.exports = { AIRLINE_NAMES, airlineOf, twDate, applySample, summarize, detail, readState, pollRadar, startRadarPoller };
