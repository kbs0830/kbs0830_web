import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[--bg]">
      <p
        className="text-xs tracking-[0.35em] text-[--muted] uppercase mb-6"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        404
      </p>
      <h1
        className="text-3xl sm:text-4xl font-light text-[--text] mb-4 text-center"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        迷子 &nbsp;·&nbsp; Page Not Found
      </h1>
      <p className="text-sm font-light text-[--muted] mb-10 text-center max-w-sm leading-relaxed">
        這個頁面不存在，或已經被移動了。
        <br />
        This page doesn&apos;t exist, or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-light tracking-wide bg-[--accent] text-white rounded-sm hover:opacity-90 transition-opacity"
      >
        返回首頁 · Back Home
      </Link>
    </div>
  );
}
