import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { SITE_URL } from "@/lib/site/site";

// 站長後台的入口（TODO G5，2026-11-26，使用者：「首頁上加一格登入後台的按鈕，進到登入介面後分成訪客參觀跟登入」）。
// 真正的登入由 Cloudflare Access 處理（/admin 沒登入會被轉去 kbs0830.cloudflareaccess.com），這頁只是分流：
// 站長 → /admin；其他人 → /demo/admin（範例資料）。靜態頁，不讀任何資料。
// 「登入後台」用 <a> 不用 <Link>：/admin 沒登入時會 302 到 Cloudflare（別的網域），Link 的預先載入抓不到也沒意義。
export const metadata: Metadata = {
  title: "登入",
  description: "kbs0830.com 站長後台的入口：站長登入，或用範例資料參觀後台。",
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: true },
};

const card = "flex flex-col rounded-sm border border-(--border) p-5 sm:p-6";

export default function LoginPage() {
  return (
    <PageShell eyebrow="站長後台 · Admin" title={<>登入 &nbsp;·&nbsp; Sign in</>} intro="這個網站有一個只有站長能進的後台：部署、告警、流量、待辦都在裡面。">
      <div className="grid gap-4 sm:grid-cols-2">
        <section className={card}>
          <h2 className="font-serif text-lg text-(--text)">站長登入</h2>
          <p className="mt-1 text-[13px] font-light text-(--muted)">只有站長的帳號進得去。</p>
          <ul className="mt-4 space-y-2.5 text-[13px] font-light text-(--text)">
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-(--accent)" />
              <span><strong className="font-medium">Google 帳號</strong>：選 Google、用站長的 Gmail 登入</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-(--accent)" />
              <span><strong className="font-medium">Gmail 驗證碼</strong>：輸入 Gmail，信箱會收到 6 位數驗證碼</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-(--ok)" />
              <span><strong className="font-medium">內網</strong>：在家裡網路或桌機上直接進入，不用登入</span>
            </li>
          </ul>
          <a
            href="/admin"
            className="mt-6 inline-flex items-center justify-center h-11 rounded-sm bg-(--accent) text-(--bg) text-sm hover:opacity-90 transition-opacity"
          >
            登入後台 →
          </a>
          <p className="mt-2 text-[11px] font-light text-(--muted)">登入交給 Cloudflare Access，本站不碰密碼。登入後，後台每頁最上面可以登出、切換「維持登入」。</p>
        </section>

        <section className={card}>
          <h2 className="font-serif text-lg text-(--text)">訪客參觀</h2>
          <p className="mt-1 text-[13px] font-light text-(--muted)">不用登入。</p>
          <p className="mt-4 text-[13px] font-light leading-relaxed text-(--text)">
            用<strong className="font-medium">範例資料</strong>看後台長什麼樣：總覽、流量、維運、寄信、待辦都看得到，按鈕可以按，但不會存。
          </p>
          <Link
            href="/demo/admin"
            className="mt-6 sm:mt-auto inline-flex items-center justify-center h-11 rounded-sm border border-(--accent) text-(--accent) text-sm hover:bg-(--accent-lt) transition-colors"
          >
            訪客參觀 →
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
