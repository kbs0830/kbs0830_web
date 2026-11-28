import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFeedbackSummary, recordFeedback } from "@/lib/stats/feedback";

describe("文章回饋（B20）", () => {
  let file: string;
  beforeEach(() => {
    file = path.join(os.tmpdir(), `feedback-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
    vi.stubEnv("FEEDBACK_FILE", file);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(file, { force: true });
  });

  it("累計每篇的有／沒有、比例、最多人選的原因；票數多的在前", () => {
    const d1 = Date.UTC(2026, 10, 27, 6);
    const d2 = Date.UTC(2026, 10, 28, 6);
    recordFeedback("post-a", true, undefined, d1);
    recordFeedback("post-a", true, undefined, d2);
    recordFeedback("post-a", false, "unclear", d2);
    recordFeedback("post-b", false, "outdated", d1);
    recordFeedback("post-b", false, "outdated", d2);
    recordFeedback("post-b", false, "unclear", d2);
    recordFeedback("post-b", false, undefined, d2);
    recordFeedback("post-b", true, undefined, d2);
    const s = readFeedbackSummary();
    expect(s.map((x) => x.slug)).toEqual(["post-b", "post-a"]);
    expect(s[1]).toMatchObject({ yes: 2, no: 1, helpfulPct: 67, topReason: "unclear" });
    expect(s[0]).toMatchObject({ yes: 1, no: 4, helpfulPct: 20, topReason: "outdated" });
  });

  it("「有幫助」不記原因；沒有檔案是空陣列；只存次數（檔案裡沒有 IP、UA 之類）", () => {
    expect(readFeedbackSummary()).toEqual([]);
    recordFeedback("p", true, "unclear");
    const raw = fs.readFileSync(file, "utf8");
    expect(JSON.parse(raw).days[Object.keys(JSON.parse(raw).days)[0]].p.reasons).toEqual({});
    expect(raw).not.toMatch(/ip|agent|mozilla/i);
  });
});
