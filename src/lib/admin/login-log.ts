import "server-only";
import type { AdminIdentity } from "@/lib/admin/auth";
import { recordLogin } from "@/lib/admin/db";
import { classifyUA } from "@/lib/stats/visit-detail";

// 後台登入紀錄（TODO G3，2026-11-26，使用者：「紀錄登錄過的狀態」）。AdminShell 每次畫後台頁面時呼叫（放在 after() 裡，不拖慢頁面）。
// 一筆＝一次「登入」：Cloudflare 登入用 JWT 的 sub＋iat（7 天內同一次登入）；本機、家裡 IP 沒有登入這回事，同一天算一筆。
// 不存 IP、不存完整 User-Agent。

type HeaderLike = Pick<Headers, "get">;

const twDate = (now: number) => new Date(now + 8 * 3600_000).toISOString().slice(0, 10);

export function loginSession(id: AdminIdentity, now = Date.now()): string {
  if (id.via === "access") return `access:${id.session}`;
  return `${id.via}:${twDate(now)}`;
}

export function deviceSummary(ua: string): string {
  const { device, os, browser } = classifyUA(ua);
  return `${device} · ${os} · ${browser}`;
}

export function logAdminVisit(id: AdminIdentity, h: HeaderLike, now = Date.now()) {
  try {
    recordLogin(
      {
        session: loginSession(id, now),
        via: id.via,
        email: id.via === "access" ? id.email : null,
        country: (id.via === "access" ? id.country : undefined) ?? h.get("cf-ipcountry") ?? null,
        device: deviceSummary(h.get("user-agent") ?? ""),
      },
      now,
    );
  } catch {
    // 紀錄失敗不影響看後台
  }
}

export const VIA_LABEL: Record<AdminIdentity["via"], string> = { access: "Cloudflare 登入", ip: "家裡網路", local: "桌機本機" };
