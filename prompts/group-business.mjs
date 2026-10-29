import { readFileSync } from "node:fs";

export const groupBusinessPromptVersion = "group-ceo-diagnosis-v5";
const templateUrl = new URL("./group-business-diagnosis.txt", import.meta.url);

function renderInstructions(payload) {
  const template = readFileSync(templateUrl, "utf8");
  const asOf = typeof payload.dataAsOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(payload.dataAsOf) ? payload.dataAsOf : "输入未注明日期";
  return template.replace("{{DATA_AS_OF}}", asOf);
}

export function buildGroupBusinessMessages(payload) {
  return [
    { role: "system", content: renderInstructions(payload) },
    { role: "user", content: `【经营数据开始】\n${JSON.stringify(payload, null, 2)}\n【经营数据结束】` },
  ];
}

export function buildGroupBusinessPrompt(payload) {
  return buildGroupBusinessMessages(payload).map((message) => message.content).join("\n\n");
}
