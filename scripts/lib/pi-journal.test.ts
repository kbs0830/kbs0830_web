import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { journalScript, parseJournal, pullJournal, redact } from "./pi-journal.js";

// 2026-11-28 從樹莓派實際讀到的格式（-o short-iso，樹莓派時區是 UTC）
const SAMPLE = `2026-11-27T19:59:28+0000 pi24-bookworm fr24feed[674]: [reader][w]Global timeout exceeded, 8583 msgs, 0 resyncs, reconnecting
2026-11-27T19:59:29+0000 pi24-bookworm fr24feed[674]: [feed][n]ping 21
2026-11-27T19:59:29+0000 pi24-bookworm fr24feed[674]: [feed][n]syncing stream result: 1
2026-11-27T19:59:30+0000 pi24-bookworm sshd[53659]: Accepted publickey for pi from 10.0.0.2 port 63875 ssh2: ED25519 SHA256:abc
2026-11-27T19:59:30+0000 pi24-bookworm systemd-logind[400]: New session 12 of user pi.
2026-11-27T19:59:30+0000 pi24-bookworm systemd[1]: Started session-12.scope - Session 12 of User pi.
2026-11-27T19:59:30+0000 pi24-bookworm systemd[53662]: Reached target basic.target - Basic System.
2026-11-27T19:59:31+0000 pi24-bookworm systemd[1]: Finished user-runtime-dir@1000.service - User Runtime Directory /run/user/1000.
2026-11-27T19:59:31+0000 pi24-bookworm sshd[53659]: pam_env(sshd:session): deprecated reading of user environment enabled
2026-11-27T19:59:31+0000 pi24-bookworm sudo[53700]:       pi : PWD=/home/pi ; USER=root ; COMMAND=/usr/bin/journalctl
2026-11-28T00:00:23+0000 pi24-bookworm systemd[1]: Failed to start logrotate.service - Rotate log files.
2026-11-28T00:00:24+0000 pi24-bookworm kernel: FIQ FSM acceleration enabled for :
                                      Non-periodic Split Transactions
2026-11-28T00:00:25+0000 pi24-bookworm sshd[99]: Failed password for invalid user admin from 10.0.0.9 port 1 ssh2
2026-11-28T00:00:26+0000 pi24-bookworm fr24feed[674]: [main][i]fr24key=0123456789ABCDEF loaded
-- cursor: s=abc123;i=4f2;b=c1028;m=1a;t=5f;x=99
`;

describe("parseJournal", () => {
  const r = parseJournal(SAMPLE);
  const lines = r.entries.map((e) => e.line);

  it("留下重要的、濾掉自己 SSH 登入跟 fr24 心跳", () => {
    expect(lines.some((l) => l.includes("Global timeout exceeded"))).toBe(true);
    expect(lines.some((l) => l.includes("Failed to start logrotate"))).toBe(true);
    expect(lines.some((l) => l.includes("Failed password"))).toBe(true); // 別人試密碼要留
    expect(lines.some((l) => /ping \d|syncing stream|Accepted publickey|New session|session-12\.scope|basic\.target|sudo/.test(l))).toBe(false);
    expect(r.dropped).toBe(9);
  });
  it("時間換成台灣時間，日期跨過午夜", () => {
    expect(lines[0].startsWith("2026-11-28T03:59:28+08:00 fr24feed[674]:")).toBe(true);
    expect(r.entries.find((e) => e.line.includes("logrotate"))!.line.startsWith("2026-11-28T08:00:23+08:00")).toBe(true);
  });
  it("多行訊息接在上一則後面", () => {
    expect(lines.find((l) => l.includes("FIQ FSM"))).toContain("\n");
  });
  it("金鑰遮掉、cursor 讀得到", () => {
    expect(lines.join("\n")).not.toContain("0123456789ABCDEF");
    expect(lines.at(-1)).toContain("fr24key=<redacted>");
    expect(r.cursor).toBe("s=abc123;i=4f2;b=c1028;m=1a;t=5f;x=99");
  });
});

describe("redact / journalScript", () => {
  it("各種 key 寫法", () => {
    expect(redact('sharing_key: "abc123" ok')).toBe('sharing_key: <redacted> ok');
    expect(redact("key=xyz&a=1")).toBe("key=<redacted>&a=1");
    expect(redact("no secrets here")).toBe("no secrets here");
  });
  it("cursor 格式不對就不拼進指令（防 shell 注入），改抓最近 48 小時", () => {
    expect(journalScript("s=1;i=2")).toContain("--after-cursor='s=1;i=2'");
    expect(journalScript("x'; rm -rf / #")).toContain("--since -48h");
    expect(journalScript(null)).toContain("--since -48h");
  });
});

describe("pullJournal", () => {
  let dir = "";
  afterEach(() => dir && fs.rmSync(dir, { recursive: true, force: true }));

  it("依台灣日期寫檔、存 cursor，下次帶 cursor 去拿", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-journal-"));
    const logDir = path.join(dir, "pi");
    const cursorFile = path.join(dir, "cursor.txt");
    const scripts: string[] = [];
    const run = async (s: string) => (scripts.push(s), SAMPLE);
    const r = await pullJournal({ run, dir: logDir, cursorFile, now: Date.UTC(2026, 10, 28) });
    expect(r.saved).toBe(5);
    expect(fs.readdirSync(logDir)).toEqual(["2026-11-28.log"]);
    expect(fs.readFileSync(cursorFile, "utf8")).toBe("s=abc123;i=4f2;b=c1028;m=1a;t=5f;x=99");
    await pullJournal({ run: async (s) => (scripts.push(s), "-- No entries --\n"), dir: logDir, cursorFile });
    expect(scripts[1]).toContain("--after-cursor='s=abc123;i=4f2;b=c1028;m=1a;t=5f;x=99'");
    expect(fs.readFileSync(path.join(logDir, "2026-11-28.log"), "utf8").trim().split(/\n(?=\d{4}-)/)).toHaveLength(5);
  });

  it("超過 90 天的檔案刪掉", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-journal-"));
    const logDir = path.join(dir, "pi");
    fs.mkdirSync(logDir);
    fs.writeFileSync(path.join(logDir, "2026-08-01.log"), "old\n");
    fs.writeFileSync(path.join(logDir, "2026-11-01.log"), "keep\n");
    await pullJournal({ run: async () => SAMPLE, dir: logDir, cursorFile: path.join(dir, "c.txt"), now: Date.UTC(2026, 10, 28) });
    expect(fs.readdirSync(logDir).sort()).toEqual(["2026-11-01.log", "2026-11-28.log"]);
  });
});
