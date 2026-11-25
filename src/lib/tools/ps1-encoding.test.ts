import { describe, expect, it } from "vitest";
import { inspectPs1, withBom } from "./ps1-encoding";

const enc = (s: string) => new TextEncoder().encode(s);

describe("inspectPs1（J15）", () => {
  it("UTF-8 沒 BOM＋中文 → 5.1 會壞、可以補", () => {
    expect(inspectPs1(enc('Write-Host "部署完成"'))).toEqual({ encoding: "utf8", nonAscii: true, breaksOn51: true, fixable: true });
  });
  it("只有英文 → 沒事", () => {
    expect(inspectPs1(enc("Write-Host ok"))).toMatchObject({ encoding: "utf8", breaksOn51: false, fixable: false });
  });
  it("補了 BOM 就 OK，內容不變", () => {
    const fixed = withBom(enc('Write-Host "部署完成"'));
    expect([...fixed.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(fixed.slice(3))).toBe('Write-Host "部署完成"');
    expect(inspectPs1(fixed)).toMatchObject({ encoding: "utf8-bom", breaksOn51: false });
  });
  it("UTF-16 BOM、不是 UTF-8 的 byte", () => {
    expect(inspectPs1(new Uint8Array([0xff, 0xfe, 0x41, 0x00])).encoding).toBe("utf16le-bom");
    expect(inspectPs1(new Uint8Array([0xb3, 0xa1, 0xb8, 0x70])).encoding).toBe("not-utf8"); // Big5 的「部署」
  });
});
