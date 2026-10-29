import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";

const source = readFileSync(new URL("../src/Prototype.tsx", import.meta.url), "utf8");
const fn = source.slice(source.indexOf("function extractBusinessActions("), source.indexOf("const demoHealth"));
const extract = vm.runInNewContext(`${stripTypeScriptTypes(fn)};extractBusinessActions`);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("numbered findings are not mistaken for actions", () => {
  const report = "经营结论：需关注复购\n重点关注：\n一、复购低于目标\n二、库存需核实\n行动建议\n一、建议会员运营负责人核实差距\n二、建议商品负责人核对库存\n数据边界：样本范围有限";
  assert.deepEqual(plain(extract(report)), ["建议会员运营负责人核实差距", "建议商品负责人核对库存"]);
});
test("an empty colon heading still accepts numbered actions", () => {
  assert.deepEqual(plain(extract("重点关注：\n一、异常\n行动建议：\n一、核实异常\n备注：待确认")), ["核实异常"]);
});
test("existing inline action and no-heading reports still work", () => {
  assert.deepEqual(plain(extract("行动建议：核实库存；核对分账。")), ["核实库存", "核对分账"]);
  assert.deepEqual(plain(extract("优先行动\n1. 完成回访\n2. 复核资料")), ["完成回访", "复核资料"]);
});
