import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getDb, logEvent } from "@/lib/admin/db";

// 站長後台 · 部落格專區（2026-11-28）：content/drafts/*.mdx 是 Claude 寫好、還沒上線的草稿（不進 git），
// 使用者在 /admin/blog 看全文、核准或退回；核准後 Claude 用 `node scripts/admin-db.js blog` 讀到，才搬進 content/blog/ 發布。
// 草稿目錄可用 BLOG_DRAFTS_DIR 換（單元測試用）。

export type ReviewStatus = "pending" | "approved" | "rejected";
export const REVIEW_STATUSES: readonly ReviewStatus[] = ["pending", "approved", "rejected"];

export type Draft = {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  tags: string[];
  /** 去掉 frontmatter 的內文 */
  body: string;
  /** 草稿檔最後修改時間（毫秒） */
  modifiedAt: number;
  status: ReviewStatus;
  note: string;
  reviewedAt: number | null;
};

const draftsDir = () => process.env.BLOG_DRAFTS_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "content", "drafts"); // 執行期讀的草稿，不是程式碼依賴（不加會跳 NFT over-trace 警告）
export const isDraftSlug = (s: string) => /^[a-z0-9][a-z0-9-]{0,100}$/.test(s);

type ReviewRow = { slug: string; status: ReviewStatus; note: string; updated_at: number };

export function listDrafts(): Draft[] {
  const dir = draftsDir();
  if (!fs.existsSync(dir)) return [];
  const reviews = new Map((getDb().prepare("SELECT slug, status, note, updated_at FROM blog_review").all() as ReviewRow[]).map((r) => [r.slug, r]));
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && isDraftSlug(f.slice(0, -4)))
    .map((f): Draft => {
      const slug = f.slice(0, -4);
      const file = path.join(dir, f);
      const { data, content } = matter(fs.readFileSync(file, "utf8"));
      const r = reviews.get(slug);
      return {
        slug,
        title: String(data.title ?? slug),
        titleEn: String(data.titleEn ?? ""),
        description: String(data.description ?? ""),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        body: content.trim(),
        modifiedAt: fs.statSync(file).mtimeMs,
        status: r?.status ?? "pending",
        note: r?.note ?? "",
        reviewedAt: r?.updated_at ?? null,
      };
    })
    .toSorted((a, b) => b.modifiedAt - a.modifiedAt);
}

/** 存審批結果；草稿檔不存在回 null（不接受任意 slug） */
export function reviewDraft(slug: string, status: ReviewStatus, note: string, now = Date.now()): { status: ReviewStatus; note: string; updatedAt: number } | null {
  if (!isDraftSlug(slug) || !fs.existsSync(path.join(draftsDir(), `${slug}.mdx`))) return null;
  getDb()
    .prepare("INSERT INTO blog_review (slug, status, note, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = excluded.updated_at")
    .run(slug, status, note.slice(0, 1000), now);
  logEvent("blog.review", `${slug} → ${status}${note.trim() ? `（${note.trim().slice(0, 60)}）` : ""}`, now);
  return { status, note: note.slice(0, 1000), updatedAt: now };
}
