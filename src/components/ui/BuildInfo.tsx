// 頁尾的版本＋最後更新時間。值是 build 時寫死的（next.config.ts 的 env），Server Component、零 JS。
// 版本＝commit 短 hash，點了看 GitHub 上那次改了什麼；時間一律用台灣時間顯示到分鐘
const sha = process.env.BUILD_COMMIT_SHA || "";
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

const linkClass = "hover:text-(--accent) transition-colors";

export default function BuildInfo({ className = "" }: { className?: string }) {
  if (!sha) return <span className={className}>dev</span>;
  return (
    <span className={className}>
      <a
        href={`https://github.com/kbs0830/kbs0830_web/commit/${sha}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        title="這個版本改了什麼 · View this commit on GitHub"
      >
        v.{sha.slice(0, 7)}
      </a>
      {time && (
        <>
          {" · 最後更新 "}
          <time dateTime={time}>{formatTaipei(time)}</time>
        </>
      )}
    </span>
  );
}
