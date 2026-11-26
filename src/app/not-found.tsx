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
          這個頁面不存在，或已經被移動了。
          <br />
          This page doesn&apos;t exist, or has been moved.
        </>
      }
    >
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
