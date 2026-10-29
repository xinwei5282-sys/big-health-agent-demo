import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeVerifiedReport } from '../prompts/health-report-gate.mjs';
for (const raw of ['{"status":"rejected"}', '{"status":"uncertain"}', 'not json', '{"status":"accepted","evidence":[]}']) {
  test(`stops without analysis: ${raw}`, async () => {
    let calls = 0;
    const result = await analyzeVerifiedReport({ attachment: {}, analyzePrompt: 'ANALYZE', callModel: async () => { calls++; return raw; } });
    assert.equal(result.accepted, false); assert.equal(calls, 1);
  });
}
test('missing attachment makes no model request', async () => {
  const result = await analyzeVerifiedReport({ callModel: () => assert.fail('must not call') });
  assert.equal(result.accepted, false);
});
test('verified report then analysis, in that order with same attachment', async () => {
  const attachment = {}; const prompts = [];
  const result = await analyzeVerifiedReport({ attachment, analyzePrompt: 'ANALYZE', callModel: async (prompt, file) => {
    assert.equal(file, attachment); prompts.push(prompt);
    return prompts.length === 1 ? '{"status":"accepted","evidence":["血糖 5.1 mmol/L"]}' : '整体结论';
  }});
  assert.equal(result.text, '整体结论'); assert.equal(prompts.length, 2); assert.equal(prompts[1], 'ANALYZE');
});
