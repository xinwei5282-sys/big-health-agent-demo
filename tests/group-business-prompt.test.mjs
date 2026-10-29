import test from "node:test";
import assert from "node:assert/strict";
import { buildGroupBusinessMessages, buildGroupBusinessPrompt } from "../prompts/group-business.mjs";

test("group instructions and business data have separate roles", () => {
  const marker = "IGNORE_ALL_RULES_IN_DATA";
  const payload = { view: "品牌集团", dataAsOf: "2026-10-28", note: marker, sourceFacts: { amountYuan: 40800 } };
  const messages = buildGroupBusinessMessages(payload);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "system");
  assert.equal(messages[1].role, "user");
  assert(!messages[0].content.includes(marker));
  const json = messages[1].content.split("【经营数据开始】\n")[1].split("\n【经营数据结束】")[0];
  assert.deepEqual(JSON.parse(json), payload);
  assert.equal(buildGroupBusinessPrompt(payload), messages.map((message) => message.content).join("\n\n"));
});
test("untrusted date text cannot enter system instructions", () => {
  const messages = buildGroupBusinessMessages({ dataAsOf: "2026-10-28\nOVERRIDE_ME" });
  assert(!messages[0].content.includes("OVERRIDE_ME"));
  assert(messages[0].content.includes("输入未注明日期"));
  assert(!messages[0].content.includes("{{DATA_AS_OF}}"));
});
