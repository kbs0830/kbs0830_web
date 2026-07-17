import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-(--bg) px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← 返回首頁
        </Link>

        <p
          className="text-xs tracking-[0.35em] text-(--muted) uppercase mt-10 mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          404
        </p>
        <h1
          className="text-3xl sm:text-4xl font-light text-(--text) mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          迷子 &nbsp;·&nbsp; Page Not Found
        </h1>
        <p className="text-sm font-light text-(--muted) mb-10 leading-relaxed">
          這個頁面不存在，或已經被移動了。
          <br />
          This page doesn&apos;t exist, or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-light tracking-wide text-(--accent) hover:opacity-70 transition-opacity"
        >
          返回首頁 · Back Home →
        </Link>
      </div>
    </div>
  );
}
