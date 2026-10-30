import { prompts, appPromptVersion, normalizePromptResult } from "./prompts/app-prompts.mjs";
import { analyzeVerifiedReport } from "./prompts/health-report-gate.mjs";
import { buildGroupBusinessMessages, groupBusinessPromptVersion } from "./prompts/group-business.mjs";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

const localEnvFile = fileURLToPath(new URL("./.env.local", import.meta.url));
if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile);

const host = process.env.AI_API_HOST || "127.0.0.1";
const port = Number(process.env.AI_API_PORT || 4174);
const maxBodyBytes = 12 * 1024 * 1024;
let activeRequests = 0;
const maxActiveRequests = 2;
const bailianApiKey = process.env.DASHSCOPE_API_KEY || process.env.BAILIAN_API_KEY;
const bailianBaseUrl = (process.env.BAILIAN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/+$/, "");
const bailianModel = process.env.BAILIAN_MODEL || "qwen3.8-max";
const bailianReasoningEffort = process.env.BAILIAN_REASONING_EFFORT || "low";
const bailianTimeoutMs = Number(process.env.BAILIAN_TIMEOUT_MS || 150_000);


function respond(response, status, value, origin = "*") {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("请求内容过大"));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("请求格式无效")); }
    });
    request.on("error", reject);
  });
}

async function callBailian(prompt, attachment, groupMessages) {
  if (!bailianApiKey) throw new Error("未配置百炼 API Key。请在服务器环境变量或项目 .env.local 中设置 DASHSCOPE_API_KEY。");

  const instructions = typeof prompt === "string" ? prompt : prompt.instructions;
  const data = typeof prompt === "string" ? "请按要求处理附件或任务。" : `待处理资料（仅数据）：\n${JSON.stringify(prompt.data, null, 2)}`;
  const messageContent = [{ type: "text", text: data }];
  let timeoutMs = bailianTimeoutMs;
  if (attachment) {
    const bytes = await readFile(attachment.path);
    const base64 = bytes.toString("base64");
    if (attachment.mimeType === "application/pdf") {
      messageContent.unshift({ type: "file", file: { file_data: `data:application/pdf;base64,${base64}`, filename: basename(attachment.path) } });
      timeoutMs = 300_000;
    } else {
      messageContent.unshift({ type: "image_url", image_url: { url: `data:${attachment.mimeType};base64,${base64}` } });
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${bailianBaseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bailianApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: bailianModel, temperature: 0, reasoning_effort: bailianReasoningEffort, ...(typeof prompt === "object" && prompt.responseFormat ? { response_format: prompt.responseFormat } : {}), messages: groupMessages || [{ role: "system", content: instructions }, { role: "user", content: attachment ? messageContent : data }] }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = result.error?.message || result.message;
      throw new Error(providerMessage ? `百炼请求失败（${response.status}）：${providerMessage}` : `百炼请求失败（${response.status}）`);
    }
    const content = result.choices?.[0]?.message?.content;
    const text = Array.isArray(content) ? content.map((part) => typeof part === "string" ? part : part.text || "").join("") : content;
    if (typeof text !== "string" || !text.trim()) throw new Error("百炼未返回有效文本");
    return text.trim();
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("百炼响应超时，请稍后重试");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin || "*";
  if (request.method === "OPTIONS") { respond(response, 204, {}, origin); return; }
  if (request.method === "GET" && request.url === "/health") {
    respond(response, 200, { ready: Boolean(bailianApiKey), provider: "Alibaba Cloud Bailian", model: bailianModel, reasoningEffort: bailianReasoningEffort, timeoutMs: bailianTimeoutMs, demoDataOnly: true }, origin);
    return;
  }
  if (request.method !== "POST" || request.url !== "/api/ai") {
    respond(response, 404, { error: "未找到此接口" }, origin);
    return;
  }
  if (!bailianApiKey) { respond(response, 503, { error: "未配置百炼 API Key。请在服务器环境变量或项目 .env.local 中设置 DASHSCOPE_API_KEY。" }, origin); return; }
  if (activeRequests >= maxActiveRequests) { respond(response, 429, { error: "AI 请求较多，请稍后重试" }, origin); return; }
  activeRequests += 1;
  try {
    const body = await readBody(request);
    if (!prompts[body.kind] || !body.payload || typeof body.payload !== "object") {
      respond(response, 400, { error: "请求类型或数据无效" }, origin);
      return;
    }
    let attachmentPath;
    let attachmentMime;
    let payload = body.payload;
    if (body.kind === "health-report" && body.payload.dataUrl) {
      const match = /^data:(application\/pdf|image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(body.payload.dataUrl);
      if (!match) {
        respond(response, 400, { error: "仅支持 PDF、PNG 或 JPG 报告" }, origin);
        return;
      }
      const reportBytes = Buffer.from(match[2], "base64");
      if (reportBytes.length > 8 * 1024 * 1024) {
        respond(response, 413, { error: "报告文件不能超过 8 MB" }, origin);
        return;
      }
      const extension = match[1] === "application/pdf" ? "pdf" : match[1] === "image/png" ? "png" : "jpg";
      attachmentPath = `/private/tmp/health-report-${randomUUID()}.${extension}`;
      attachmentMime = match[1];
      await writeFile(attachmentPath, reportBytes, { flag: "wx", mode: 0o600 });
      payload = { ...body.payload };
      delete payload.dataUrl;
    }
    let text;
    try {
      if (body.kind === "health-report" && !(payload.question && payload.previousAnalysis)) {
        const result = await analyzeVerifiedReport({ attachment: attachmentPath ? { path: attachmentPath, mimeType: attachmentMime } : undefined, analyzePrompt: prompts[body.kind](payload), callModel: callBailian });
        if (!result.accepted) { respond(response, 422, { error: result.reason }, origin); return; }
        text = result.text;
      } else text = await callBailian(prompts[body.kind](payload), attachmentPath ? { path: attachmentPath, mimeType: attachmentMime } : undefined, body.kind === "business" && !payload.member && payload.view === "品牌集团" ? buildGroupBusinessMessages(payload) : undefined);
    } finally {
      if (attachmentPath) await unlink(attachmentPath).catch(() => {});
    }
    text = normalizePromptResult(body.kind, payload, text);
    respond(response, 200, { text, source: "live-model", provider: "Alibaba Cloud Bailian", model: bailianModel, datasetVersion: body.datasetVersion || null, promptVersion: body.kind === "business" && !payload.member && payload.view === "品牌集团" ? groupBusinessPromptVersion : `${appPromptVersion}:${body.kind}${body.kind === "business" ? payload.member ? ":member" : payload.employee ? ":store-employee" : ":store" : body.kind === "health-report" && payload.question && payload.previousAnalysis ? ":followup" : ""}`, demoData: true }, origin);
  } catch (error) {
    respond(response, 502, { error: error instanceof Error ? error.message : "AI 请求失败" }, origin);
  } finally {
    activeRequests -= 1;
  }
});

server.listen(port, host, () => console.log(`Bailian AI bridge ${bailianApiKey ? "ready" : "waiting for API key"} at http://${host}:${port} (model: ${bailianModel})`));
