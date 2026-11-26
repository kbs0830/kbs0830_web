import { Fragment, type ReactNode } from "react";

// 後台待辦說明用的極簡 markdown（2026-11-26，使用者：「說明會被 … 截掉，要設計可以點開，說明要完整」）。
// 只支援 TODO 實際會用到的：`> ` 引用（Claude 的問題／備註，紫色）、`- ` 清單（看縮排分層）、`→` 續行、整行粗體小標、表格（| a | b |）、
// 行內 `code`、**粗體**、[文字](https://…)。不支援的語法照原文顯示，不會吃掉內容。沒有 dangerouslySetInnerHTML。

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${i++}`;
    if (tok.startsWith("`")) {
      out.push(<code key={k} className="font-mono text-[0.92em] px-1 rounded-sm bg-(--bg) text-(--text)">{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith("**")) {
      out.push(<strong key={k} className="font-medium text-(--text)">{tok.slice(2, -2)}</strong>);
    } else {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)!;
      out.push(
        /^https?:\/\//.test(lm[2]) ? (
          <a key={k} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-(--accent) underline underline-offset-2 break-all">
            {lm[1]}
          </a>
        ) : (
          <span key={k} className="text-(--text)">{lm[1]}</span>
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let table: string[][] = [];

  const flushTable = (key: string) => {
    if (table.length === 0) return;
    const rows = table.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c.trim())));
    blocks.push(
      <div key={key} className="overflow-x-auto -mx-1 my-1">
        <table className="text-[12px] border-collapse">
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-b border-(--border) align-top">
                {r.map((c, ci) => (
                  <td key={ci} className={`px-1.5 py-1 ${ri === 0 ? "text-(--text) font-medium" : ""}`}>{inline(c.trim(), `${key}-${ri}-${ci}`)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    table = [];
  };

  lines.forEach((raw, idx) => {
    const key = `l${idx}`;
    if (/^\s*\|.*\|\s*$/.test(raw)) {
      table.push(raw.trim().slice(1, -1).split("|"));
      return;
    }
    flushTable(`t${idx}`);
    if (!raw.trim()) return;
    const indent = raw.match(/^\s*/)![0].length;
    const body = raw.trim();
    const pad = { marginLeft: `${Math.min(indent, 8) * 0.45}rem` }; // 用 margin：清單的 pl-3 是留給圓點的，不能被蓋掉
    const bullet = /^[-*]\s+(.*)$/.exec(body);
    // `> …`：Claude 留的問題／備註（scripts/admin-db.js todo ask／say 寫的）。用後台專用的藤紫色（--later），跟使用者自己寫的灰字分開
    const quote = /^>\s?(.*)$/.exec(body);
    if (quote) {
      blocks.push(
        <p key={key} style={pad} className="rounded-sm border-l-2 border-(--later) bg-(--later-lt) px-2.5 py-1.5 text-(--later)">
          {inline(quote[1], key)}
        </p>,
      );
    } else if (bullet) {
      blocks.push(
        <p key={key} style={pad} className="relative pl-3 before:absolute before:left-0 before:top-[0.6em] before:size-1 before:rounded-full before:bg-(--muted)">
          {inline(bullet[1], key)}
        </p>,
      );
    } else if (/^\*\*[^*]+\*\*$/.test(body)) {
      blocks.push(<p key={key} style={pad} className="pt-1 text-(--text) font-medium">{inline(body.slice(2, -2), key)}</p>);
    } else {
      blocks.push(<p key={key} style={pad}>{inline(body, key)}</p>);
    }
  });
  flushTable("tend");

  return <div className="space-y-1 text-[12.5px] leading-relaxed font-light text-(--muted) break-words">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
