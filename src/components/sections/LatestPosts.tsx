// 首頁的最新文章（TODO「首頁顯示最新文章」，2026-11-09）：部落格原本只靠頁尾一個小連結。
// Server Component，零 JS。不編號、不進 NavBar——它是作品集的延伸，不是新的一區。
import Link from "next/link";
import { ViewTransition } from "react";
import { getAllPosts } from "@/lib/content/blog";
import Reveal from "@/components/ui/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import { HOME_WIDTH } from "@/components/layout/home-width";

export default function LatestPosts() {
  const posts = getAllPosts().slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="latest-posts" className="pb-20 md:pb-32">
      <div className={`${HOME_WIDTH} mx-auto px-6`}>
        <Reveal className="flex items-baseline justify-between gap-4 mb-8 border-t border-(--border) pt-12">
          <div>
            <Eyebrow className="mb-3">Blog</Eyebrow>
            <h2 id="latest-posts" className="text-xl sm:text-2xl 3xl:text-3xl font-light text-(--text) font-serif whitespace-nowrap">
              最新記事 · Latest Notes
            </h2>
          </div>
          <Link
            href="/blog"
            className="shrink-0 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide"
          >
            全部 {getAllPosts().length} 篇 →
          </Link>
        </Reveal>

        {/* 手機（TODO Q10，2026-11-28）：原本 2 篇直排、第 3 篇藏起來 → 3 篇橫向滑動（一次露 1.15 張，看得出右邊還有）＋下面圓點，
            高度只剩一張卡、3 篇都看得到。圓點是瀏覽器產生的（CSS 原生輪播 ::scroll-marker，globals.css .post-carousel），零 JS；
            不支援的瀏覽器就是普通的橫向捲動。sm 以上照舊格線 */}
        <div className="post-carousel grid md:grid-cols-3 gap-5">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08} distance={20} className="flex">
              <div className="flex-1 flex" data-marker={`第 ${i + 1} 篇：${post.title}`}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex-1 flex flex-col border border-(--border) rounded-sm p-5 bg-(--bg) hover:border-(--accent) transition-colors"
                >
                  <span className="text-xs text-(--muted) font-mono tracking-wide mb-2">{post.date}</span>
                  {/* 跟文章頁的 <h1> 同名，點進去標題會 morph 過去（TODO O3） */}
                  <ViewTransition name={`post-title-${post.slug}`} share="morph" default="none">
                    <span className="text-[15px] 3xl:text-[17px] font-light text-(--text) leading-relaxed group-hover:text-(--accent) transition-colors mb-2">
                      {post.title}
                    </span>
                  </ViewTransition>
                  <span className="text-xs 3xl:text-[13px] text-(--muted) font-light leading-relaxed line-clamp-3">{post.description}</span>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
