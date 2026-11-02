// SEO 結構化資料（schema.org），layout 的 Person、作品頁的麵包屑、文章頁的 BlogPosting 共用
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
