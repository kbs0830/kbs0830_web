// 首頁的最新文章（TODO「首頁顯示最新文章」，2026-11-09）：部落格原本只靠頁尾一個小連結。
// Server Component，零 JS。不編號、不進 NavBar——它是作品集的延伸，不是新的一區。
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";

export default function LatestPosts() {
  const posts = getAllPosts().slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="latest-posts" className="pb-20 md:pb-32">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal className="flex items-baseline justify-between gap-4 mb-8 border-t border-(--border) pt-12">
          <div>
            <Eyebrow className="mb-3">Blog</Eyebrow>
            <h2 id="latest-posts" className="text-2xl font-light text-(--text) font-serif">
              最新文章 · Latest Posts
            </h2>
          </div>
          <Link
            href="/blog"
            className="shrink-0 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide"
          >
            全部 {getAllPosts().length} 篇 →
          </Link>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08} distance={20} className="flex">
              <div className="flex-1 flex">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex-1 flex flex-col border border-(--border) rounded-sm p-5 bg-(--bg) hover:border-(--accent) transition-colors"
                >
                  <span className="text-xs text-(--muted) font-mono tracking-wide mb-2">{post.date}</span>
                  <span className="text-[15px] font-light text-(--text) leading-relaxed group-hover:text-(--accent) transition-colors mb-2">
                    {post.title}
                  </span>
                  <span className="text-xs text-(--muted) font-light leading-relaxed line-clamp-3">{post.description}</span>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
