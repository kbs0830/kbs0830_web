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
//
// 機型（TODO D4，2026-11-22）：新收到的飛機拿識別碼問 adsbdb.com（免費、不用金鑰）查機型，存在 data/aircraft-types.json
// （識別碼 → 機型的快取，跟位置無關、不公開）。公開的只有「每種機型幾架」的彙總。
// ⚠️ 不做航線統計：航線的交會處就是接收器的位置

const fs = require("node:fs");
const { twDate, twHour } = require("./tw-time");
const path = require("node:path");
const { recordTrack, readTrack, writeTrack } = require("./radar-live");

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

// ICAO 機型代碼 → 常見叫法（只放確定的；不在表上的直接顯示代碼）
const TYPE_NAMES = {
  A319: "A319", A320: "A320", A20N: "A320neo", A321: "A321", A21N: "A321neo",
  A332: "A330-200", A333: "A330-300", A339: "A330-900neo", A359: "A350-900", A35K: "A350-1000", A388: "A380",
  B737: "737-700", B738: "737-800", B739: "737-900", B38M: "737 MAX 8", B39M: "737 MAX 9",
  B744: "747-400", B748: "747-8", B763: "767-300", B772: "777-200", B77L: "777-200LR／777F", B773: "777-300", B77W: "777-300ER",
  B788: "787-8", B789: "787-9", B78X: "787-10",
  AT75: "ATR 72-500", AT76: "ATR 72-600", DH8D: "Dash 8-400", E190: "E190", E195: "E195",
};

/** 呼號 → 航空公司 ICAO 三碼（CAL123、EVA2195A）；註冊號、空白、軍機等其他格式回 null */
function airlineOf(callsign) {
  const m = String(callsign || "").trim().toUpperCase().match(/^([A-Z]{3})\d{1,4}[A-Z]{0,2}$/);
  return m ? m[1] : null;
}


function emptyState(now) {
  return { since: twDate(now), status: null, days: {}, today: { date: twDate(now), seen: {} } };
}

/**
 * 「現在收到的航班」（決策表 Q1，2026-11-25，/radar 頁用）：只留航班代碼、機型、高度——
 * 沒有識別碼（hex）、座標、距離。高度四捨五入到 1,000 ft，降低拿去跟公開航跡比對、推回接收器位置的可能。
 * 只收有正常呼號的（沒呼號的私人機、軍機不列），高的排前面，最多 12 架
 */
function flightsNow(current, types) {
  return current
    .map((a) => {
      const flight = String(a.flight || "").trim().toUpperCase();
      if (!/^[A-Z]{2,3}\d{1,4}[A-Z]{0,2}$/.test(flight)) return null;
      const alt = a.alt === "ground" ? 0 : typeof a.alt === "number" ? Math.round(a.alt / 1000) * 1000 : null;
      const t = types && types[String(a.hex).toLowerCase()];
      return { flight, airline: airlineOf(flight), alt, type: t && t.t ? t.t : null };
    })
    .filter(Boolean)
    .sort((x, y) => (y.alt ?? -1) - (x.alt ?? -1) || x.flight.localeCompare(y.flight))
    .slice(0, 12);
}

/**
 * 一次讀取結果併進統計。sample：{ reachable, rxConnected, shutdown, aircraft: [{ hex, flight, seen }] }
 * （reachable＝兩個網址都讀得到）。types：機型快取（識別碼 → { t } 或 { miss }，見 lookupTypes），沒有就不算機型。
 * 回傳新的 state，不改傳進來的那份。
 */
function applySample(prev, sample, now, types) {
  const state = prev && prev.days ? JSON.parse(JSON.stringify(prev)) : emptyState(now);
  const date = twDate(now);
  if (!state.today || state.today.date !== date) state.today = { date, seen: {} };
  if (!state.today.typed) state.today.typed = {}; // 今天已經算過機型的識別碼（換日跟 seen 一起丟）

  const ok = Boolean(sample.reachable && sample.rxConnected && !sample.shutdown);
  const current = ok ? (sample.aircraft || []).filter((a) => a && a.hex && (a.seen ?? 0) <= RECENT_SECONDS) : [];

  const day = (state.days[date] = state.days[date] || { polls: 0, online: 0, peak: 0, unique: 0, airlines: {} });
  // 每小時最多同時幾架（台灣時間；/radar「一天的節奏」用）。null＝那個小時還沒有在線的紀錄（2026-11-21 晚上才加，之前的日子沒有）
  if (!Array.isArray(day.hourPeak)) day.hourPeak = Array(24).fill(null);
  day.polls++;
  if (ok) {
    day.online++;
    const h = twHour(now);
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

  // 機體図鑑（2026-11-25）：每種機型第一次收到的日期＋累計架次，永久保留（days 只留 KEEP_DAYS 天）。
  // 第一次跑時從現有的 days 回填，之後跟 day.types 一起加
  if (!state.dex) {
    state.dex = {};
    for (const d of Object.keys(state.days).sort())
      for (const [t, n] of Object.entries(state.days[d].types || {})) {
        const e = (state.dex[t] = state.dex[t] || { first: d, n: 0 });
        e.n += n;
      }
  }

  // 機型：今天看過、快取裡查到了、還沒算過的才算（查不到的也記成算過，不再重試）
  if (types) {
    if (!day.types) day.types = {};
    for (const hex of Object.keys(state.today.seen)) {
      if (state.today.typed[hex]) continue;
      const hit = types[hex];
      if (!hit) continue;
      state.today.typed[hex] = 1;
      if (hit.t) {
        day.types[hit.t] = (day.types[hit.t] || 0) + 1;
        const e = (state.dex[hit.t] = state.dex[hit.t] || { first: date, n: 0 });
        e.n++;
      }
    }
  }

  const prevStatus = state.status || {};
  state.status = {
    checkedAt: now,
    reachable: Boolean(sample.reachable),
    rxConnected: Boolean(sample.rxConnected),
    shutdown: Boolean(sample.shutdown),
    aircraftNow: current.length,
    flightsNow: flightsNow(current, types),
    lastOkAt: ok ? now : prevStatus.lastOkAt || null,
    lastAircraftAt: current.length > 0 ? now : prevStatus.lastAircraftAt || null,
  };

  const cutoff = twDate(now - KEEP_DAYS * 86400_000);
  for (const d of Object.keys(state.days)) if (d < cutoff) delete state.days[d];
  return state;
}

/** 機體図鑑：[{ code, first, n }]，初見早的排前面。只有機型代碼、日期、架次（沒有識別碼、時間、位置） */
function dex(state) {
  let book = state && state.dex;
  if (!book && state && state.days) {
    // 還沒跑過新版 applySample（剛部署）：直接從 days 算
    book = {};
    for (const d of Object.keys(state.days).sort())
      for (const [t, n] of Object.entries(state.days[d].types || {})) {
        const e = (book[t] = book[t] || { first: d, n: 0 });
        e.n += n;
      }
  }
  return Object.entries(book || {})
    .map(([code, e]) => ({ code, first: e.first, n: e.n }))
    .sort((a, b) => a.first.localeCompare(b.first) || b.n - a.n);
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
    // 最後一次收到飛機的時間（只有時間，沒有位置）：/radar 0 架時寫「上一架 HH:MM 經過」，不會看起來像壞掉（TODO M11）
    lastAircraftAt: s.lastAircraftAt || null,
    today: {
      unique: today.unique,
      peak: today.peak,
      airlines: topAirlines(today.airlines, 6),
    },
    week: { unique: sum("unique"), uptime: sum("polls") ? Math.round((sum("online") / sum("polls")) * 1000) / 10 : null },
    since: state.since,
  };
}

const topTypes = (counts, n) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([code, count]) => ({ code, name: TYPE_NAMES[code] || code, n: count }));

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
 *   weekTypes：近 7 天機型前 10
 * 一樣只有數字、航空公司、機型，沒有識別碼、座標
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
  const weekTypeCounts = {};
  for (const v of last7) for (const [k, n] of Object.entries(v.types || {})) weekTypeCounts[k] = (weekTypeCounts[k] || 0) + n;
  const all = Object.values(state.days);
  const s = state.status || {};
  return {
    ...base,
    // 現在收到的航班（Q1）：只在 /radar 頁（detail），不進 /api/radar（summarize）
    flightsNow: base.online && Array.isArray(s.flightsNow)
      ? s.flightsNow.map((f) => ({ ...f, airlineName: f.airline ? AIRLINE_NAMES[f.airline] || null : null, typeName: f.type ? TYPE_NAMES[f.type] || f.type : null }))
      : [],
    daily,
    hours,
    weekAirlines: topAirlines(weekCounts, 10),
    weekTypes: topTypes(weekTypeCounts, 10),
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
      // 高度：這版 dump1090-mutability 叫 altitude（地面是 "ground"），新版 readsb 叫 alt_baro
      aircraft: (Array.isArray(a.aircraft) ? a.aircraft : []).map((x) => ({
        hex: x.hex, flight: x.flight, seen: x.seen, alt: x.altitude ?? x.alt_baro,
        // 座標／速度／航向：只給 radar-live.js 的「延遲 5 分鐘直播畫面」用（它自己說明隱私規則），applySample 的彙總不碰
        lat: x.lat, lon: x.lon, seen_pos: x.seen_pos, speed: x.speed, track: x.track,
      })),
    };
  } catch {
    return { reachable: false, rxConnected: false, shutdown: false, aircraft: [] };
  }
}

const TYPE_LOOKUPS_PER_TICK = 4; // 每 30 秒最多問 adsbdb 4 次（新收到的飛機才問，問過的存快取）
const TYPE_MISS_RETRY_MS = 30 * 86400_000; // 查不到的 30 天後再試一次
const TYPE_CACHE_MAX = 30_000;

/** adsbdb 查一架的機型：{ t } 查到、{ miss } 資料庫沒有這架、null 這次沒查成（網路錯誤之類，下次再試） */
async function fetchType(hex, now) {
  try {
    const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(hex)}`, { signal: AbortSignal.timeout(5000) });
    if (res.status === 404) return { miss: 1, at: now };
    if (!res.ok) return null;
    const j = await res.json();
    const t = j && j.response && j.response.aircraft && j.response.aircraft.icao_type;
    return typeof t === "string" && /^[A-Z0-9]{2,4}$/.test(t) ? { t, at: now } : { miss: 1, at: now };
  } catch {
    return null;
  }
}

/** 今天看過、快取裡還沒有（或很久以前查不到）的識別碼，挑幾個去查。回傳有沒有改到快取 */
async function lookupTypes(state, types, now, fetcher = fetchType) {
  const todo = Object.keys((state && state.today && state.today.seen) || {}).filter((hex) => {
    const c = types[hex];
    return !c || (c.miss && now - (c.at || 0) > TYPE_MISS_RETRY_MS);
  });
  let changed = false;
  for (const hex of todo.slice(0, TYPE_LOOKUPS_PER_TICK)) {
    const r = await fetcher(hex, now);
    if (!r) break; // 網路有問題：這輪先停
    types[hex] = r;
    changed = true;
  }
  const keys = Object.keys(types);
  if (keys.length > TYPE_CACHE_MAX) {
    keys.sort((a, b) => (types[a].at || 0) - (types[b].at || 0));
    for (const k of keys.slice(0, keys.length - TYPE_CACHE_MAX)) delete types[k];
    changed = true;
  }
  return changed;
}

/** server.js 呼叫：每 30 秒讀一次、寫檔。寫檔是同步的（同一個 process 只有這裡寫，API 只讀） */
function startRadarPoller({ host, file, typesFile, log }) {
  let running = false;
  const typesPath = typesFile || path.join(path.dirname(file), "aircraft-types.json");
  const types = readState(typesPath) || {};
  const trackPath = path.join(path.dirname(file), "radar-track.json");
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const sample = await pollRadar(host);
      const now = Date.now();
      const prev = readState(file);
      if (await lookupTypes(prev, types, now)) fs.writeFileSync(typesPath, JSON.stringify(types));
      const next = applySample(prev, sample, now, types);
      fs.writeFileSync(file, JSON.stringify(next));
      // 直播畫面用的位置軌跡（只留 20 分鐘，公開時延遲 5 分鐘；規則見 radar-live.js）
      writeTrack(trackPath, recordTrack(readTrack(trackPath), sample, now));
    } catch (e) {
      if (log) log(`RADAR poll error: ${e && e.message ? e.message : e}`);
    } finally {
      running = false;
    }
  };
  tick();
  return setInterval(tick, POLL_MS).unref();
}

module.exports = { AIRLINE_NAMES, TYPE_NAMES, lookupTypes, airlineOf, applySample, summarize, detail, dex, readState, startRadarPoller, flightsNow };
