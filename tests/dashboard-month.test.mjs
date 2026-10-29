import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import * as data from "../src/business-demo-data.ts";
const source = readFileSync(new URL("../src/Prototype.tsx", import.meta.url), "utf8");
const helpers = source.slice(source.indexOf("const dashboardSnapshotMonth ="), source.indexOf("function MetricTile("));
const { buildDashboardMonth, snapshotMonth } = vm.runInNewContext(`${stripTypeScriptTypes(helpers)};({buildDashboardMonth,snapshotMonth:dashboardSnapshotMonth})`, { ...data });
const plain = (value) => JSON.parse(JSON.stringify(value));

test("snapshot month keeps current store and group KPI values", () => {
  const store = buildDashboardMonth("store", snapshotMonth);
  const group = buildDashboardMonth("group", snapshotMonth);
  assert(store.hasData && store.snapshot && group.hasData && group.snapshot);
  assert.deepEqual(plain(store.metrics), plain(data.storeMetrics));
  assert.deepEqual(plain(group.metrics), plain(data.groupMetrics.slice(0, 4)));
});
test("September uses historical POS orders and excludes October from its trend", () => {
  const model = buildDashboardMonth("store", "2026-09");
  assert.equal(model.sales, 168000);
  assert.equal(model.orderCount, 397);
  assert(!model.snapshot);
  assert.equal(model.metrics[1].value, "—");
  assert.equal(model.trend.at(-1).label, "9月");
  assert(!model.trend.some((point) => point.label === "10月"));
  assert(model.metrics[0].note.startsWith("环比 -"));
});
test("group historical GMV reconciles with the selected month source, not the current one", () => {
  const model = buildDashboardMonth("group", "2026-09");
  assert.equal(model.sales, data.rawGroupSource.gmvMonths.find((row) => row.month === "9月").gmvYuan);
  assert.equal(model.metrics[2].value, "—");
  assert.equal(model.channelMetrics[0].value, "—");
  assert.equal(model.trend.at(-1).value * 10000, model.sales);
});
test("unavailable month stays empty instead of falling back to current data", () => {
  for (const role of ["store", "group"]) {
    const model = buildDashboardMonth(role, "2027-01");
    assert(!model.hasData);
    assert(!model.snapshot);
    assert.equal(model.trend.length, 0);
  }
});
test("month selection only changes the active role and closes the picker", () => {
  const body = source.match(/onClick=\{\(\) => \{ (keyboard.hide\(\); setDashboardMonths.*?) \}\}/)?.[1];
  assert(body);
  const state = { roleView: "store", month: "2026-09", value: { store: "2026-10", group: "2026-10" }, open: true, keyboard: { hide() {} } };
  state.setDashboardMonths = (update) => { state.value = update(state.value); };
  state.setDashboardMonthOpen = (open) => { state.open = open; };
  vm.runInNewContext(body, state);
  assert.deepEqual(plain(state.value), { store: "2026-09", group: "2026-10" });
  assert.equal(state.open, false);
  assert(!body.includes("generateBusiness"));
});
