// 自家雷達樹莓派的健康狀態（2026-11-26，使用者換完電源：「幫我看派的記憶卡或是溫度什麼的有沒有問題，並寫進網站後台監視」）。
//
// scripts/server.js 每 15 分鐘用 SSH（唯讀金鑰 ~/.ssh/pi24_radar，帳號 pi）跑一小段指令，讀：
//   溫度、供電／降頻旗標（vcgencmd get_throttled）、開機多久、根目錄用量、是不是變成唯讀、
//   核心訊息裡的記憶卡／檔案系統錯誤數、檔案系統狀態（tune2fs）、累計寫入量、可用記憶體、Wi-Fi 訊號、fr24feed 有沒有在跑
// 寫進 data/radar-health.json，只給站長後台（/admin/ops）看，不經公開 API。
// ⚠️ 不存 IP、金鑰、位置。RADAR_HOST 沒設、金鑰檔不存在就整個不跑。
// 2026-11-23 那次斷線是供電不足（get_throttled 0x50005），這裡會把「現在欠壓」跟「開機後曾經欠壓」分開記。

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { pullJournal } = require("./pi-journal.js");

const POLL_MS = 15 * 60_000; // 2026-11-28 使用者：「改成 15 分鐘 SSH 進去一次，不要太頻繁」
const KEEP_MS = 24 * 3600_000; // 溫度歷史留 24 小時（算最高溫用）

// 遠端跑的指令（從 stdin 給 bash -s，避免 Windows 命令列引號問題）。每行一個 key=value
const SCRIPT = `
echo up=$(cut -d. -f1 /proc/uptime)
echo thr=$(vcgencmd get_throttled | cut -d= -f2)
echo temp=$(vcgencmd measure_temp | tr -dc '0-9.')
echo disk=$(df --output=pcent / | tail -1 | tr -dc 0-9)
echo mount=$(awk '$2=="/"{split($4,a,",");print a[1]}' /proc/mounts)
echo ioerr=$(dmesg 2>/dev/null | grep -ciE 'mmc[0-9]+:.*(error|timeout)|I/O error|EXT4-fs error')
T=$(sudo -n tune2fs -l "$(findmnt -no SOURCE /)" 2>/dev/null)
echo fs=$(echo "$T" | awk -F: '/^Filesystem state/{gsub(/ /,"",$2);print $2}')
echo writes=$(echo "$T" | awk -F: '/^Lifetime writes/{gsub(/^ +/,"",$2);print $2}')
echo mem=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
echo wifi=$(awk 'NR==3{print int($4)}' /proc/net/wireless)
echo sd=$(cat /sys/block/mmcblk0/device/name 2>/dev/null)
echo sddate=$(cat /sys/block/mmcblk0/device/date 2>/dev/null)
echo feed=$(systemctl is-active fr24feed)
S1=$(awk '/^cpu /{print $2+$3+$4+$5+$6+$7+$8" "$5+$6}' /proc/stat); sleep 1; S2=$(awk '/^cpu /{print $2+$3+$4+$5+$6+$7+$8" "$5+$6}' /proc/stat)
echo cpu=$(echo "$S1 $S2" | awk '{t=$3-$1;i=$4-$2; if(t>0) printf "%.0f", (t-i)*100/t}')
echo load=$(cut -d' ' -f1-3 /proc/loadavg)
echo cores=$(nproc)
echo memtotal=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
echo swap=$(awk '/SwapTotal/{t=$2}/SwapFree/{f=$2}END{print int((t-f)/1024)}' /proc/meminfo)
echo clock=$(vcgencmd measure_clock arm | cut -d= -f2)
echo volt=$(vcgencmd measure_volts core | tr -dc '0-9.')
echo diskmb=$(df -BM --output=used,size / | tail -1 | tr -s ' ' | tr -d M)
echo model=$(tr -d '\0' < /proc/device-tree/model)
echo os=$(. /etc/os-release; echo "$PRETTY_NAME")
echo kernel=$(uname -r)
`;

const num = (v) => (v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

/**
 * get_throttled 的位元：0 欠壓、1 限頻、2 降頻、3 溫度軟限制（現在）；16–19 同樣四項「開機後曾經發生」
 * https://www.raspberrypi.com/documentation/computers/os.html#get_throttled
 */
function decodeThrottled(hex) {
  const v = typeof hex === "string" && /^0x[0-9a-f]+$/i.test(hex) ? parseInt(hex, 16) : null;
  if (v === null) return null;
  const bit = (n) => Boolean(v & (1 << n));
  return {
    raw: hex.toLowerCase(),
    now: { undervoltage: bit(0), capped: bit(1), throttled: bit(2), softTemp: bit(3) },
    since: { undervoltage: bit(16), capped: bit(17), throttled: bit(18), softTemp: bit(19) },
  };
}

/** SSH 輸出（key=value 一行一個）→ 健康資料 */
function parseHealth(text) {
  const kv = {};
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^([a-z]+)=(.*)$/.exec(line.trim());
    if (m) kv[m[1]] = m[2].trim();
  }
  return {
    uptimeS: num(kv.up),
    throttled: decodeThrottled(kv.thr),
    tempC: num(kv.temp),
    diskPct: num(kv.disk),
    readOnly: kv.mount ? kv.mount === "ro" : null,
    ioErrors: num(kv.ioerr),
    fsState: kv.fs || null,
    lifetimeWrites: kv.writes || null,
    memAvailMB: num(kv.mem),
    wifiDbm: num(kv.wifi),
    sd: kv.sd ? { name: kv.sd, date: kv.sddate || null } : null,
    feedActive: kv.feed ? kv.feed === "active" : null,
    cpuPct: num(kv.cpu),
    load: kv.load ? kv.load.split(/\s+/).map(Number).filter(Number.isFinite) : null,
    cores: num(kv.cores),
    memTotalMB: num(kv.memtotal),
    swapUsedMB: num(kv.swap),
    clockMHz: num(kv.clock) === null ? null : Math.round(Number(kv.clock) / 1e6),
    coreVolt: num(kv.volt),
    diskUsedMB: kv.diskmb ? num(kv.diskmb.split(/\s+/)[0]) : null,
    diskSizeMB: kv.diskmb ? num(kv.diskmb.split(/\s+/)[1]) : null,
    model: kv.model || null,
    os: kv.os || null,
    kernel: kv.kernel || null,
  };
}

// --- 告警（watchdog.ps1 每 5 分鐘讀 problems：active 就 Send-Alert，不 active 就 Clear-Alert；寄到 .env.local 的 ALERT_EMAIL_TO）---
const TEMP_HOT = 75; // Pi 3B 80°C 開始降頻；75 先通知
const TEMP_COOL = 70; // 寄過「太熱」之後要降到 70 以下才算恢復（避免在 75 上下跳來跳去一直寄）
const DISK_FULL = 90;
const MEM_LOW_MB = 80;
const SSH_DOWN_MS = 60 * 60_000;

/**
 * 算出每一種問題現在是不是成立。prevActive：上一次的結果（溫度用來做遲滯）。
 * radarReachable：雷達網頁讀不讀得到——讀不到時雷達離線信已經會寄，SSH 失敗就不再另外寄
 */
function problems(state, prevActive, radarReachable, now) {
  const h = state.health;
  const fresh = state.ok && h;
  const t = h && h.throttled;
  const out = [];
  const add = (key, active, cooldown, subject, body, recover) => out.push({ key, active: Boolean(active), cooldown, subject, body, recover });

  const temp = fresh ? h.tempC : null;
  const hot = temp !== null && (temp >= TEMP_HOT || (prevActive["pi-hot"] && temp >= TEMP_COOL) || Boolean(t && t.now.softTemp));
  add("pi-hot", hot, 720, `🌡️ 雷達樹莓派太熱（${temp}°C）`,
    `樹莓派現在 ${temp}°C（24 小時最高 ${state.maxTemp24h}°C）。Pi 3B 到 80°C 會自動降頻，解碼可能掉訊息。
可以加散熱片／小風扇、別放在密閉空間或太陽直曬的地方。
降到 ${TEMP_COOL}°C 以下會再寄一封恢復信。`,
    `✅ 雷達樹莓派溫度恢復（${temp}°C）`);

  const powerNow = Boolean(fresh && t && (t.now.undervoltage || t.now.throttled || t.now.capped));
  const powerSince = Boolean(fresh && t && t.since.undervoltage);
  add("pi-power", powerNow || powerSince, 1440,
    powerNow ? "⚡ 雷達樹莓派供電不足／降頻中" : "⚡ 雷達樹莓派開機後發生過電壓不足",
    `get_throttled ${t ? t.raw : "?"}。${powerNow ? "現在就在欠壓或降頻。" : "現在正常，但開機後曾經電壓不足（這個旗標要重開機才會清掉，沒重開就每 24 小時提醒一次）。"}
2026-11-23 那次整台斷線就是供電不足。檢查電源（5V 2.5A 以上）、USB 線，電視棒接在樹莓派上也會多吃電。`,
    "✅ 雷達樹莓派供電恢復正常");

  const sdBad = Boolean(fresh && (h.readOnly === true || (h.ioErrors || 0) > 0 || (h.fsState && h.fsState !== "clean")));
  add("pi-sd", sdBad, 1440, "💾 雷達樹莓派記憶卡有狀況",
    fresh ? `唯讀：${h.readOnly ? "是（系統把記憶卡改成唯讀了，通常是卡壞了）" : "否"}
核心訊息裡的讀寫錯誤：${h.ioErrors}
檔案系統狀態：${h.fsState}

記憶卡快壞時常常這樣。先備份設定，準備換一張新卡重刷 Pi24 映像。` : "",
    "✅ 雷達樹莓派記憶卡恢復正常");

  const diskFull = Boolean(fresh && (h.diskPct || 0) >= DISK_FULL);
  add("pi-disk", diskFull, 1440, `💾 雷達樹莓派空間快滿（${fresh ? h.diskPct : "?"}%）`,
    "根目錄用了 90% 以上，滿了 fr24feed／dump1090 會寫不進去。通常是 log 越長越大：SSH 進去看 du -sh /var/log/*。", "✅ 雷達樹莓派空間恢復");

  const memLow = Boolean(fresh && h.memAvailMB !== null && h.memAvailMB < MEM_LOW_MB);
  add("pi-mem", memLow, 720, `🧠 雷達樹莓派記憶體快用完（剩 ${fresh ? h.memAvailMB : "?"} MB）`,
    "可用記憶體不到 80 MB，可能有程式在漏記憶體。重開 fr24feed（sudo systemctl restart fr24feed）或整台重開。", "✅ 雷達樹莓派記憶體恢復");

  const sshDown = !state.ok && radarReachable !== false && now - (state.lastOkAt || state.checkedAt) > SSH_DOWN_MS;
  add("pi-ssh", sshDown, 1440, "🔑 讀不到雷達樹莓派的健康狀態",
    `雷達本身在線，但 SSH 一小時以上連不上（${state.error}），溫度、記憶卡這些就監視不到了。
可能是金鑰被清掉（11/23 斷電後 authorized_keys 變成 0 bytes 過）或 SSH 服務沒開。`,
    "✅ 又讀得到雷達樹莓派的健康狀態");
  return out;
}

const activeMap = (list) => Object.fromEntries((list || []).map((p) => [p.key, p.active]));

/** 一次讀取結果併進檔案：current＋24 小時溫度歷史（最高溫）＋最後一次讀成功的時間 */
function applyHealth(prev, result, now) {
  const history = (prev && Array.isArray(prev.history) ? prev.history : []).filter((p) => now - p.t < KEEP_MS);
  if (result.ok) {
    const h = result.health;
    history.push({
      t: now,
      c: h.tempC,
      cpu: h.cpuPct ?? null,
      mem: h.memTotalMB && h.memAvailMB !== null ? Math.round((1 - h.memAvailMB / h.memTotalMB) * 100) : null,
    });
  }
  return {
    checkedAt: now,
    ok: result.ok,
    error: result.ok ? null : result.error,
    lastOkAt: result.ok ? now : (prev && prev.lastOkAt) || null,
    // 讀不到時保留上一次的數字（後台顯示「最後一次」），但 ok=false
    health: result.ok ? result.health : (prev && prev.health) || null,
    maxTemp24h: history.some((p) => p.c != null) ? Math.max(...history.filter((p) => p.c != null).map((p) => p.c)) : null,
    history,
  };
}

/** applyHealth＋問題清單（server.js 每輪呼叫）。radarFile：讀雷達狀態，決定 SSH 失敗要不要另外通知 */
function nextState(prev, result, now, radarReachable) {
  const state = applyHealth(prev, result, now);
  return { ...state, problems: problems(state, activeMap(prev && prev.problems), radarReachable, now) };
}

const sshBin = () => {
  const win = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "OpenSSH", "ssh.exe");
  return process.platform === "win32" && fs.existsSync(win) ? win : "ssh";
};

/** SSH 跑一次。BatchMode：金鑰不行就直接失敗，不會卡在問密碼 */
function pollHealth({ host, user = "pi", keyPath }) {
  return new Promise((resolve) => {
    const child = execFile(
      sshBin(),
      ["-i", keyPath, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", `${user}@${host}`, "bash", "-s"],
      { timeout: 20_000, windowsHide: true },
      (err, stdout) => {
        if (err) return resolve({ ok: false, error: err.killed ? "逾時" : "SSH 連不上" });
        const health = parseHealth(stdout);
        if (health.uptimeS === null) return resolve({ ok: false, error: "回傳格式不對" });
        resolve({ ok: true, health });
      },
    );
    child.stdin.end(SCRIPT);
  });
}

/** 任意指令從 stdin 餵給遠端 bash（pi-journal 用）；失敗就丟例外 */
function sshRun({ host, user = "pi", keyPath, script }) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      sshBin(),
      ["-i", keyPath, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", `${user}@${host}`, "bash", "-s"],
      { timeout: 60_000, windowsHide: true, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => (err ? reject(err) : resolve(stdout)),
    );
    child.stdin.end(script);
  });
}

function readHealth(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const defaultKey = () => process.env.RADAR_SSH_KEY || path.join(os.homedir(), ".ssh", "pi24_radar");

/** server.js 呼叫：金鑰檔不存在就不跑（回 null） */
/** journalDir、cursorFile 有給就順便把樹莓派的系統 log 存一份到桌機（pi-journal.js） */
function startRadarHealthPoller({ host, file, radarFile, journalDir, cursorFile, keyPath = defaultKey(), log }) {
  if (!fs.existsSync(keyPath)) {
    if (log) log(`radar health: 沒有 SSH 金鑰（${path.basename(keyPath)}），不讀樹莓派狀態`);
    return null;
  }
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await pollHealth({ host, keyPath });
      const radar = radarFile ? readHealth(radarFile) : null;
      const reachable = radar && radar.status ? Boolean(radar.status.reachable) : null;
      fs.writeFileSync(file, JSON.stringify(nextState(readHealth(file), result, Date.now(), reachable)));
      if (result.ok && journalDir && cursorFile) {
        try {
          await pullJournal({ run: (script) => sshRun({ host, keyPath, script }), dir: journalDir, cursorFile });
        } catch (e) {
          if (log) log(`RADAR journal error: ${e && e.message ? e.message.split("\n")[0] : e}`);
        }
      }
    } catch (e) {
      if (log) log(`RADAR health error: ${e && e.message ? e.message : e}`);
    } finally {
      running = false;
    }
  };
  tick();
  return setInterval(tick, POLL_MS).unref();
}

module.exports = { SCRIPT, decodeThrottled, parseHealth, applyHealth, problems, nextState, readHealth, pollHealth, sshRun, startRadarHealthPoller };
