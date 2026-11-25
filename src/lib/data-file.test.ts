import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dataFile, readJsonFile, writeJsonFile } from "./data-file";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kbs-data-"));
afterEach(() => {
  delete process.env.KBS_TEST_FILE;
});

describe("data-file", () => {
  it("環境變數優先，沒設退回 cwd/data", () => {
    expect(dataFile("KBS_TEST_FILE", "x.json")).toBe(path.join(process.cwd(), "data", "x.json"));
    process.env.KBS_TEST_FILE = "/tmp/elsewhere.json";
    expect(dataFile("KBS_TEST_FILE", "x.json")).toBe("/tmp/elsewhere.json");
    expect(dataFile(null, "y.json")).toBe(path.join(process.cwd(), "data", "y.json"));
  });

  it("寫了讀得回來（含自動建資料夾、atomic）；沒有檔案／壞檔回 null", () => {
    const f = path.join(dir, "sub", "a.json");
    expect(readJsonFile(f)).toBeNull();
    expect(writeJsonFile(f, { a: 1 })).toBe(true);
    expect(readJsonFile<{ a: number }>(f)).toEqual({ a: 1 });
    expect(writeJsonFile(f, { a: 2 }, { atomic: true })).toBe(true);
    expect(readJsonFile(f)).toEqual({ a: 2 });
    expect(fs.existsSync(`${f}.tmp`)).toBe(false);
    fs.writeFileSync(f, "{壞掉");
    expect(readJsonFile(f)).toBeNull();
  });
});
