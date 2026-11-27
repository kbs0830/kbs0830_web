import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import LostPlane from "@/components/fun/LostPlane";
import FlowLines from "@/components/fun/FlowLines";

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title={<>迷子 &nbsp;·&nbsp; Page Not Found</>}
      intro={
        <>
          {/* 中英各自 balance，不會剩「飛過。」一行 */}
          <span className="block text-balance break-keep">這個航班不存在——可能換了登機門，或從來沒有起飛過。</span>
          <span className="block text-balance">This flight doesn&apos;t exist — the gate may have changed, or it never took off.</span>
        </>
      }
    >
      {/* 給 WebVitals 認的標記：404 頁的指標記成 /404，不用訪客打錯的原始網址（TODO R2） */}
      <span hidden data-not-found />
      <FlowLines />
      <LostPlane />
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-light tracking-wide text-(--accent) hover:opacity-70 transition-opacity"
      >
        返回首頁 · Back Home →
      </Link>
    </PageShell>
  );
}
