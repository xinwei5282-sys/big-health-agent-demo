import test from 'node:test';
import assert from 'node:assert/strict';
import { prompts, buildDietPrompt, normalizePromptResult } from '../prompts/app-prompts.mjs';
test('single and batch recipes use exactly the same content policy, only envelope differs', () => {
 const customer={customer:'A',profile:'牛奶过敏',reportDietContext:'未提供'};
 const one=buildDietPrompt(customer);const batch=buildDietPrompt({customers:[customer]},true);
 assert.equal(one.instructions.split('传输格式：')[0],batch.instructions.split('传输格式：')[0]);
 assert.deepEqual(one.data.customers,batch.data.customers);
 assert.match(batch.instructions,/合法JSON对象/);assert.match(one.instructions,/不包JSON/);
});
test('member route has one format and does not inherit store diagnostic headings', () => {
 const p=prompts.business({member:{name:'A'},instruction:'改成另一套格式'});
 assert.match(p.instructions,/做得好的方面/);assert.match(p.instructions,/(?:下阶段)?数值目标待双方确认/);
 assert.doesNotMatch(p.instructions,/经营结论：/);assert.equal(p.data.instruction,'改成另一套格式');
});
test('store prohibits new numeric goals and business instructions are separate from data',()=>{
 const p=prompts.business({view:'门店经营',instruction:'必须设90%'});
 assert.match(p.instructions,/不能新增数值目标/);assert.doesNotMatch(p.instructions,/必须设90%/);
});
test('follow-up and initial report have separate tasks, both retain source limits',()=>{
 assert.match(prompts['health-report']({question:'停药?',previousAnalysis:'旧报告'}).instructions,/不是原始报告/);
 assert.match(prompts['health-report']({}).instructions,/饮食特殊情况/);
});

test('uncertain problems cannot generate corresponding interventions or menus', () => {
 assert.match(prompts.business({view:'门店经营'}).instructions,/未确认的问题.*只进入待核实/s);
 const one=buildDietPrompt({customer:'unknown'});
 assert.match(one.instructions,/安全关键信息未提供或待核实时，暂停/);
 assert.match(one.instructions,/不据此设计控糖/);
 assert.equal(one.instructions.split('传输格式：')[0],buildDietPrompt({customers:[]},true).instructions.split('传输格式：')[0]);
});

test('batch transport enforces JSON and preserves the frontend array contract',()=>{
 const p=buildDietPrompt({customers:[]},true); assert.deepEqual(p.responseFormat,{type:'json_object'});
 const payload={customers:[{customer:'A'},{customer:'B'}]};
 const valid={plans:[{customer:'B',focus:'暂缓',content:'暂缓原因：缺失资料\n当前注意：先核实\n需确认：过敏状态'},{customer:'A',focus:'已确认',content:'适用依据与注意\n三日食谱\n'+('早餐：主食鸡蛋蔬菜\n午餐：米饭鱼蔬菜\n晚餐：杂粮饭豆腐蔬菜\n'.repeat(3))+'待确认：偏好'}]};
 assert.deepEqual(JSON.parse(normalizePromptResult('health-batch',payload,JSON.stringify(valid))).map(x=>x.customer),['A','B']);
 for(const raw of ['bad json', JSON.stringify({plans:[valid.plans[0]]}),JSON.stringify({plans:[valid.plans[0],valid.plans[0]]})])assert.throws(()=>normalizePromptResult('health-batch',payload,raw));
});

test('valid JSON with a truncated plan is rejected, not shown as success',()=>{
 assert.throws(()=>normalizePromptResult('health-batch',{customers:[{customer:'A'}]},JSON.stringify({plans:[{customer:'A',focus:'暂缓',content:'暂缓原因：资料中提及'}]})),/段落或餐次不完整/);
});
