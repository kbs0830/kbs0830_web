// 自家雷達「直播用」的飛機位置（2026-11-27，使用者要用 OBS 把 /radar/live 直播到 YouTube）。
//
// 跟 radar.js 的彙總是兩回事：這裡要存「座標」，所以隱私規則寫在前面——
//   1. 位置一律延遲 DELAY_MS 才放出來（2026-11-27 使用者指定 5 分鐘；2026-11-29 改成 1 分鐘）：公開的畫面是「1 分鐘前的天空」，
//      不能拿來即時追蹤，也很難用來反推接收器的覆蓋範圍。
//   2. 只留最近 KEEP_MS（20 分鐘）的取樣，寫在 data/radar-track.json（不進 git；會進每日備份，內容 20 分鐘就換光）。
//   3. 對外的 id 是 HMAC（啟動時隨機金鑰）取 8 碼，不是 ICAO hex；地面與 1,000 ft 以下的不放、座標粗化到約 100 公尺；對外沒有 hex、squawk、訊號強度。
//   4. 畫面的地圖固定在高雄周邊、不以接收器為圓心、不畫距離圈、不標接收器位置（見 RadarLiveScreen.tsx）。
// 離線／飛機 0 架時照樣記（空的取樣），不然畫面不知道「那段時間沒飛機」還是「沒資料」。

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { twDate } = require("./tw-time");

const DELAY_MS = 60_000; // 位置延遲（1 分鐘）
const WINDOW_MS = 8 * 60_000; // 一次給畫面多久的取樣（5 分鐘軌跡＋2～3 分鐘播放緩衝）
const KEEP_MS = DELAY_MS + WINDOW_MS + 60_000;
const POS_FRESH_S = 30; // 位置超過 30 秒沒更新的不畫（aircraft.json 會留著舊的）
const MAX_SAMPLES = 80;
const RECENT_KEEP_MS = 60 * 60_000;
const RECENT_GONE_MS = 60_000; // 最後被看到的時間比「畫面時間」早這麼久，才算「剛剛經過」（還在畫面上的不算）
const CALLSIGN = /^[A-Z]{2,3}\d{1,4}[A-Z]{0,2}$/;

const num = (v, digits = 0) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 10 ** digits) / 10 ** digits : null);

/** 一次讀取的結果併進軌跡。prev＝上一份檔案內容（null 也行），回傳新的物件。ok＝接收器正常 */
function recordTrack(prev, sample, now) {
  const keep = (prev && Array.isArray(prev.samples) ? prev.samples : []).filter((s) => now - s.t <= KEEP_MS);
  const ok = Boolean(sample && sample.reachable && sample.rxConnected && !sample.shutdown);
  const ac = ok
    ? (sample.aircraft || [])
        .filter((a) => a && a.hex && typeof a.lat === "number" && typeof a.lon === "number" && (a.seen_pos ?? a.seen ?? 0) <= POS_FRESH_S)
        .map((a) => ({
          h: String(a.hex).toLowerCase(),
          f: String(a.flight || "").trim().toUpperCase(),
          la: num(a.lat, 4),
          lo: num(a.lon, 4),
          al: a.alt === "ground" ? 0 : num(a.alt),
          sp: num(a.speed),
          tr: num(a.track),
          vr: num(a.vert_rate),
        }))
    : [];
  keep.push({ t: now, ok, ac });
  // 「剛剛經過」：每架（有正常呼號、高度夠）最後一次被看到的時間與狀態，留 60 分鐘、最多 40 筆（超過 20 分鐘的取樣已經丟了，這份另外留）
  const recent = Object.fromEntries(Object.entries((prev && prev.recent) || {}).filter(([, e]) => now - e.t <= RECENT_KEEP_MS));
  for (const a of ac) {
    if (!CALLSIGN.test(a.f) || typeof a.al !== "number" || a.al < MIN_ALT_FT) continue;
    recent[a.h] = { f: a.f, t: now, al: a.al, sp: a.sp, tr: a.tr, vr: a.vr };
  }
  const recentKept = Object.fromEntries(Object.entries(recent).sort((x, y) => y[1].t - x[1].t).slice(0, 40));
  return { samples: keep.slice(-MAX_SAMPLES), recent: recentKept };
}

// id：HMAC＋每次啟動隨機產生的金鑰（hex 只有 24 位元，單純雜湊可以暴力還原）；金鑰只在記憶體，重啟後 id 換一批（畫面上的尾跡斷一次，無妨）
const SECRET = crypto.randomBytes(16);
const idOf = (hex, date) => crypto.createHmac("sha256", SECRET).update(`${hex}|${date}`).digest("hex").slice(0, 8);

const MIN_ALT_FT = 1000; // 地面、1,000 ft 以下、高度不明的都不放出去（fail closed）：低空航跡會透露離機場／接收器多近
const coarse = (v) => Math.round(v * 1000) / 1000; // 對外座標 3 位小數（約 100 公尺）

/**
 * 給 /radar/live 畫面的資料：只含 now - DELAY_MS 以前的取樣。
 * @param track  readState(radar-track.json)
 * @param types  機型快取（hex → { t }），可 null
 * @param names  { airlines: {CAL:"中華航空"}, types: {A321:"A321"} }（radar.js 的對照表）
 */
function buildFrame(track, types, names, now) {
  const cutoff = now - DELAY_MS;
  const date = twDate(now);
  const samples = (track && Array.isArray(track.samples) ? track.samples : []).filter((s) => s.t <= cutoff && s.t >= cutoff - WINDOW_MS);
  const info = {};
  const out = samples.map((s) => ({
    t: s.t,
    ok: s.ok,
    p: s.ac.filter((a) => typeof a.al === "number" && a.al >= MIN_ALT_FT).map((a) => {
      const id = idOf(a.h, date);
      const airline = (a.f.match(/^([A-Z]{3})\d{1,4}[A-Z]{0,2}$/) || [])[1] || null;
      const ty = types && types[a.h] && types[a.h].t ? types[a.h].t : null;
      info[id] = {
        f: /^[A-Z]{2,3}\d{1,4}[A-Z]{0,2}$/.test(a.f) ? a.f : "",
        al: airline,
        an: airline ? (names.airlines[airline] || null) : null,
        ty,
        tn: ty ? (names.types[ty] || ty) : null,
      };
      return [id, coarse(a.la), coarse(a.lo), a.al, a.sp, a.tr, a.vr ?? null];
    }),
  }));
  // 剛剛經過（前 5 班）：最後被看到的時間在畫面時間之前 RECENT_GONE_MS 以上；同班號只留最新一筆
  const seenF = new Set();
  const recent = Object.entries((track && track.recent) || {})
    .filter(([, e]) => e.t <= cutoff - RECENT_GONE_MS)
    .sort((x, y) => y[1].t - x[1].t)
    .filter(([, e]) => (seenF.has(e.f) ? false : (seenF.add(e.f), true)))
    .slice(0, 5)
    .map(([hex, e]) => {
      const airline = (e.f.match(/^([A-Z]{3})\d/) || [])[1] || null;
      const ty = types && types[hex] && types[hex].t ? types[hex].t : null;
      return { f: e.f, al: airline, an: airline ? names.airlines[airline] || null : null, ty, tn: ty ? names.types[ty] || ty : null, t: e.t, alt: e.al, sp: e.sp, tr: e.tr };
    });
  return { now, delayMs: DELAY_MS, samples: out, info, recent };
}

function readTrack(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** 寫檔：先寫 .tmp 再改名（API 隨時在讀，不要讀到寫一半的） */
function writeTrack(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(value));
  fs.renameSync(`${file}.tmp`, file);
}

module.exports = { DELAY_MS, WINDOW_MS, recordTrack, buildFrame, readTrack, writeTrack, idOf };
