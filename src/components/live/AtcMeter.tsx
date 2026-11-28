"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// 直播畫面左側的「塔台無線電」音量條（2026-11-29，使用者：「綁我連塔台的聲音，在左邊加入聲音大小的那個東西」）。
// 音源是使用者自己的接收設備（SDR／對講機）→ 虛擬音效線 → 這台電腦的「音訊輸入」；這個元件只**量音量**：
//   - 不錄音、不上傳、不播放（AnalyserNode 沒有接到喇叭）；聲音本身由 OBS 另外加「音訊輸入擷取」送上 YouTube
//   - 只有網址有 `?audio=1`（或 `?audio=裝置名稱的一部分`，例如 `?audio=CABLE`）才會啟動，一般訪客不會被要求麥克風權限
// 2026-11-29：塔台音源還在架設，先拿「無版權輕音樂」測量音量條 → 預設顯示「音樂 · MUSIC」＋「塔台無線電建置中」；
// 網址再加 `&radio=1` 才改成「塔台 · ATC」（塔台音源接好之後）。
// 隱私：**一定要指定裝置名稱**（`?audio=CABLE`），不再退回「預設麥克風」——預設可能是耳機麥克風，不能不小心打開。
//   拿裝置名稱需要先有一次權限（瀏覽器規定），這個暫時串流會立刻關掉；建議把 Windows 的預設錄音裝置也設成虛擬音效線，連這一下都碰不到耳機。
// 音量：RMS 換成 dBFS，-60 dB～0 dB 對應 24 格；峰值保持 1.2 秒再慢慢掉；超過約 -45 dB 持續 0.3 秒算「接收中」（靜噪打開）

const SEGMENTS = 24;
const FLOOR_DB = -60;
const RX_DB = -45;

type Status = "connecting" | "idle" | "rx" | "error" | "nodevice" | "needname";

export default function AtcMeter() {
  // 網址參數：server 端是 null（不畫），瀏覽器端讀 location.search（useSyncExternalStore 不會有 hydration 不一致）
  const request = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search).get("audio"),
    () => null,
  );
  const radio = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search).get("radio") === "1",
    () => false,
  );
  const debug = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search).get("debug") === "1",
    () => false,
  );
  const [status, setStatus] = useState<Status>("connecting");
  const [diag, setDiag] = useState(""); // 診斷用（網址加 &debug=1 才顯示）：錯誤類型、瀏覽器看到的音訊輸入裝置名稱
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dbRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (request === null) return;
    let stopped = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    (async () => {
      try {
        const raw = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
        // 一定要指定裝置名稱（?audio=CABLE）；空的或 "1" 一律不開，避免誤開預設（可能是耳機）麥克風
        const want = request.trim().toLowerCase();
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
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: { ...raw, deviceId: { exact: dev.deviceId } } });
        if (stopped) return;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser); // 只接分析器，不接 destination（不出聲）
        const buf = new Float32Array(analyser.fftSize);
        let level = 0; // 0..1，帶一點平滑
        let peak = 0;
        let peakAt = 0;
        let loudSince = 0;
        let shown: Status = "idle";
        setStatus("idle");

        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const db = Math.max(FLOOR_DB, 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-6));
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
            const on = i < lit;
            el.style.opacity = on ? "1" : i === peakSeg && peak > 0.05 ? "0.9" : "0.14";
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
      } catch (e) {
        if (!stopped) {
          setDiag(`${e instanceof Error ? e.name : "錯誤"}：${e instanceof Error ? e.message : String(e)}${navigator.mediaDevices ? "" : "（這個環境沒有 mediaDevices）"}`);
          setStatus("error");
        }
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [request]);

  // 沒有 ?audio= 時照樣畫出（灰色待機），讓版面一直在；只有帶了裝置名稱才會去讀音訊輸入
  const active = request !== null;
  const shownStatus: Status = active ? status : "idle";

  const label = {
    connecting: "連線中 · Connecting",
    idle: radio ? "待機 · Standby" : "靜音 · Silent",
    rx: radio ? "接收中 · RX" : "播放中 · Playing",
    error: "沒有音訊輸入 · No input",
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
