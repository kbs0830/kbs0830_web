// 頁尾的「最後更新」時間：build 時 HEAD 的 commit 時間（next.config.ts 的 env 寫死），台灣時間到分鐘。
// Server Component、零 JS。2026-11-05 依使用者要求先拿掉版本號（commit hash），只留時間；
// 要加回來：next.config.ts 的 env 還有 BUILD_COMMIT_SHA
const time = process.env.BUILD_COMMIT_TIME || "";

function formatTaipei(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export default function BuildInfo({ className = "" }: { className?: string }) {
  if (!time) return null;
  return (
    <span className={className}>
      最後更新 <time dateTime={time}>{formatTaipei(time)}</time>
    </span>
  );
}
