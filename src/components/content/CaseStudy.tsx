import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import type { CaseStudy as CaseStudyData } from "@/lib/content/projects";

// 作品頁的案例段落（TODO B9，2026-11-25，使用者：「內容幫我寫專業（詳細一點）」）：
// 背景 → 我的角色 → 關鍵決定（做了什麼＋為什麼）→ 取捨與限制 → 成果。面試官最想看的是「為什麼這樣做」，
// 下面原本的條列（架構、功能、技術棧）變成技術細節。內容只寫原始碼或紀錄查得到的事實。Server Component。
export default function CaseStudy({ data }: { data: CaseStudyData }) {
  return (
    <div className="mt-12 space-y-10">
      <section>
        <SectionHeading as="h2" en="Problem">
          背景與問題
        </SectionHeading>
        <p className="text-[15px] sm:text-sm font-light text-(--text) leading-[1.9] sm:leading-relaxed">{data.problem}</p>
        {data.role && (
          <p className="mt-3 text-[13px] font-light text-(--muted) leading-relaxed">
            <span className="font-mono text-[11px] tracking-wide mr-2">我的角色</span>
            {data.role}
          </p>
        )}
      </section>

      <section>
        <SectionHeading as="h2" en="Key decisions">
          關鍵決定
        </SectionHeading>
        <ol className="space-y-4">
          {data.decisions.map((d, i) => (
            <li key={d.what} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
              <span className="font-mono text-xs text-(--accent) pt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <p className="text-[15px] sm:text-sm text-(--text) leading-relaxed">{d.what}</p>
                <p className="mt-1 text-[13px] font-light text-(--muted) leading-relaxed">{d.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {data.tradeoffs && data.tradeoffs.length > 0 && (
        <section>
          <SectionHeading as="h2" en="Trade-offs">
            取捨與限制
          </SectionHeading>
          <BulletList items={data.tradeoffs} />
        </section>
      )}

      <section>
        <SectionHeading as="h2" en="Results">
          成果
        </SectionHeading>
        <BulletList items={data.results} />
      </section>
    </div>
  );
}
