import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import ToolNote from "@/components/tools/ToolNote";
import { clothingAdvice, getFukuokaForecast, getWeather } from "@/lib/live/weather";
import { Suspense } from "react";
import { connection } from "next/server";
import LoadingBlock from "@/components/ui/LoadingBlock";

// 現在去福岡要穿什麼（TODO J4，2026-11-24）。現在的溫度跟頁尾時鐘旁的天氣同一份（30 分鐘快取），
// 福岡這幾天的最高／最低另外抓（3 小時快取）。都是伺服器端抓，訪客的瀏覽器不連第三方。

export const metadata: Metadata = withShare({
  title: "現在去福岡要穿什麼？福岡 vs 高雄氣溫 · Fukuoka Weather — PINGWEI LI",
  description: "福岡現在幾度、比高雄冷多少，接下來幾天的最高／最低溫跟穿著建議。給從台灣飛福岡的人看的。",
  alternates: { canonical: "/tools/fukuoka-weather" },
});

// 日本中午 12 點＝UTC 凌晨 3 點，同一天，getUTCDay 就是當地星期幾
const dayLabel = (date: string) =>
  `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}（${"日一二三四五六"[new Date(`${date}T12:00:00+09:00`).getUTCDay()]}）`;

async function FukuokaWeatherContent() {
  await connection(); // Cache Components：下面讀的都是即時資料（TODO C13）
  const [now, days] = await Promise.all([getWeather(), getFukuokaForecast()]);
  const kh = now?.value.find((c) => c.id === "kh");
  const fk = now?.value.find((c) => c.id === "fk");
  const diff = kh && fk ? kh.temp - fk.temp : null;

  return (
    <Shell>
      {fk ? (
        <p className="text-lg font-light text-(--text) leading-relaxed mb-12">
          福岡現在 <span className="font-mono text-(--accent)">{fk.temp}°C</span>（{fk.label}）
          {diff != null && kh && (
            <>
              ，高雄 <span className="font-mono">{kh.temp}°C</span>
              {diff > 0 ? `，福岡冷 ${diff} 度` : diff < 0 ? `，福岡反而熱 ${-diff} 度` : "，一樣溫度"}
            </>
          )}
          。現在出門：{clothingAdvice(fk.temp)}。
        </p>
      ) : (
        <p className="text-sm text-(--muted) font-light mb-12">現在的天氣暫時讀不到。</p>
      )}

      {days && (
        <section>
          <SectionHeading en="Next days">福岡這幾天</SectionHeading>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-light">
              <thead>
                <tr className="text-[11px] text-(--muted) font-mono tracking-wide text-left border-b border-(--border)">
                  <th className="py-2 pr-3 font-normal">日期</th>
                  <th className="py-2 pr-3 font-normal">天氣</th>
                  <th className="py-2 pr-3 font-normal">最高／最低</th>
                  <th className="py-2 font-normal">怎麼穿</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {days.value.map((d) => (
                  <tr key={d.date}>
                    <td className="py-3 pr-3 font-mono text-(--text) whitespace-nowrap">{dayLabel(d.date)}</td>
                    <td className="py-3 pr-3 text-(--text)">{d.label}</td>
                    <td className="py-3 pr-3 font-mono text-(--text) whitespace-nowrap">
                      {d.max}° / {d.min}°
                    </td>
                    <td className="py-3 text-(--text)">
                      白天{clothingAdvice(d.max)}
                      {clothingAdvice(d.min) !== clothingAdvice(d.max) && <span className="block text-xs text-(--muted)">早晚：{clothingAdvice(d.min)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ToolNote>
        <p>天氣資料來自 Open-Meteo（免費的開源氣象 API）：現在的溫度 30 分鐘更新一次，每日預報 3 小時一次。</p>
        <p>我自己在高雄跟福岡兩邊跑，這是每次出發前都會查的東西。</p>
      </ToolNote>
    </Shell>
  );
}

// 頁首（標題、說明）是 build 時就畫好的外殼；內容讀即時資料，訪客打開時才串流補進來（Cache Components，TODO C13）
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · Fukuoka Weather"
      title={<>現在去福岡要穿什麼</>}
      intro="福岡跟高雄差幾度、接下來幾天怎麼穿。建議是以台灣人的體感寫的（偏怕冷）。"
    >
      {children}
    </PageShell>
  );
}

export default function FukuokaWeatherPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <LoadingBlock label="讀取天氣中…" minHeight={700} />
        </Shell>
      }
    >
      <FukuokaWeatherContent />
    </Suspense>
  );
}
