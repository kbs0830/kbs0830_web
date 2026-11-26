// 自家雷達樹莓派的健康狀態（2026-11-26，使用者換完電源：「幫我看派的記憶卡或是溫度什麼的有沒有問題，並寫進網站後台監視」）。
//
// scripts/server.js 每 5 分鐘用 SSH（唯讀金鑰 ~/.ssh/pi24_radar，帳號 pi）跑一小段指令，讀：
//   溫度、供電／降頻旗標（vcgencmd get_throttled）、開機多久、根目錄用量、是不是變成唯讀、
//   核心訊息裡的記憶卡／檔案系統錯誤數、檔案系統狀態（tune2fs）、累計寫入量、可用記憶體、Wi-Fi 訊號、fr24feed 有沒有在跑
// 寫進 data/radar-health.json，只給站長後台（/admin/ops）看，不經公開 API。
// ⚠️ 不存 IP、金鑰、位置。RADAR_HOST 沒設、金鑰檔不存在就整個不跑。
// 2026-11-23 那次斷線是供電不足（get_throttled 0x50005），這裡會把「現在欠壓」跟「開機後曾經欠壓」分開記。

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");

const POLL_MS = 5 * 60_000;
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
  };
}

/** 一次讀取結果併進檔案：current＋24 小時溫度歷史（最高溫）＋最後一次讀成功的時間 */
function applyHealth(prev, result, now) {
  const history = (prev && Array.isArray(prev.history) ? prev.history : []).filter((p) => now - p.t < KEEP_MS);
  if (result.ok && result.health.tempC !== null) history.push({ t: now, c: result.health.tempC });
  return {
    checkedAt: now,
    ok: result.ok,
    error: result.ok ? null : result.error,
    lastOkAt: result.ok ? now : (prev && prev.lastOkAt) || null,
    // 讀不到時保留上一次的數字（後台顯示「最後一次」），但 ok=false
    health: result.ok ? result.health : (prev && prev.health) || null,
    maxTemp24h: history.length ? Math.max(...history.map((p) => p.c)) : null,
    history,
  };
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

function readHealth(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const defaultKey = () => process.env.RADAR_SSH_KEY || path.join(os.homedir(), ".ssh", "pi24_radar");

/** server.js 呼叫：金鑰檔不存在就不跑（回 null） */
function startRadarHealthPoller({ host, file, keyPath = defaultKey(), log }) {
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
      fs.writeFileSync(file, JSON.stringify(applyHealth(readHealth(file), result, Date.now())));
    } catch (e) {
      if (log) log(`RADAR health error: ${e && e.message ? e.message : e}`);
    } finally {
      running = false;
    }
  };
  tick();
  return setInterval(tick, POLL_MS).unref();
}

module.exports = { SCRIPT, decodeThrottled, parseHealth, applyHealth, readHealth, pollHealth, startRadarHealthPoller };
