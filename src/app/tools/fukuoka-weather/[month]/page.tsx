import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/ui/JsonLd";
import PageShell from "@/components/layout/PageShell";
import ToolNote from "@/components/tools/ToolNote";
import { withShare } from "@/lib/site/share-meta";
import { breadcrumbLd } from "@/lib/site/json-ld";
import { MONTHS, monthInfo, parseMonth, SOURCE, YEAR_RANGE } from "@/lib/travel/fukuoka-climate";

// 福岡每月穿搭（TODO V2，2026-11-27）：/tools/fukuoka-weather/3。12 頁靜態產生，第一句就是答案。
// 數字來自 lib/travel/climate-data.json（Open-Meteo 歷史天氣、近 10 年平均，scripts/gen-climate.mjs 產生）；穿著建議的規則在 lib/travel/fukuoka-climate.ts。
// 不是預報；現在去要看即時的 /tools/fukuoka-weather。月份不是 1～12 回 404。
export const ensureStatic = "navigation";

type Props = { params: Promise<{ month: string }> };

export function generateStaticParams() {
  return MONTHS.map((m) => ({ month: String(m) }));
}

const info = async (params: Props["params"]) => {
  const m = parseMonth((await params).month);
  return m === null ? null : monthInfo(m);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = await info(params);
  if (!i) return {};
  return withShare({
    title: `${i.title} · 福岡每月氣溫 — PINGWEI LI`,
    description: i.description,
    alternates: { canonical: `/tools/fukuoka-weather/${i.month}` },
  });
}

const link = "text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)";
const href = (m: number) => `/tools/fukuoka-weather/${m}` as Route;

export default async function FukuokaMonthPage({ params }: Props) {
  const i = await info(params);
  if (!i) notFound();
  const f = i.fukuoka;
  const k = i.kaohsiung;
  const prev = i.month === 1 ? 12 : i.month - 1;
  const next = i.month === 12 ? 1 : i.month + 1;

  return (
    <PageShell backHref="/tools/fukuoka-weather" backLabel="返回福岡天氣與穿搭" eyebrow={`Tools · Fukuoka ${i.month}月`} title={<>福岡 {i.month} 月穿搭</>}>
      <JsonLd
        data={breadcrumbLd([
          { name: "首頁", path: "" },
          { name: "小工具", path: "/tools" },
          { name: "福岡天氣與穿搭", path: "/tools/fukuoka-weather" },
          { name: `福岡 ${i.month} 月穿搭`, path: `/tools/fukuoka-weather/${i.month}` },
        ])}
      />
      <p className="text-lg font-light text-(--text) leading-relaxed mb-10">{i.answer}</p>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-10">
        {[
          ["平均最高溫", `${f.high}°C`, `高雄 ${k.high}°C`],
          ["平均最低溫", `${f.low}°C`, `高雄 ${k.low}°C`],
          ["下雨的天數", `${f.rainyDays} 天`, "日降水 ≥ 1 mm"],
          ["建議", i.outfit.tier, "一般建議"],
        ].map(([term, value, sub]) => (
          <div key={term} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
            <dt className="text-[11px] text-(--muted) font-mono tracking-wide">
              {term}
              <span className="block mt-0.5">{sub}</span>
            </dt>
            <dd className="text-lg font-light text-(--text) mb-1">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mb-10">
        <h2 className="mb-3 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">穿什麼 · What to wear</h2>
        <ul className="space-y-1.5 text-[15px] font-light text-(--text) leading-relaxed">
          {i.outfit.items.map((x) => (
            <li key={x}>・{x}</li>
          ))}
        </ul>
        {i.rainNote && <p className="mt-4 text-sm font-light text-(--muted) leading-relaxed">{i.rainNote}</p>}
      </section>

      <p className="text-sm font-light text-(--muted) leading-relaxed mb-10">
        這是近 10 年的月平均，不是預報。要出發了，看{" "}
        <Link href="/tools/fukuoka-weather" className={link}>
          福岡現在幾度、接下來幾天的預報與穿搭
        </Link>
        。從台灣怎麼去：{" "}
        <Link href="/tools/taiwan-fukuoka" className={link}>
          今天的直飛班機
        </Link>
        、<Link href={"/tools/airport-distance/tpe-fuk" as Route} className={link}>飛行距離與時間</Link>。
      </p>

      <nav aria-label="其他月份">
        <h2 className="mb-3 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">其他月份</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {MONTHS.map((m) => (
            <li key={m}>
              {m === i.month ? (
                <span aria-current="page" className="inline-block py-1.5 text-sm text-(--accent)">
                  {m} 月
                </span>
              ) : (
                <Link href={href(m)} className="inline-block py-1.5 text-sm font-light text-(--muted) hover:text-(--accent) transition-colors">
                  {m} 月
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-light text-(--muted)">
          <Link href={href(prev)} className={link}>← {prev} 月</Link>　<Link href={href(next)} className={link}>{next} 月 →</Link>
        </p>
      </nav>

      <ToolNote>
        <p>
          溫度與雨天數來自 {SOURCE}，取 {YEAR_RANGE[0]}～{YEAR_RANGE[1]} 十年每天的最高、最低溫與降水量，再算每個月的平均。
          這是約 25 公里格點的再分析資料，跟氣象站的實測會差一兩度（尤其是沿海的都市），所以寫的是「大約」，不是日本氣象廳的官方統計。
        </p>
        <p>穿著建議是照平均最高溫、最低溫分區間給的一般建議，每個人怕冷怕熱不同；梅雨、颱風的說明是九州的一般氣候。這頁的數字都由程式從資料算出，不是手寫的。</p>
      </ToolNote>
    </PageShell>
  );
}
