import { describe, expect, it } from "vitest";
import { MAX_CONTENT_CHARS, MAX_MESSAGES, SYSTEM_PROMPT, ollamaToTextStream, parseChatBody } from "./chat-input";

describe("parseChatBody", () => {
  it("合法的對話原樣收下（內容會去頭尾空白）", () => {
    expect(parseChatBody({ messages: [{ role: "user", content: " 你好 " }] })).toEqual([{ role: "user", content: "你好" }]);
  });

  it("格式壞掉、空內容、太長、role 不對、最後一則不是 user 都回 null", () => {
    expect(parseChatBody(null)).toBeNull();
    expect(parseChatBody({})).toBeNull();
    expect(parseChatBody({ messages: [] })).toBeNull();
    expect(parseChatBody({ messages: [{ role: "user", content: "  " }] })).toBeNull();
    expect(parseChatBody({ messages: [{ role: "user", content: "a".repeat(MAX_CONTENT_CHARS + 1) }] })).toBeNull();
    expect(parseChatBody({ messages: [{ role: "system", content: "x" }] })).toBeNull();
    expect(parseChatBody({ messages: [{ role: "assistant", content: "x" }] })).toBeNull();
  });

  it("只留最後 MAX_MESSAGES 則", () => {
    const messages = Array.from({ length: 25 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` }));
    messages.push({ role: "user", content: "last" });
    const out = parseChatBody({ messages });
    expect(out).toHaveLength(MAX_MESSAGES);
    expect(out?.at(-1)?.content).toBe("last");
  });
});

describe("ollamaToTextStream", () => {
  it("跨 chunk 切斷的 NDJSON 也能組回來，壞行略過", async () => {
    const lines = ['{"message":{"content":"你"},"done":false}', "not json", '{"message":{"content":"好"},"done":false}', '{"done":true}'].join("\n");
    const bytes = new TextEncoder().encode(lines);
    const upstream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(bytes.slice(0, 20)); // 故意切在 JSON 中間
        c.enqueue(bytes.slice(20));
        c.close();
      },
    });
    expect(await new Response(ollamaToTextStream(upstream)).text()).toBe("你好");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("不含中文本名（privacy.spec 的規則）", () => {
    expect(SYSTEM_PROMPT).not.toContain("李秉威");
  });
});
