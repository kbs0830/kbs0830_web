// PowerShell 腳本的編碼檢查（TODO J15，2026-11-25，畫面在 components/tools/Ps1EncodingCheck.tsx）。
// Windows PowerShell 5.1（powershell.exe）讀沒有 BOM 的 .ps1 會用系統語系（繁中 Windows＝Big5）解碼，
// UTF-8 的中文被拆散、機率性地出現「字串沒有結束字元」這類 parse error——這個網站的 watchdog.ps1 實際踩過（CLAUDE.md）。
// PowerShell 7（pwsh）預設就是 UTF-8，沒有這個問題。純函式，瀏覽器裡跑，檔案不上傳。

type Ps1Encoding = "utf8-bom" | "utf16le-bom" | "utf16be-bom" | "utf8" | "not-utf8";

export interface Ps1Report {
  encoding: Ps1Encoding;
  /** 有沒有非 ASCII 字元（中文、日文、全形符號…） */
  nonAscii: boolean;
  /** PowerShell 5.1 會不會讀錯 */
  breaksOn51: boolean;
  /** 可以直接補 BOM 修好（UTF-8 沒 BOM、有非 ASCII） */
  fixable: boolean;
}

const UTF8_BOM = new Uint8Array([0xef, 0xbb, 0xbf]);

export function inspectPs1(bytes: Uint8Array): Ps1Report {
  const starts = (...b: number[]) => b.every((v, i) => bytes[i] === v);
  if (starts(0xef, 0xbb, 0xbf)) return { encoding: "utf8-bom", nonAscii: bytes.slice(3).some((b) => b > 0x7f), breaksOn51: false, fixable: false };
  if (starts(0xff, 0xfe)) return { encoding: "utf16le-bom", nonAscii: true, breaksOn51: false, fixable: false };
  if (starts(0xfe, 0xff)) return { encoding: "utf16be-bom", nonAscii: true, breaksOn51: false, fixable: false };
  const nonAscii = bytes.some((b) => b > 0x7f);
  let utf8 = true;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    utf8 = false;
  }
  if (!utf8) return { encoding: "not-utf8", nonAscii, breaksOn51: false, fixable: false };
  return { encoding: "utf8", nonAscii, breaksOn51: nonAscii, fixable: nonAscii };
}

/** 前面補 UTF-8 BOM（內容一個 byte 都不改） */
export function withBom(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length + 3);
  out.set(UTF8_BOM, 0);
  out.set(bytes, 3);
  return out;
}
