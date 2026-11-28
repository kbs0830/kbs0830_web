"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// 直播畫面左側的音量條（2026-11-29，使用者：「綁我連塔台的聲音，在左邊加入聲音大小的那個東西」）。
// 這個元件只**量音量**：不錄音、不上傳、不播放。聲音本身由 OBS 送上 YouTube。兩種量法（網址參數決定）：
//
//   A. OBS WebSocket（推薦，OBS 瀏覽器來源實測 getUserMedia 會 NotAllowedError，所以主要走這條）
//      `?obs=1&obsin=音樂`：連 ws://localhost:4455（OBS 內建 WebSocket 伺服器），訂閱 InputVolumeMeters，
//      讀 OBS 混音器裡名稱含「音樂」的來源的音量。不需要麥克風權限，也不需要 VB-Cable。
//      有設密碼：`&obspw=密碼`（只在 OBS 裡的網址用，不要貼到別的地方）；port 不是 4455：`?obs=4456`
//   B. 麥克風（一般瀏覽器可用）：`?audio=CABLE`（裝置名稱的一部分）。**一定要指定名稱**，不退回預設麥克風（可能是耳機）
//
// 兩個參數都沒有時照樣畫出（灰色待機），一般訪客不會被要求任何權限。
// 2026-11-29：塔台音源還在架設，先量「無版權輕音樂」→ 預設顯示「音樂 · MUSIC」＋「塔台無線電建置中」，網址加 `&radio=1` 才改成「塔台 · ATC」。
// 音量：dBFS，-60～0 dB 對應 24 格；峰值保持 1.2 秒再慢慢掉；超過約 -45 dB 持續 0.3 秒算「接收中」。`&debug=1` 顯示診斷文字。

const SEGMENTS = 24;
const FLOOR_DB = -60;
const RX_DB = -45;

type Status = "connecting" | "idle" | "rx" | "error" | "nodevice" | "needname";

async function sha256b64(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
/** obs-websocket 5.x 的驗證：secret = b64(sha256(密碼+salt))；答案 = b64(sha256(secret+challenge)) */
async function obsAuth(password: string, salt: string, challenge: string) {
  return sha256b64((await sha256b64(password + salt)) + challenge);
}

export default function AtcMeter() {
  // 網址參數：server 端是 ""（不畫特別的東西），瀏覽器端讀 location.search（useSyncExternalStore 不會有 hydration 不一致）
  const search = useSyncExternalStore(
    () => () => {},
    () => location.search,
    () => "",
  );
  const q = new URLSearchParams(search);
  const audio = q.get("audio");
  const obs = q.get("obs");
  const obsIn = (q.get("obsin") ?? "").trim();
  const obsPw = q.get("obspw") ?? "";
  const radio = q.get("radio") === "1";
  const debug = q.get("debug") === "1";
  const mode: "obs" | "mic" | null = obs !== null ? "obs" : audio !== null ? "mic" : null;

  const [status, setStatus] = useState<Status>("connecting");
  const [diag, setDiag] = useState("");
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dbRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (mode === null) return;
    let stopped = false;
    let raf = 0;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let ws: WebSocket | null = null;

    // 連不上、斷掉、被暫停時 10 秒後自己重來（OBS 重開、裝置晚出現、頁面自動重新載入之後都會恢復）
    const again = () => {
      if (stopped || retry) return;
      retry = setTimeout(() => {
        retry = null;
        void (mode === "obs" ? runObs() : runMic());
      }, 10_000);
    };
    const teardown = () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      ctx?.close().catch(() => {});
      ctx = null;
      if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
      }
    };

    /** 畫音量條：getDb 每個畫格回傳目前的 dBFS（-60～0） */
    const startLoop = (getDb: () => number, onFrame?: (now: number) => void) => {
      let level = 0; // 0..1，帶一點平滑
      let peak = 0;
      let peakAt = 0;
      let loudSince = 0;
      let shown: Status = "idle";
      setStatus("idle");
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        onFrame?.(now);
        const db = Math.max(FLOOR_DB, getDb());
        const target = (db - FLOOR_DB) / -FLOOR_DB;
        level = target > level ? target : level + (target - level) * 0.18; // 上升快、下降慢
        if (level >= peak) {
          peak = level;
          peakAt = now;
        } else if (now - peakAt > 1200) {
          peak = Math.max(level, peak - 0.012);
        }
        const lit = Math.round(level * SEGMENTS);
        const peakSeg = Math.min(SEGMENTS - 1, Math.round(peak * SEGMENTS));
        for (let i = 0; i < SEGMENTS; i++) {
          const el = segRefs.current[i];
          if (!el) continue;
          el.style.opacity = i < lit ? "1" : i === peakSeg && peak > 0.05 ? "0.9" : "0.14";
          el.style.background = i >= SEGMENTS - 3 ? "#e8f0f8" : "#6fa0d8";
        }
        if (dbRef.current) dbRef.current.textContent = db <= FLOOR_DB + 0.5 ? "-∞" : `${Math.round(db)}`;
        // 接收中：超過門檻 0.3 秒；回到安靜 1.5 秒才熄（對講的語句之間會有空檔）
        if (db > RX_DB) loudSince = loudSince || now;
        else if (now - peakAt > 1500) loudSince = 0;
        const next: Status = loudSince && now - loudSince > 300 ? "rx" : "idle";
        if (next !== shown) {
          shown = next;
          setStatus(next);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    // ── A. OBS WebSocket
    const runObs = async () => {
      teardown();
      const port = /^\d{2,5}$/.test(obs ?? "") ? obs : "4455";
      let lastDb = FLOOR_DB;
      let lastAt = 0;
      const seen = new Set<string>();
      let matched: Set<string> | null = null;
      try {
        ws = new WebSocket(`ws://localhost:${port}`);
      } catch (e) {
        setDiag(`WebSocket 建立失敗：${e instanceof Error ? e.message : String(e)}`);
        setStatus("error");
        again();
        return;
      }
      const sock = ws;
      setDiag(`連線 OBS WebSocket（localhost:${port}）…`);
      sock.onmessage = async (ev) => {
        let m: { op: number; d?: Record<string, unknown> };
        try {
          m = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (m.op === 0) {
          // Hello → Identify（只訂閱 InputVolumeMeters：1 << 16）
          const d: Record<string, unknown> = { rpcVersion: 1, eventSubscriptions: 1 << 16 };
          const au = m.d?.authentication as { salt: string; challenge: string } | undefined;
          if (au) {
            if (!obsPw) {
              setDiag("OBS 設了 WebSocket 密碼：網址加 &obspw=你的密碼（或到 OBS 關掉驗證）");
              setStatus("error");
              return;
            }
            d.authentication = await obsAuth(obsPw, au.salt, au.challenge);
          }
          sock.send(JSON.stringify({ op: 1, d }));
        } else if (m.op === 2) {
          setDiag(`OBS 已連線${obsIn ? `，量的來源：名稱含「${obsIn}」` : "，量所有來源的最大值"}`);
          startLoop(() => (performance.now() - lastAt < 1500 ? lastDb : FLOOR_DB));
        } else if (m.op === 5 && m.d?.eventType === "InputVolumeMeters") {
          const inputs = ((m.d.eventData as { inputs?: { inputName: string; inputLevelsMul: number[][] }[] })?.inputs ?? []);
          let best = 0;
          const nowMatched = new Set<string>();
          for (const inp of inputs) {
            seen.add(inp.inputName);
            if (obsIn && !inp.inputName.toLowerCase().includes(obsIn.toLowerCase())) continue;
            nowMatched.add(inp.inputName);
            for (const ch of inp.inputLevelsMul) best = Math.max(best, ch[0] ?? 0); // [magnitude, peak, inputPeak]
          }
          lastDb = best > 0 ? 20 * Math.log10(best) : FLOOR_DB;
          lastAt = performance.now();
          if (!matched || nowMatched.size !== matched.size) {
            matched = nowMatched;
            setDiag(
              nowMatched.size
                ? `OBS 已連線；量的來源：${[...nowMatched].join("、")}`
                : `OBS 已連線，但找不到名稱含「${obsIn}」的來源。OBS 回報的來源：${[...seen].join("、") || "（沒有）"}`,
            );
          }
        }
      };
      sock.onclose = () => {
        if (stopped) return;
        cancelAnimationFrame(raf);
        setStatus("error");
        setDiag(`連不上 OBS WebSocket（localhost:${port}）：OBS → 工具 → WebSocket 伺服器設定 → 勾「啟用」，10 秒後自動重試`);
        again();
      };
    };

    // ── B. 麥克風
    const runMic = async () => {
      teardown();
      try {
        const raw = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
        // 一定要指定裝置名稱（?audio=CABLE）；空的或 "1" 一律不開，避免誤開預設（可能是耳機）麥克風
        const want = (audio ?? "").trim().toLowerCase();
        if (!want || want === "1") {
          setStatus("needname");
          return;
        }
        // 拿到權限後才讀得到裝置名稱：先開一下預設裝置（立刻關掉），再換成指定的那個
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach((t) => t.stop());
        const inputs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput");
        const dev = inputs.find((d) => d.label.toLowerCase().includes(want));
        if (!dev) {
          setDiag(`看到 ${inputs.length} 個輸入裝置：${inputs.map((d) => d.label || "(無名稱)").join("；")}`);
          setStatus("nodevice");
          again();
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: { ...raw, deviceId: { exact: dev.deviceId } } });
        if (stopped) return;
        ctx = new AudioContext();
        // 沒有使用者操作時，瀏覽器可能把 AudioContext 先暫停（量到的永遠是 0）：明確叫它開始，之後每秒檢查
        await ctx.resume().catch(() => {});
        const track = stream.getAudioTracks()[0];
        track.onended = () => {
          setStatus("error");
          setDiag("音訊輸入中斷（裝置被拔掉或被別的程式拿走），10 秒後重試");
          again();
        };
        setDiag(`輸入：${track.label}　狀態：${ctx.state}`);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser); // 只接分析器，不接 destination（不出聲）
        const buf = new Float32Array(analyser.fftSize);
        let lastResume = 0;
        startLoop(
          () => {
            analyser.getFloatTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
            return 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-6);
          },
          (now) => {
            if (ctx && ctx.state === "suspended" && now - lastResume > 1000) {
              lastResume = now;
              void ctx.resume().catch(() => {});
            }
          },
        );
      } catch (e) {
        if (!stopped) {
          setDiag(`${e instanceof Error ? e.name : "錯誤"}：${e instanceof Error ? e.message : String(e)}${navigator.mediaDevices ? "" : "（這個環境沒有 mediaDevices）"}`);
          setStatus("error");
          again();
        }
      }
    };

    void (mode === "obs" ? runObs() : runMic());

    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      teardown();
    };
  }, [mode, audio, obs, obsIn, obsPw]);

  const shownStatus: Status = mode === null ? "idle" : status;

  const label = {
    connecting: "連線中 · Connecting",
    idle: radio ? "待機 · Standby" : "靜音 · Silent",
    rx: radio ? "接收中 · RX" : "播放中 · Playing",
    error: mode === "obs" ? "連不上 OBS · No OBS" : "沒有音訊輸入 · No input",
    nodevice: "找不到指定的裝置 · Device not found",
    needname: "請指定裝置名稱 · Name the device",
  }[shownStatus];

  return (
    <div className="absolute left-[2.4em] flex flex-col items-start" style={{ top: "13.5em", bottom: "9em" }} aria-label="塔台無線電音量">
      <p className="font-mono tracking-[0.18em]" style={{ color: "#8aa0b5", fontSize: "0.8em" }}>
        {radio ? "塔台 · ATC" : "音樂 · MUSIC"}
      </p>
      {!radio && (
        <p className="mt-[0.2em] font-light" style={{ color: "#8aa0b5", fontSize: "0.75em" }}>
          塔台無線電建置中
          <br />
          ATC radio under construction
        </p>
      )}
      <div className="mt-[0.8em] flex min-h-0 flex-1 items-stretch gap-[0.7em]">
        <div className="flex w-[1.1em] flex-col-reverse gap-[0.18em]">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <div key={i} ref={(el) => void (segRefs.current[i] = el)} className="min-h-0 flex-1 rounded-[1px]" style={{ background: "#6fa0d8", opacity: 0.14 }} />
          ))}
        </div>
        <div className="flex flex-col justify-between font-mono" style={{ color: "#8aa0b5", fontSize: "0.7em" }}>
          <span>0 dB</span>
          <span>-20</span>
          <span>-40</span>
          <span>-60</span>
        </div>
      </div>
      <p className="mt-[0.8em] font-mono" style={{ color: shownStatus === "rx" ? "#e8f0f8" : "#8aa0b5", fontSize: "0.85em" }}>
        <span
          className="mr-[0.5em] inline-block size-[0.6em] rounded-full align-middle"
          style={{ background: shownStatus === "rx" ? "#6fa0d8" : "rgba(138,160,181,0.4)" }}
        />
        {label}
      </p>
      <p className="font-mono" style={{ color: "#8aa0b5", fontSize: "0.75em" }}>
        <span ref={dbRef}>-∞</span> dBFS
      </p>
      {debug && diag && (
        <p className="mt-[0.5em] max-w-[22em] font-mono leading-snug" style={{ color: "#8aa0b5", fontSize: "0.7em" }}>
          {diag}
        </p>
      )}
    </div>
  );
}
