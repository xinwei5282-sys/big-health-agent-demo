import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityLogIcon,
  ArrowRightIcon,
  BarChartIcon,
  BellIcon,
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  DashboardIcon,
  GearIcon,
  GroupIcon,
  HeartIcon,
  HomeIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, KeyboardInput, KeyboardTextarea, MobileScroll, useKeyboard } from "./mobile";
import { aiDemoSnapshots } from "./ai-demo-snapshots";
import {
  storeMonthlyOrderLedger,
  storeDailySalesLedger,
  groupStoreMonthlyLedger,
  cockpitDimensions,
  groupBusinessSourceForAi,
  groupDemoDatasetVersion,
  groupMetrics,
  groupRecruitmentFunnel,
  groupStoreLedger,
  groupStoreCallbackLedger,
  groupHealthSyncRecords,
  groupStoreProductLedger,
  groupStoreInventoryMovementLedger,
  groupDealerRecords,
  groupDealerPurchaseOrderLedger,
  groupStoreHealth,
  groupTrend,
  productRankRows,
  rawGroupSource,
  rawStoreSource,
  storeAgentRoster,
  storeEmployeeRecords,
  managedTeams,
  memberDevelopment,
  storeBusinessSourceForAi,
  storeCustomerService,
  storeCustomerSummary,
  storeDemoDatasetVersion,
  storeDeviceBoundCustomers,
  storeCustomerRecords,
  storeCallbackRecords,
  storeHealthServiceRecords,
  storeHealthDailyReadingLedger,
  storeMetrics,
  storeProductFollowups,
  storeProductRankRows,
  storeTrend,
  teamRows,
} from "./business-demo-data";

type Screen = "home" | "workbench" | "todos" | "customers" | "customer-detail" | "health-report" | "health-plan" | "batch-plan" | "team" | "team-detail" | "market" | "member-detail" | "store-employee-detail" | "product-followup" | "mine";
type AiState = "idle" | "loading" | "success" | "error";
type RoleView = "store" | "group";
type ProductFollowupKey = "low-stock" | "slow-moving";
type DailyTodoItem = { text: string; done: boolean; carried: boolean };
type DailyTodoSnapshot = { date: string; items: DailyTodoItem[]; diagnosisVersion?: string };
type BatchPlan = { customer: string; focus: string; content: string };
type SingleHealthPlanSnapshot = BatchPlan & { datasetVersion: string; updatedAt: string };
type BusinessSnapshot = { answer: string; updatedAt: string; version?: string; datasetVersion?: string };
type StoreEmployee = (typeof storeEmployeeRecords)[number];

const businessSnapshotKey = "health-business-snapshots-v2";
const batchPlanSnapshotKey = "health-batch-plan-snapshots-v1";
const singleHealthPlanSnapshotKey = "health-single-plan-snapshots-v1";
const memberAnalysisSnapshotKey = "health-member-analysis-snapshots-v1";
const dailyTodoSnapshotKey = "health-daily-todos-v1";
const notificationReadKey = "health-system-notification-read-v1";
const storeEmployeeAnalysisSnapshotKey = "health-store-employee-analysis-v1";
const todayKey = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const yesterdayLabel = yesterday.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
function cycleDateLabel(daysFromToday: number) {
  const date = new Date(`${todayKey}T12:00:00+08:00`);
  date.setDate(date.getDate() + daysFromToday);
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric" }).format(date);
}
const scheduledPlanGeneratedAt = `${cycleDateLabel(-1)} 09:00`;
const scheduledPlanNextRun = `${cycleDateLabel(2)} 09:00`;
function formatPlanSnapshotDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}
const seedBusinessSnapshots: Record<RoleView, BusinessSnapshot> = {
  store: aiDemoSnapshots.business.store,
  group: aiDemoSnapshots.business.group,
};

function loadBusinessSnapshots(): Record<RoleView, BusinessSnapshot> {
  try {
    const stored = localStorage.getItem(businessSnapshotKey);
    if (!stored) return seedBusinessSnapshots;
    const parsed = JSON.parse(stored) as Partial<Record<RoleView, BusinessSnapshot>>;
    return {
      store: parsed.store?.answer && parsed.store.updatedAt && parsed.store.datasetVersion === storeDemoDatasetVersion ? parsed.store : seedBusinessSnapshots.store,
      group: parsed.group?.answer && parsed.group.updatedAt && parsed.group.datasetVersion === groupDemoDatasetVersion ? parsed.group : seedBusinessSnapshots.group,
    };
  } catch {
    return seedBusinessSnapshots;
  }
}

function loadBatchPlanSnapshots(): BatchPlan[] {
  try {
    const saved = JSON.parse(localStorage.getItem(batchPlanSnapshotKey) || "null") as { datasetVersion?: string; plans?: BatchPlan[] } | null;
    return saved?.datasetVersion === storeDemoDatasetVersion && Array.isArray(saved.plans) && saved.plans.length
      ? saved.plans.filter((plan) => typeof plan.customer === "string" && typeof plan.content === "string" && typeof plan.focus === "string")
      : [...aiDemoSnapshots.batch.plans];
  } catch { return [...aiDemoSnapshots.batch.plans]; }
}

function loadBatchPlanGeneratedAt() {
  try {
    const saved = JSON.parse(localStorage.getItem(batchPlanSnapshotKey) || "null") as { datasetVersion?: string; generatedAt?: string } | null;
    return saved?.datasetVersion === storeDemoDatasetVersion && saved.generatedAt ? formatPlanSnapshotDate(saved.generatedAt) : formatPlanSnapshotDate(aiDemoSnapshots.batch.generatedAt);
  } catch { return formatPlanSnapshotDate(aiDemoSnapshots.batch.generatedAt); }
}

function loadSingleHealthPlanSnapshots(): Record<string, SingleHealthPlanSnapshot> {
  try {
    const saved = JSON.parse(localStorage.getItem(singleHealthPlanSnapshotKey) || "{}") as Record<string, Partial<SingleHealthPlanSnapshot>>;
    const local = Object.fromEntries(Object.entries(saved || {}).filter(([, value]) => value?.datasetVersion === storeDemoDatasetVersion && typeof value?.content === "string" && typeof value?.focus === "string"));
    return { ...aiDemoSnapshots.singleHealthPlans, ...local } as Record<string, SingleHealthPlanSnapshot>;
  } catch { return aiDemoSnapshots.singleHealthPlans as Record<string, SingleHealthPlanSnapshot>; }
}

function loadMemberAnalysisSnapshots(): Record<string, { answer: string; datasetVersion: string; updatedAt: string }> {
  try {
    const saved = JSON.parse(localStorage.getItem(memberAnalysisSnapshotKey) || "{}") as Record<string, { answer?: string; datasetVersion?: string; updatedAt?: string }>;
    const local = Object.fromEntries(Object.entries(saved).filter(([, value]) => value?.answer && value.datasetVersion === groupDemoDatasetVersion).map(([name, value]) => [name, { answer: value.answer!, datasetVersion: groupDemoDatasetVersion, updatedAt: value.updatedAt || "" }]));
    return { ...aiDemoSnapshots.members, ...local };
  } catch { return aiDemoSnapshots.members; }
}

function loadStoreEmployeeAnalysisSnapshots(): Record<string, { answer: string; datasetVersion: string; updatedAt: string }> {
  const seeded = aiDemoSnapshots.storeEmployees as Record<string, { answer: string; datasetVersion: string; updatedAt: string }>;
  try {
    const saved = JSON.parse(localStorage.getItem(storeEmployeeAnalysisSnapshotKey) || "{}") as Record<string, { answer?: string; datasetVersion?: string; updatedAt?: string }>;
    const local = Object.fromEntries(Object.entries(saved).filter(([, value]) => value?.answer && value.datasetVersion === storeDemoDatasetVersion).map(([id, value]) => [id, { answer: value.answer!, datasetVersion: storeDemoDatasetVersion, updatedAt: value.updatedAt || "" }]));
    return { ...seeded, ...local };
  } catch { return seeded; }
}

function loadDailyTodoSnapshots(): Partial<Record<RoleView, DailyTodoSnapshot>> {
  try {
    const snapshots = JSON.parse(localStorage.getItem(dailyTodoSnapshotKey) || "{}") as Partial<Record<RoleView, DailyTodoSnapshot>>;
    const currentSnapshots = loadBusinessSnapshots();
    for (const view of ["store", "group"] as const) {
      if (snapshots[view]?.diagnosisVersion !== currentSnapshots[view].version) delete snapshots[view];
    }
    return snapshots;
  } catch {
    return {};
  }
}

function getTodayTodos(view: RoleView, snapshots: Partial<Record<RoleView, DailyTodoSnapshot>>) {
  const snapshot = snapshots[view];
  return snapshot?.date === todayKey ? snapshot.items : [];
}

function extractBusinessActions(answer: string) {
  const lines = answer.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const headingIndex = lines.findIndex((line) => /^(行动建议|下一步行动|建议动作)(?:[：:].*)?$/.test(line));
  if (headingIndex >= 0) {
    const inline = lines[headingIndex].replace(/^(行动建议|下一步行动|建议动作)[：:]?\s*/, "").trim();
    if (inline) return inline.split(/[；;。]/).map((item) => item.trim()).filter(Boolean);
    const actionLines = lines.slice(headingIndex + 1);
    const endIndex = actionLines.findIndex((line) => /^(数据边界|经营结论|重点关注|补充说明|统计口径|备注)[：:]/.test(line));
    const section = endIndex >= 0 ? actionLines.slice(0, endIndex) : actionLines;
    return section.filter((line) => /^[一二三四五六七八九十\d]+[、.)]/.test(line)).map((line) => line.replace(/^[一二三四五六七八九十\d]+[、.)]\s*/, "").trim());
  }
  return lines.filter((line) => /^[一二三四五六七八九十\d]+[、.)]/.test(line)).map((line) => line.replace(/^[一二三四五六七八九十\d]+[、.)]\s*/, "").trim());
}

const demoHealth = {
  glucose: "7.8",
  pressure: "138/86",
  weight: "68.0 kg",
  bodyFat: "31.0%",
  sleep: "6.2 h",
  deepSleep: "1.6 h",
};

const demoCustomer = {
  name: "李阿姨",
  gender: "女",
  age: 58,
  service: "王芳",
  dataTime: "今天 07:48",
  profile: "少盐清淡 · 忌海鲜 · 不吃香菜",
};
const healthReadingsByCustomer = new Map<string, typeof storeHealthDailyReadingLedger>();
for (const reading of storeHealthDailyReadingLedger) healthReadingsByCustomer.set(reading.customerId, [...(healthReadingsByCustomer.get(reading.customerId) || []), reading]);
const healthServiceByCustomer = new Map(storeHealthServiceRecords.map((row) => [row.customerId, row]));
const callbackByCustomer = new Map(storeCallbackRecords.map((row) => [row.customerId, row]));
const customerProfileData = Object.fromEntries(storeCustomerRecords.map((customer) => {
  const latest = healthReadingsByCustomer.get(customer.id)?.at(-1);
  const serviceState = healthServiceByCustomer.get(customer.id);
  const restrictions = customer.dietaryRestriction === "无" ? "无忌口" : customer.dietaryRestriction;
  const dateLabel = latest ? `${Number(latest.measuredAt.slice(5, 7))} 月 ${Number(latest.measuredAt.slice(8, 10))} 日 07:${latest.measuredAt.slice(14, 16)}` : "待同步";
  return [customer.displayName, {
    name: customer.displayName,
    gender: customer.gender,
    age: customer.age,
    service: "王芳",
    dataTime: dateLabel,
    profile: `${customer.dietPreference} · ${restrictions}`,
    readings: latest ? {
      glucose: latest.glucose.toFixed(1), totalCholesterol: latest.totalCholesterol.toFixed(1), triglyceride: latest.triglyceride.toFixed(1), hdl: latest.hdl.toFixed(1), ldl: latest.ldl.toFixed(1),
      pressure: `${latest.systolic}/${latest.diastolic}`, weight: `${latest.weightKg.toFixed(1)} kg`, bodyFat: `${latest.bodyFatPercent.toFixed(1)}%`, sleep: `${latest.sleepHours.toFixed(1)} h`, deepSleep: `${latest.deepSleepHours.toFixed(1)} h`,
    } : { glucose: "待同步", totalCholesterol: "待同步", triglyceride: "待同步", hdl: "待同步", ldl: "待同步", pressure: "待同步", weight: "待同步", bodyFat: "待同步", sleep: "待同步", deepSleep: "待同步" },
    notes: { glucose: latest ? "近 7 日设备记录" : "暂无新记录", pressure: latest ? "近 7 日设备记录" : "待补充数据", body: latest ? "本周已同步" : "待补充数据", sleep: latest ? "含睡眠时长与深睡时长" : "待补充数据" },
    planStatus: serviceState?.planStatus || "awaiting-data",
    callbackStatus: callbackByCustomer.get(customer.id)?.status || "none",
  }];
}));

type HealthMetricKey = "glucose" | "pressure" | "weight" | "bodyFat" | "sleep";
type LipidMetricKey = "glucose" | "totalCholesterol" | "triglyceride" | "hdl" | "ldl";
type DailyHealthReading = { date: string; glucose: number; totalCholesterol: number; triglyceride: number; hdl: number; ldl: number; systolic: number; diastolic: number; weight: number; bodyFat: number; sleep: number; deepSleep: number };
const lipidMetricOptions: { key: LipidMetricKey; label: string; unit: string }[] = [
  { key: "glucose", label: "血糖", unit: "mmol/L" },
  { key: "totalCholesterol", label: "总胆固醇", unit: "mmol/L" },
  { key: "triglyceride", label: "甘油三酯", unit: "mmol/L" },
  { key: "hdl", label: "高密度脂蛋白", unit: "mmol/L" },
  { key: "ldl", label: "低密度脂蛋白", unit: "mmol/L" },
];
const healthMetricOptions: { key: HealthMetricKey; label: string; unit: string }[] = [
  { key: "glucose", label: "血糖血脂", unit: "mmol/L" },
  { key: "pressure", label: "血压", unit: "mmHg" },
  { key: "weight", label: "体重", unit: "kg" },
  { key: "bodyFat", label: "体脂", unit: "%" },
  { key: "sleep", label: "睡眠", unit: "小时" },
];
const dailyHealthReadings: Record<string, DailyHealthReading[]> = Object.fromEntries(storeCustomerRecords.map((customer) => [customer.displayName, (healthReadingsByCustomer.get(customer.id) || []).map((reading) => ({
  date: `${Number(reading.measuredAt.slice(5, 7))}月${Number(reading.measuredAt.slice(8, 10))}日`,
  glucose: reading.glucose, totalCholesterol: reading.totalCholesterol, triglyceride: reading.triglyceride, hdl: reading.hdl, ldl: reading.ldl,
  systolic: reading.systolic, diastolic: reading.diastolic, weight: reading.weightKg, bodyFat: reading.bodyFatPercent, sleep: reading.sleepHours, deepSleep: reading.deepSleepHours,
}))]));
function getHealthMetricValue(reading: DailyHealthReading, key: HealthMetricKey) {
  return key === "pressure" ? reading.systolic : reading[key];
}

function getLipidMetricValue(reading: DailyHealthReading, key: LipidMetricKey) {
  return reading[key];
}

function formatHealthReading(reading: DailyHealthReading, key: HealthMetricKey) {
  if (key === "pressure") return `${reading.systolic}/${reading.diastolic}`;
  return getHealthMetricValue(reading, key).toFixed(1);
}

type MarketRecord = { id: string; title: string; subtitle: string; status: string; tone: string; metrics: [string, string][]; issue: string; action: string; owner: string; history: string[] };
type MarketPartner = MarketRecord & { kind: "store" | "dealer"; region: string; parentId?: string; contact: string; since: string; operation: [string, string][] };
const marketPartnerFixtures: MarketPartner[] = [
  { id: "dealer-hy", kind: "dealer", title: "杭甬经销商", subtitle: "经销商 · 浙江杭州 / 宁波", region: "浙江", contact: "张伟", since: "2024-06", status: "正常合作", tone: "good", owner: "渠道经理 · 陈经理", metrics: [["本月进货额", "¥12.8w"], ["进货目标达成", "92%"], ["返单周期", "18 天"], ["库存周转", "32 天"]], operation: [["最近返单", "10/25"], ["本月进货单", "6 笔"], ["库存关注商品", "1 款"], ["门店经营关注", "1 家"]], issue: "宁波天一店返单下滑，需要经销商协同门店核对库存与动销。", action: "联合门店复盘商品销售与库存，明确返单计划，并安排一次门店经营辅导。", history: ["10/27 已核对本月进货与到货情况", "10/24 完成经销商日常经营回访"] },
  { id: "dealer-wz", kind: "dealer", title: "温州经销商", subtitle: "经销商 · 浙江温州", region: "浙江", contact: "李文娟", since: "2025-03", status: "正常合作", tone: "good", owner: "渠道经理 · 陈经理", metrics: [["本月进货额", "¥8.2w"], ["进货目标达成", "78%"], ["返单周期", "26 天"], ["库存周转", "46 天"]], operation: [["最近返单", "10/18"], ["本月进货单", "4 笔"], ["库存关注商品", "2 款"], ["门店经营关注", "1 家"]], issue: "返单周期延长，所辖门店客流下降，需先核对动销再安排补货。", action: "与温州五马店确认客流变化及库存结构，制定门店支持计划，复核一周后的执行情况。", history: ["10/28 已收集门店客流与库存问题", "10/23 已沟通商品体验支持安排"] },
  { id: "store-hz", kind: "store", title: "杭州延安店", subtitle: "门店 · 浙江杭州", region: "浙江", parentId: "dealer-hy", contact: "王店长", since: "2024-08", status: "正常营业", tone: "good", owner: "门店督导 · 周经理", metrics: [["本月销售额", "¥18.6w"], ["销售目标达成", "92%"], ["会员复购率", "38%"], ["库存偏低商品", "2 款"]], operation: [["本月订单", "426 笔"], ["活跃会员", "286 人"], ["待完成顾客回访", "18 位"], ["待更新健康方案", "12 位"]], issue: "销售同比增长 12%；会员复购距门店 42% 目标差 4 个百分点。", action: "店长协调会员顾问完成 18 位顾客回访，核对 2 款低库存商品，并复核顾客方案更新安排。", history: ["10/28 已汇总本店销售与会员服务数据", "10/26 已安排本轮会员回访"] },
  { id: "store-nb", kind: "store", title: "宁波天一店", subtitle: "门店 · 浙江宁波", region: "浙江", parentId: "dealer-hy", contact: "刘店长", since: "2025-01", status: "正常营业", tone: "good", owner: "门店督导 · 周经理", metrics: [["本月销售额", "¥12.4w"], ["销售目标达成", "76%"], ["会员复购率", "31%"], ["库存周转", "48 天"]], operation: [["本月订单", "310 笔"], ["活跃会员", "214 人"], ["待完成顾客回访", "24 位"], ["待更新健康方案", "9 位"]], issue: "返单下滑，库存周转偏慢，需要区分商品结构问题与会员购买变化。", action: "由门店督导联合杭甬经销商核对库存，开展商品陈列辅导，跟进重点会员回访结果。", history: ["10/28 记录返单与库存周转异常", "10/25 已与经销商沟通门店辅导安排"] },
  { id: "store-wz", kind: "store", title: "温州五马店", subtitle: "门店 · 浙江温州", region: "浙江", parentId: "dealer-wz", contact: "赵店长", since: "2025-05", status: "正常营业", tone: "good", owner: "门店督导 · 林经理", metrics: [["本月销售额", "¥9.8w"], ["销售目标达成", "68%"], ["会员复购率", "29%"], ["库存周转", "52 天"]], operation: [["本月订单", "245 笔"], ["活跃会员", "168 人"], ["待完成顾客回访", "21 位"], ["待更新健康方案", "7 位"]], issue: "到店客流下降，销售目标完成偏慢，需要加强会员唤醒与商品体验。", action: "由温州经销商协调门店体验支持，店长安排会员邀约并记录顾客反馈，下周复盘到店与成交。", history: ["10/28 已确认门店客流下降", "10/26 已完成门店问题收集"] },
];
const marketPartners: MarketPartner[] = marketPartnerFixtures.map((partner) => {
  if (partner.kind === "store") {
    const store = groupStoreLedger.find((row) => row.id === partner.id);
    if (!store) return partner;
    const callbacks = groupStoreCallbackLedger.filter((row) => row.storeId === store.id);
    const health = groupHealthSyncRecords.filter((row) => row.storeId === store.id);
    const products = groupStoreProductLedger.filter((row) => row.storeId === store.id);
    const lowStock = products.filter((row) => row.stockUnits <= row.warningStockUnits).length;
    const pendingCallbacks = callbacks.filter((row) => row.status === "pending").length;
    const duePlans = health.filter((row) => row.planUpdateDue).length;
    const inventoryDays = products.reduce((sum, row) => sum + (row.soldUnits ? row.stockUnits * 30 / row.soldUnits : 0), 0) / Math.max(products.length, 1);
    return {
      ...partner,
      metrics: [["本月销售额", `¥${(store.monthGmvYuan / 10_000).toFixed(1)}w`], ["销售目标达成", `${Math.round(store.monthGmvYuan / store.monthlyTargetYuan * 100)}%`], ["会员复购率", `${store.repeatRatePercent}%`], [lowStock ? "库存偏低商品" : "库存周转", lowStock ? `${lowStock} 款` : `${Math.round(inventoryDays)} 天`]],
      operation: [["本月订单", `${store.orderCount} 笔`], ["活跃会员", `${store.memberCount} 人`], ["待完成顾客回访", `${pendingCallbacks} 位`], ["待更新健康方案", `${duePlans} 位`]],
    };
  }
  const dealer = groupDealerRecords.find((row) => row.id === partner.id);
  if (!dealer) return partner;
  const orders = groupDealerPurchaseOrderLedger.filter((row) => row.dealerId === dealer.id);
  const childIds = marketPartnerFixtures.filter((candidate) => candidate.kind === "store" && candidate.parentId === dealer.id).map((candidate) => candidate.id);
  const stockAlerts = childIds.reduce((sum, id) => sum + groupStoreProductLedger.filter((row) => row.storeId === id && row.stockUnits <= row.warningStockUnits).length, 0);
  const storeIssues = childIds.filter((id) => groupStoreLedger.find((store) => store.id === id)?.healthStatus !== "healthy").length;
  const latestOrder = dealer.lastOrderDate ? `${Number(dealer.lastOrderDate.slice(-2))}/${Number(dealer.lastOrderDate.slice(5, 7))}` : "暂无";
  return {
    ...partner,
    metrics: [["本月进货额", `¥${(dealer.monthlyPurchaseYuan / 10_000).toFixed(1)}w`], ["进货目标达成", `${Math.round(dealer.monthlyPurchaseYuan / dealer.monthlyTargetYuan * 100)}%`], ["返单周期", `${dealer.reorderCycleDays} 天`], ["库存周转", `${dealer.stockTurnoverDays} 天`]],
    operation: [["最近返单", latestOrder], ["本月进货单", `${orders.length} 笔`], ["库存关注商品", `${stockAlerts} 款`], ["门店经营关注", `${storeIssues} 家`]],
  };
});
type StoreSupply = { supplierId: string; reorderDays: number; turnoverDays: number; products: { name: string; spec: string; received: number; returned: number; unitPrice: number; stock: number; receivedAt: string }[]; pending: { orderId: string; name: string; quantity: number; amount: number; expected: string }[] };
const storeSupplyFixtures: Record<string, StoreSupply> = {
  "store-hz": { supplierId: "dealer-hy", reorderDays: 14, turnoverDays: 28, products: [
    { name: "高蛋白谷物粉", spec: "400g/盒", received: 200, returned: 0, unitPrice: 90, stock: 8, receivedAt: "10/25" },
    { name: "低糖芝麻丸", spec: "30粒/盒", received: 300, returned: 0, unitPrice: 50, stock: 6, receivedAt: "10/25" },
    { name: "轻食营养粥", spec: "300g/盒", received: 150, returned: 20, unitPrice: 60, stock: 42, receivedAt: "10/20" },
  ], pending: [{ orderId: "PO-HZ-1028", name: "高蛋白谷物粉", quantity: 40, amount: 3600, expected: "10/30" }] },
  "store-nb": { supplierId: "dealer-hy", reorderDays: 21, turnoverDays: 48, products: [
    { name: "高蛋白谷物粉", spec: "400g/盒", received: 150, returned: 0, unitPrice: 90, stock: 64, receivedAt: "10/18" },
    { name: "低糖芝麻丸", spec: "30粒/盒", received: 210, returned: 10, unitPrice: 50, stock: 88, receivedAt: "10/18" },
    { name: "轻食营养粥", spec: "300g/盒", received: 100, returned: 0, unitPrice: 60, stock: 57, receivedAt: "10/12" },
  ], pending: [] },
  "store-wz": { supplierId: "dealer-wz", reorderDays: 26, turnoverDays: 52, products: [
    { name: "高蛋白谷物粉", spec: "400g/盒", received: 100, returned: 0, unitPrice: 90, stock: 52, receivedAt: "10/16" },
    { name: "低糖芝麻丸", spec: "30粒/盒", received: 180, returned: 0, unitPrice: 50, stock: 96, receivedAt: "10/16" },
    { name: "轻食营养粥", spec: "300g/盒", received: 100, returned: 0, unitPrice: 60, stock: 62, receivedAt: "10/10" },
  ], pending: [{ orderId: "PO-WZ-1027", name: "低糖芝麻丸", quantity: 20, amount: 1000, expected: "10/31" }] },
};
const storeSupplies: Record<string, StoreSupply> = Object.fromEntries(Object.entries(storeSupplyFixtures).map(([storeId, fixture]) => {
  const ledgerRows = groupStoreProductLedger.filter((row) => row.storeId === storeId);
  const products = ledgerRows.map((row) => {
    const receipt = groupStoreInventoryMovementLedger.find((movement) => movement.storeId === storeId && movement.skuId === row.skuId && movement.kind === "purchase-received");
    const returned = groupStoreInventoryMovementLedger.find((movement) => movement.storeId === storeId && movement.skuId === row.skuId && movement.kind === "purchase-return");
    const date = fixture.products.find((item) => item.name === row.productName)?.receivedAt || "10/25";
    return { name: row.productName, spec: row.spec, received: receipt?.quantity || 0, returned: Math.abs(returned?.quantity || 0), unitPrice: row.purchaseUnitPriceYuan, stock: row.stockUnits, receivedAt: date };
  });
  const soldUnits = ledgerRows.reduce((sum, row) => sum + row.soldUnits, 0);
  const stockUnits = ledgerRows.reduce((sum, row) => sum + row.stockUnits, 0);
  const weightedTurnover = Math.ceil(stockUnits * 30 / Math.max(1, soldUnits));
  return [storeId, { ...fixture, products, turnoverDays: weightedTurnover }];
}));
function getStoreSupplyStats(supply: StoreSupply) {
  return {
    amount: supply.products.reduce((sum, item) => sum + (item.received - item.returned) * item.unitPrice, 0),
    quantity: supply.products.reduce((sum, item) => sum + item.received - item.returned, 0),
    returnedAmount: supply.products.reduce((sum, item) => sum + item.returned * item.unitPrice, 0),
    returnedQuantity: supply.products.reduce((sum, item) => sum + item.returned, 0),
    stock: supply.products.reduce((sum, item) => sum + item.stock, 0),
    lastReceivedAt: supply.products.map((item) => item.receivedAt).sort().at(-1) || "暂无记录",
  };
}
function supplyMoney(amount: number) { return `¥${amount.toLocaleString("zh-CN")}`; }
const partnerAlerts: Record<string, string> = { "dealer-wz": "返单周期延长", "store-nb": "返单下滑", "store-wz": "客流下降" };
const marketLeads: MarketRecord[] = [
  { id: "lead-hz", title: "杭州滨江合作意向", subtitle: "华东 · 品牌活动渠道 · 有效洽谈", status: "待跟进", tone: "watch", metrics: [["意向门店", "3 家"], ["最近跟进", "3 天前"], ["当前阶段", "方案沟通"], ["下步节点", "10/30 回访"]], issue: "合作方已收到门店方案，尚未确认首店选址与开业计划。", action: "回访确认选址意向，补齐门店投入测算与开业支持清单，再安排区域负责人面谈。", owner: "华东招商负责人", history: ["10/26 已发送合作方案与产品资料", "10/24 完成需求初访，计划优先开设首店"] },
  { id: "lead-cd", title: "成都高新代理签约", subtitle: "西南 · 合作转介绍 · 签约代理", status: "筹备中", tone: "good", metrics: [["计划开店", "2 家"], ["当前阶段", "开业筹备"], ["培训进度", "2 / 3 项"], ["计划开业", "11/08"]], issue: "代理已签约，门店培训尚缺商品体验与会员服务实操。", action: "确认最后一场培训与首批货品到店时间，按开业检查清单逐项核对。", owner: "西南区域负责人", history: ["10/27 完成门店基础运营培训", "10/22 已签约，进入首店筹备"] },
  { id: "lead-wh", title: "武汉光谷渠道合作", subtitle: "华中 · 渠道招募 · 区域线索", status: "待初访", tone: "watch", metrics: [["意向门店", "待确认"], ["当前阶段", "线索核实"], ["录入时间", "10/28"], ["下步节点", "10/30 初访"]], issue: "尚未确认合作区域、运营经验及可投入资源。", action: "初访核实经营背景、开店意向与投入计划，确认是否进入有效洽谈。", owner: "华中招商负责人", history: ["10/28 渠道招募线索录入，待初访核实"] },
];
const marketCampaigns: MarketRecord[] = [
  { id: "campaign-taste", title: "秋季营养食品体验周", subtitle: "商品体验 · 华东 128 家门店", status: "进行中", tone: "good", metrics: [["活动投入", "¥3.6w"], ["参与顾客", "2,160 人"], ["成交顾客", "486 人"], ["关联销售额", "¥21.8w"]], issue: "参与顾客购买转化率 22.5%，部分门店体验后回访尚未完成。", action: "跟进体验后未购买顾客的反馈，复盘各门店转化差异；活动结束后 7 天复核关联订单与实际费用。", owner: "品牌营销负责人", history: ["10/28 汇总体验顾客与关联订单", "10/21 体验周启动，覆盖 128 家门店"] },
  { id: "campaign-return", title: "老会员回店关怀", subtitle: "会员唤醒 · 华南 86 家门店", status: "进行中", tone: "good", metrics: [["活动投入", "¥1.2w"], ["触达会员", "1,840 人"], ["回店会员", "368 人"], ["关联销售额", "¥9.6w"]], issue: "触达会员回店率 20%，需继续观察活动后的复购表现。", action: "门店记录会员回店反馈，针对未回店会员分组回访，活动结束后复核 30 天复购。", owner: "会员运营负责人", history: ["10/28 回店会员累计 368 人", "10/23 完成首轮会员分组触达"] },
  { id: "campaign-new", title: "新店开业联合推广", subtitle: "新店获客 · 西南 8 家门店", status: "待启动", tone: "watch", metrics: [["计划预算", "¥2.4w"], ["覆盖门店", "8 家"], ["启动日期", "11/01"], ["物料进度", "6 / 8 家"]], issue: "2 家门店尚未确认活动物料，活动暂未开始，不计入已投入与转化。", action: "启动前核对剩余门店物料、人员与活动方案，确认到位后开始推广。", owner: "西南市场负责人", history: ["10/28 6 家门店已确认物料", "10/26 完成区域联合推广计划"] },
];
const storeRows = ["store-hz", "store-nb", "store-wz"].flatMap((id) => {
  const store = groupStoreLedger.find((item) => item.id === id);
  if (!store) return [];
  const tone = store.healthStatus === "healthy" ? "good" : store.healthStatus === "attention" ? "watch" : "risk";
  const status = store.healthStatus === "healthy" ? "健康" : store.healthStatus === "attention" ? "关注" : "预警";
  return [{ id: store.id, name: store.storeName, note: store.issue || "经营稳定", status, tone, monthlySalesYuan: store.monthGmvYuan, orderCount: store.orderCount, memberCount: store.memberCount, repeatRatePercent: store.repeatRatePercent, targetPercent: Math.round(store.monthGmvYuan / store.monthlyTargetYuan * 100) }];
});

const customerRows = storeCustomerRecords.map((record) => {
  const latest = healthReadingsByCustomer.get(record.id)?.at(-1);
  const service = healthServiceByCustomer.get(record.id);
  const callback = callbackByCustomer.get(record.id);
  const needsFollowUp = callback?.status === "pending";
  const planNeedsReview = service?.planStatus === "due";
  const note = needsFollowUp ? "待回访" : planNeedsReview ? "方案待核对" : !latest ? "待同步数据" : "服务中";
  return {
    name: record.displayName,
    age: `${record.gender} · ${record.age}岁`,
    note,
    metric: latest ? `血糖 ${latest.glucose.toFixed(1)} · 血压 ${latest.systolic}/${latest.diastolic}` : "健康指标尚未更新",
    tone: latest && latest.glucose >= 7.5 ? "risk" : needsFollowUp || planNeedsReview || !latest ? "watch" : "good",
    avatar: record.displayName.slice(0, 1),
    cycleNote: planNeedsReview ? `待更新方案 · 最近生成 ${scheduledPlanGeneratedAt}` : service?.planStatus === "executing" ? `方案执行中 · 下轮更新 ${scheduledPlanNextRun}` : !latest ? "设备数据更新后可生成方案" : "暂无方案待办",
    needsFollowUp,
    planNeedsReview,
  };
}).sort((a, b) => {
  const priority = (customer: { needsFollowUp: boolean; planNeedsReview: boolean; note: string; name: string }) => Number(customer.needsFollowUp) + Number(customer.planNeedsReview) + Number(customer.note === "待同步数据") + (customer.name === "李阿姨" ? 2 : customer.name === "张姐" ? 1 : 0);
  return priority(b) - priority(a);
});

const batchHealthCustomers = [
  { customer: "李阿姨", age: "58 岁", readings: demoHealth, profile: "少盐清淡 · 忌海鲜 · 不吃香菜", dataFreshness: "今天 07:48 同步" },
  { customer: "王叔", age: "62 岁", readings: { glucose: "6.2 mmol/L", pressure: "132/82 mmHg", weight: "72.4 kg", sleep: "7.1 h" }, profile: "未填写饮食偏好与忌口", dataFreshness: "今天 06:55 同步" },
  { customer: "张姐", age: "45 岁", readings: { available: "当前无新同步的健康指标" }, profile: "未填写饮食偏好与忌口", dataFreshness: "最近记录 10 月 23 日，需核实" },
];

type ManagedTeam = (typeof managedTeams)[number];
function getTeamStats(team: ManagedTeam) {
  const members = team.memberNames.map((name) => teamRows.find((member) => member.name === name)).filter((member): member is (typeof teamRows)[number] => Boolean(member));
  const eligible = members.reduce((total, member) => total + member.repeatEligible, 0);
  const sales = members.reduce((total, member) => total + member.netSalesYuan, 0);
  return { sales, orders: members.reduce((total, member) => total + member.orderCount, 0), customers: eligible, repurchase: eligible ? Math.round(members.reduce((total, member) => total + member.repeatBuyers, 0) / eligible * 100) : 0, progress: Math.round(sales / team.target * 100), active: team.memberNames.filter((name) => memberDevelopment[name]?.active).length };
}
function getTeamFollowup(team: ManagedTeam) {
  const pending = team.tasks.filter((task) => task.status !== "已完成");
  return {
    pendingCount: pending.length,
    feedbackCount: pending.filter((task) => task.status === "待反馈").length,
    nextDeadline: pending.map((task) => task.deadline).sort().at(0) || "",
  };
}
function getPriorityTeamFollowups(teams: ManagedTeam[]) {
  return teams.map((team) => ({ team, stats: getTeamStats(team), followup: getTeamFollowup(team) }))
    .filter((item) => item.followup.pendingCount > 0 || item.stats.active < item.team.memberNames.length)
    .sort((a, b) => (a.followup.nextDeadline || "99/99").localeCompare(b.followup.nextDeadline || "99/99") || a.stats.progress - b.stats.progress)
    .slice(0, 2);
}
function formatTeamMoney(value: number) { return `¥${(value / 10000).toFixed(1)}w`; }
const storeEmployeeTeamSummary = {
  salesYuan: storeEmployeeRecords.reduce((sum, employee) => sum + employee.salesYuan, 0),
  targetYuan: storeEmployeeRecords.reduce((sum, employee) => sum + employee.salesTargetYuan, 0),
  employees: storeEmployeeRecords.length,
  callbacksPending: storeEmployeeRecords.reduce((sum, employee) => sum + employee.callbackPending, 0),
};
const groupProductSummary = {
  catalogCount: rawGroupSource.products.length,
  salesYuan: rawGroupSource.products.reduce((sum, product) => sum + product.monthlySalesYuan, 0),
  warningCount: rawGroupSource.products.filter((product) => product.stock < product.warningLine || product.turnoverDays >= 45).length,
  slowCount: rawGroupSource.products.filter((product) => product.turnoverDays >= 45).length,
};

async function requestAi(kind: "business" | "health" | "health-batch" | "health-report", payload: unknown): Promise<string> {
  const apiUrl = import.meta.env.VITE_AI_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:4174/api/ai" : "/api/ai");
  const payloadObject = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const datasetVersion = kind === "business"
    ? payloadObject.employee || payloadObject.view === "门店经营" ? storeDemoDatasetVersion : groupDemoDatasetVersion
    : "health-demo-v1";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, payload, datasetVersion }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "AI 暂时没有响应，请稍后重试");
  return String(result.text || "AI 未返回内容");
}

function IconLabel({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

const dashboardSnapshotMonth = [...storeDailySalesLedger].map((row) => row.date.slice(0, 7)).sort().at(-1) || "";
const dashboardHistoryMonths = [...new Set(storeDailySalesLedger.map((row) => row.date.slice(0, 7)))].sort();
function dashboardMonthLabel(month: string) {
  return `${month.slice(0, 4)}年${Number(month.slice(5))}月`;
}
function buildDashboardMonth(view: RoleView, month: string) {
  const snapshot = month === dashboardSnapshotMonth;
  const monthName = `${Number(month.slice(5))}月`;
  const groupRows = month.slice(0, 4) === dashboardSnapshotMonth.slice(0, 4) ? groupStoreMonthlyLedger.filter((row) => row.month === monthName) : [];
  const orders = storeMonthlyOrderLedger.filter((order) => order.date.startsWith(`${month}-`));
  const hasData = view === "store" ? orders.length > 0 : groupRows.length > 0;
  const sales = view === "store" ? orders.reduce((sum, order) => sum + order.netAmountYuan, 0) : groupRows.reduce((sum, row) => sum + row.gmvYuan, 0);
  const currentLabel = dashboardMonthLabel(month);
  const missing = (label: string) => ({ label, value: "—", note: "该月暂无历史快照", kind: "plain" });
  const previousMonthSerial = Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 2;
  const previousMonthKey = `${Math.floor(previousMonthSerial / 12)}-${String(previousMonthSerial % 12 + 1).padStart(2, "0")}`;
  const previousMonth = dashboardHistoryMonths.includes(previousMonthKey) ? previousMonthKey : undefined;
  const previousRows = previousMonth ? (view === "store" ? storeMonthlyOrderLedger.filter((order) => order.date.startsWith(`${previousMonth}-`)).map((order) => order.netAmountYuan) : groupStoreMonthlyLedger.filter((row) => row.month === `${Number(previousMonth.slice(5))}月`).map((row) => row.gmvYuan)) : [];
  const previousSales = previousRows.reduce((sum, value) => sum + value, 0);
  const change = previousSales ? (sales / previousSales - 1) * 100 : undefined;
  const changeNote = change === undefined ? "暂无可比上月数据" : `环比 ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  const money = `¥${(sales / 10000).toLocaleString("zh-CN", { maximumFractionDigits: 1 })}w`;
  const metrics = snapshot ? (view === "store" ? storeMetrics : groupMetrics.slice(0, 4)) : view === "store" ? [
    { label: "所选月销售额", value: money, note: changeNote, kind: change !== undefined && change < 0 ? "focus" : "plain" },
    missing("会员复购率"),
    { label: "所选月订单", value: `${orders.length} 笔`, note: orders.length ? `客单价 ¥${Math.round(sales / orders.length)}` : "暂无记录", kind: "plain" },
    missing("待完成顾客回访"), missing("库存偏低商品"), missing("待更新健康方案"),
  ] : [
    { label: "所选月集团 GMV", value: money, note: changeNote, kind: change !== undefined && change < 0 ? "focus" : "plain" },
    missing("会员复购率"), missing("门店网络规模"), missing("会员总量"),
  ];
  const trend = (view === "store" ? storeTrend : groupTrend).filter((row) => {
    const rowMonth = `${dashboardSnapshotMonth.slice(0, 4)}-${String(parseInt(row.label)).padStart(2, "0")}`;
    return rowMonth <= month;
  }).slice(-6);
  return { month, label: currentLabel, snapshot, hasData, sales, orderCount: orders.length, metrics, trend: hasData ? trend : [], changeNote, channelMetrics: snapshot ? groupMetrics.slice(4, 6) : [missing("招商目标达成"), missing("代理团队活跃率")] };
}

function MetricTile({ item }: { item: (typeof storeMetrics)[number] | (typeof groupMetrics)[number] }) {
  return (
    <div className="metric-tile">
      <span className="metric-label">{item.label}</span>
      <strong>{item.value}</strong>
      {item.note && <span className={`metric-note ${item.kind}`}>{item.note}</span>}
    </div>
  );
}

function StoreCustomerSummary() {
  return <div className="store-customer-summary">{storeCustomerSummary.map((item) => <div className="store-customer-stat" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>;
}

function TrendChart({ items, unit, periodLabel = "本月" }: { items: typeof groupTrend; unit: string; periodLabel?: string }) {
  const min = Math.min(...items.map((item) => item.value));
  const max = Math.max(...items.map((item) => item.value));
  const points = items.map((item, index) => {
    const x = 18 + index * 51;
    const y = 68 - ((item.value - min) / (max - min || 1)) * 43;
    return { ...item, x, y };
  });
  return <div className="trend-wrap"><div className="trend-unit">{unit}</div><svg className="trend-chart" viewBox="0 0 288 94" role="img" aria-label={`${periodLabel}${unit}趋势图`}>
    {[25, 46, 67].map((y) => <line key={y} x1="12" y1={y} x2="276" y2={y} className="chart-gridline" />)}
    <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} className="chart-line" />
    {points.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="3.2" className="chart-dot" /><text x={point.x} y="88" textAnchor="middle" className="chart-label">{point.label}</text></g>)}
  </svg><div className="trend-endpoint">{periodLabel} <strong>¥{items.at(-1)?.value.toLocaleString("zh-CN")}w</strong></div></div>;
}

function SectionHeading({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div className="section-title"><span className="section-icon">{icon}</span><h2>{title}</h2></div>
      {action}
    </div>
  );
}

function StatusPill({ children, tone = "good" }: { children: ReactNode; tone?: string }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function ProductThumb({ productType, name }: { productType: string; name: string }) {
  const panel = productType === "sesame" ? "sesame" : productType === "porridge" ? "porridge" : "grain";
  return <div className={`product-thumb product-thumb-${panel}`} role="img" aria-label={`${name}商品主图`} />;
}

function ProductRankCard({ product }: { product: { label: string; value: string; progress: number; productType: string; spec?: string } }) {
  return <article className="product-rank-card">
    <ProductThumb productType={product.productType} name={product.label} />
    <div className="product-rank-info"><strong>{product.label}</strong><span>{product.spec || "食品组合"}</span></div>
    <div className="product-rank-sales"><strong>{product.value}</strong><span>销售额</span></div>
    <div className="product-rank-progress"><i style={{ width: `${product.progress}%` }} /></div>
  </article>;
}

export default function Prototype() {
  const currentDashboardMonth = todayKey.slice(0, 7);
  const [dashboardMonths, setDashboardMonths] = useState<Record<RoleView, string>>({ store: currentDashboardMonth, group: currentDashboardMonth });
  const [dashboardMonthOpen, setDashboardMonthOpen] = useState(false);
  const [marketMode, setMarketMode] = useState<"teams" | "partners">("teams");
  const [teamReturnScreen, setTeamReturnScreen] = useState<"market" | "workbench" | "home" | "team">("market");
  const [teamReturnMode, setTeamReturnMode] = useState<"teams" | "partners">("teams");
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamDetailTab, setTeamDetailTab] = useState<"overview" | "performance" | "execution" | "settlement" | "partners">("overview");
  const [memberReturnScreen, setMemberReturnScreen] = useState<"team-detail" | "team" | "market">("team");
  const selectedTeam = managedTeams.find((team) => team.id === selectedTeamId);
  const priorityTeamFollowups = getPriorityTeamFollowups(managedTeams);
  const visibleTeams = managedTeams.filter((team) => `${team.name} ${team.leader} ${team.memberNames.join(" ")}`.includes(teamSearch.trim()));
  const openTeam = (id: string) => { keyboard.hide(); if (screen !== "member-detail" || memberReturnScreen === "market") { setTeamReturnMode(marketMode); setTeamReturnScreen(screen === "workbench" || screen === "home" || screen === "team" ? screen : "market"); } setSelectedTeamId(id); setTeamDetailTab("overview"); setScreen("team-detail"); };
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerTrail, setPartnerTrail] = useState<string[]>([]);
  const [partnerDetailTab, setPartnerDetailTab] = useState<"profile" | "operation" | "supply" | "followup">("profile");
  const [partnerFollowupKind, setPartnerFollowupKind] = useState("经营回访");
  const [partnerHandled, setPartnerHandled] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem("group-partner-handled-v1") || "[]"); return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []; } catch { return []; }
  });
  const selectedPartner = marketPartners.find((item) => item.id === partnerTrail.at(-1));
  const selectedStoreSupply = selectedPartner?.kind === "store" ? storeSupplies[selectedPartner.id] : undefined;
  const visiblePartners = marketPartners.filter((item) => item.kind === "store" && `${item.title} ${item.contact} ${item.region} ${marketPartners.find((parent) => parent.id === item.parentId)?.title || ""}`.includes(partnerSearch.trim()));
  const openPartner = (id: string, nested = false, detailTab: "profile" | "operation" | "supply" | "followup" = "profile") => { keyboard.hide(); setMarketDetail(null); setMarketFollowupDraft(""); setPartnerDetailTab(detailTab); setPartnerTrail((trail) => nested ? [...trail, id] : [id]); };

  const [marketDetail, setMarketDetail] = useState<MarketRecord | null>(null);
  const [marketFollowups, setMarketFollowups] = useState<Record<string, string[]>>(() => {
    try { const saved = JSON.parse(localStorage.getItem("group-market-followups-v1") || "{}"); return Object.fromEntries(Object.entries(saved || {}).map(([key, value]) => [key, Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : typeof value === "string" ? [value] : []])); } catch { return {}; }
  });
  const [marketFollowupDraft, setMarketFollowupDraft] = useState("");
  const openMarketDetail = (record: MarketRecord) => { keyboard.hide(); setMarketFollowupDraft(""); setMarketDetail(record); };
  const [screen, setScreen] = useState<Screen>("workbench");
  const [roleView, setRoleView] = useState<RoleView>("store");
  const [selectedCustomerName, setSelectedCustomerName] = useState<keyof typeof customerProfileData>("李阿姨");
  const selectedCustomer = customerProfileData[selectedCustomerName];
  const [todoSnapshots, setTodoSnapshots] = useState<Partial<Record<RoleView, DailyTodoSnapshot>>>(loadDailyTodoSnapshots);
  const [todoConfirmed, setTodoConfirmed] = useState(() => getTodayTodos("store", loadDailyTodoSnapshots()).length > 0);
  const [todoItems, setTodoItems] = useState<DailyTodoItem[]>(() => getTodayTodos("store", loadDailyTodoSnapshots()));
  const [todoStatusTab, setTodoStatusTab] = useState<"pending" | "done">("pending");
  const [businessState, setBusinessState] = useState<AiState>("success");
  const [businessSnapshots, setBusinessSnapshots] = useState<Record<RoleView, BusinessSnapshot>>(loadBusinessSnapshots);
  const [businessAnswer, setBusinessAnswer] = useState(() => loadBusinessSnapshots().store.answer);
  const [businessError, setBusinessError] = useState("");
  const [businessUpdatedAt, setBusinessUpdatedAt] = useState(() => loadBusinessSnapshots().store.updatedAt);
  const [diagnosisSheetOpen, setDiagnosisSheetOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [planHistorySheetOpen, setPlanHistorySheetOpen] = useState(false);
  const [notificationRead, setNotificationRead] = useState(() => localStorage.getItem(notificationReadKey) === "true");
  const [customerFilter, setCustomerFilter] = useState<"all" | "follow-up" | "plans">("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<(typeof teamRows)[number] | null>(null);
  const [memberAiState, setMemberAiState] = useState<AiState>("idle");
  const [memberAnswer, setMemberAnswer] = useState("");
  const [memberAnalysisSnapshots, setMemberAnalysisSnapshots] = useState(loadMemberAnalysisSnapshots);
  const [memberError, setMemberError] = useState("");
  const [memberGoalSaved, setMemberGoalSaved] = useState(false);
  const [selectedStoreEmployee, setSelectedStoreEmployee] = useState<StoreEmployee | null>(null);
  const [storeEmployeeReturnScreen, setStoreEmployeeReturnScreen] = useState<"market" | "workbench">("market");
  const [storeEmployeeAiState, setStoreEmployeeAiState] = useState<AiState>("idle");
  const [storeEmployeeAnswer, setStoreEmployeeAnswer] = useState("");
  const [storeEmployeeError, setStoreEmployeeError] = useState("");
  const [storeEmployeeAnalysisSnapshots, setStoreEmployeeAnalysisSnapshots] = useState(loadStoreEmployeeAnalysisSnapshots);
  const [productFollowupKey, setProductFollowupKey] = useState<ProductFollowupKey>("low-stock");
  const [healthState, setHealthState] = useState<AiState>("idle");
  const [selectedHealthMetric, setSelectedHealthMetric] = useState<HealthMetricKey>("glucose");
  const [selectedLipidMetric, setSelectedLipidMetric] = useState<LipidMetricKey>("glucose");
  const [healthAnswer, setHealthAnswer] = useState("");
  const [singleHealthPlanSnapshots, setSingleHealthPlanSnapshots] = useState(loadSingleHealthPlanSnapshots);
  const [healthError, setHealthError] = useState("");
  const [pushedCustomers, setPushedCustomers] = useState<string[]>([]);
  const [batchState, setBatchState] = useState<AiState>("success");
  const [batchPlans, setBatchPlans] = useState<BatchPlan[]>(loadBatchPlanSnapshots);
  const [batchGeneratedAt, setBatchGeneratedAt] = useState(loadBatchPlanGeneratedAt);
  const [batchError, setBatchError] = useState("");
  const [batchReviewed, setBatchReviewed] = useState<string[]>([]);
  const [batchPushed, setBatchPushed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pushed, setPushed] = useState(false);
  const reportInputRef = useRef<HTMLInputElement>(null);
  const reportRequestId = useRef(0);
  const [reportFileName, setReportFileName] = useState("");
  const [reportState, setReportState] = useState<AiState>("idle");
  const [reportAnswer, setReportAnswer] = useState("");
  const [customerReportNotes, setCustomerReportNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("health-report-notes-v1") || "{}");
      return Object.fromEntries(Object.entries(saved || {}).filter(([name, note]) => name in customerProfileData && typeof note === "string")) as Record<string, string>;
    } catch { return {}; }
  });
  const [reportError, setReportError] = useState("");
  const [reportQuestion, setReportQuestion] = useState("");
  const [toast, setToast] = useState("");
  const businessRequestId = useRef(0);
  const keyboard = useKeyboard();
  const currentDiagnosisVersion = businessSnapshots[roleView]?.version || businessSnapshots[roleView]?.updatedAt;
  const diagnosisPreview = businessAnswer.replace(/\s+/g, " ").trim();
  const previousTodoSnapshot = todoSnapshots[roleView];
  const carryOverDrafts: DailyTodoItem[] = previousTodoSnapshot?.date !== todayKey
    ? (previousTodoSnapshot?.items || []).filter((item) => !item.done).map((item) => ({ ...item, carried: true }))
    : [];
  const freshDrafts: DailyTodoItem[] = extractBusinessActions(businessAnswer).map((text) => ({ text, done: false, carried: false }));
  const draftKeys = new Set<string>();
  const dailyTodoDrafts = [...carryOverDrafts, ...freshDrafts].filter((item) => {
    const key = item.text.toLocaleLowerCase().replace(/\s+/g, "");
    if (draftKeys.has(key)) return false;
    draftKeys.add(key);
    return true;
  });
  const visibleTodoDrafts = dailyTodoDrafts.slice(0, 3);
  const draftCarryOverCount = dailyTodoDrafts.filter((item) => item.carried).length;
  const todoDoneCount = todoItems.filter((item) => item.done).length;
  const todoPendingCount = todoItems.length - todoDoneCount;
  const pendingTodoItems = todoItems.map((item, index) => ({ item, index })).filter(({ item }) => !item.done);
  const filteredTodoItems = todoItems.map((item, index) => ({ item, index })).filter(({ item }) => item.done === (todoStatusTab === "done"));
  const visibleTodoItems = pendingTodoItems.slice(0, 3);
  const todoCarryOverCount = todoItems.filter((item) => item.carried && !item.done).length;
  const hasUnreadNotification = roleView === "store" && !notificationRead;
  const visibleCustomers = customerRows.filter((customer) => {
    const searchMatch = `${customer.name} ${customer.age} ${customer.metric} ${customer.note}`.toLocaleLowerCase().includes(customerSearch.trim().toLocaleLowerCase());
    const filterMatch = customerFilter === "all" || (customerFilter === "follow-up" ? customer.needsFollowUp : customer.planNeedsReview);
    return searchMatch && filterMatch;
  });
  const storeCustomerCounts = {
    all: customerRows.length,
    followUp: customerRows.filter((customer) => customer.needsFollowUp).length,
    plans: customerRows.filter((customer) => customer.planNeedsReview).length,
  };
  const selectedBatchPlan = singleHealthPlanSnapshots[selectedCustomer.name] || batchPlans.find((plan) => plan.customer === selectedCustomer.name);
  const selectedPlanDate = singleHealthPlanSnapshots[selectedCustomer.name]?.updatedAt
    ? formatPlanSnapshotDate(singleHealthPlanSnapshots[selectedCustomer.name].updatedAt)
    : batchGeneratedAt;
  const selectedHealthRows = dailyHealthReadings[selectedCustomer.name] || [];
  const activeLipidMetric = lipidMetricOptions.find((metric) => metric.key === selectedLipidMetric) || lipidMetricOptions[0];
  const activeHealthMetric = selectedHealthMetric === "glucose"
    ? { ...healthMetricOptions[0], label: activeLipidMetric.label, unit: activeLipidMetric.unit }
    : healthMetricOptions.find((metric) => metric.key === selectedHealthMetric) || healthMetricOptions[0];
  const selectedHealthValues = selectedHealthRows.map((reading) => selectedHealthMetric === "glucose" ? getLipidMetricValue(reading, selectedLipidMetric) : getHealthMetricValue(reading, selectedHealthMetric));
  const healthLatestReading = selectedHealthRows.at(-1);
  const healthMetricMin = Math.min(...selectedHealthValues);
  const healthMetricMax = Math.max(...selectedHealthValues);
  const healthMetricAverage = selectedHealthValues.reduce((sum, value) => sum + value, 0) / Math.max(1, selectedHealthValues.length);
  const healthMetricDelta = (selectedHealthValues.at(-1) || 0) - (selectedHealthValues[0] || 0);
  const formatHealthNumber = (value: number) => selectedHealthMetric === "pressure" ? `${Math.round(value)}` : value.toFixed(1);
  const healthMetricChangeText = Math.abs(healthMetricDelta) < (selectedHealthMetric === "pressure" ? 1 : 0.05)
    ? "较首日变化不大"
    : `较首日${healthMetricDelta > 0 ? "上升" : "下降"} ${formatHealthNumber(Math.abs(healthMetricDelta))} ${activeHealthMetric.unit}`;
  const currentPlanStatus = selectedCustomer.name === "张姐"
    ? { label: "待同步数据", tone: "watch" }
    : batchPushed || pushedCustomers.includes(selectedCustomer.name)
      ? { label: "已推送", tone: "good" }
      : batchReviewed.includes(selectedCustomer.name)
        ? { label: "已核对待推送", tone: "watch" }
        : { label: "待核对", tone: "watch" };
  const planHistoryRows = [
    { title: "本轮调理食谱", date: selectedPlanDate, status: currentPlanStatus.label, tone: currentPlanStatus.tone, detail: selectedBatchPlan?.focus || "等待生成本轮方案。" },
    { title: "上一轮调理食谱", date: `${cycleDateLabel(-4)} 09:00`, status: "已推送", tone: "good", detail: "已推送至顾客端，可按本轮记录继续跟进。" },
    { title: "上上轮调理食谱", date: `${cycleDateLabel(-7)} 09:00`, status: "已推送", tone: "good", detail: "本轮方案已完成推送。" },
  ];

  const tab = screen === "workbench" || screen === "todos" || (screen === "store-employee-detail" && storeEmployeeReturnScreen === "workbench") ? "workbench" : screen === "customers" || screen === "customer-detail" || screen === "health-report" || screen === "health-plan" || screen === "batch-plan"
    ? "customers"
    : screen === "market" || screen === "team" || screen === "team-detail" || (screen === "member-detail" && roleView === "group") || (screen === "store-employee-detail" && storeEmployeeReturnScreen === "market") ? "market" : screen === "mine" ? "mine" : "home";

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2300);
  };

  const openCustomerQueue = (filter: "follow-up" | "plans") => {
    keyboard.hide();
    setCustomerSearch("");
    setCustomerFilter(filter);
    setScreen("customers");
  };

  const openTodos = () => { keyboard.hide(); setScreen("todos"); };

  const openProductFollowup = (key: ProductFollowupKey) => {
    setProductFollowupKey(key);
    setScreen("product-followup");
  };

  const openNotifications = () => {
    if (hasUnreadNotification) {
      setNotificationRead(true);
      localStorage.setItem(notificationReadKey, "true");
    }
    setNotificationSheetOpen(true);
  };

  const generateBusiness = async () => {
    const requestId = ++businessRequestId.current;
    setBusinessState("loading");
    setBusinessError("");
    try {
      const text = await requestAi("business", {
        dataAsOf: yesterday.toISOString().slice(0, 10),
        reportingPeriod: "T-1，经营数据截至昨日",
        view: roleView === "store" ? "门店经营" : "品牌集团",
        sourceFacts: roleView === "store" ? storeBusinessSourceForAi : {
          ...groupBusinessSourceForAi,
          dataDefinitions: {
            recruitmentUnits: "区域线索/有效洽谈按线索条数，签约代理按代理数，新店开业按门店数；没有提供同批代理到门店的转换关系",
            groupScope: "集团汇总；GMV 的业务含义沿用原字段，未确认是总部出货还是终端零售",
            teamScope: "当前接入团队及成员的零售净额，不代表集团全部团队",
            partnerScope: "重点门店/经销商下钻样本，不代表集团全部门店",
            procurementScope: "门店已收货扣除已确认退货，待收货独立展示，与零售净额分开",
            missingFields: ["集团出货额", "回款", "利润", "现金流", "库存积压金额"],
          },
          storeProcurement: marketPartners.filter((partner) => partner.kind === "store" && storeSupplies[partner.id]).map((partner) => ({ storeId: partner.id, storeName: partner.title, supplierId: storeSupplies[partner.id].supplierId, ...getStoreSupplyStats(storeSupplies[partner.id]), reorderDays: storeSupplies[partner.id].reorderDays, turnoverDays: storeSupplies[partner.id].turnoverDays, products: storeSupplies[partner.id].products, pending: storeSupplies[partner.id].pending })),
          teamMembers: teamRows,
          teams: managedTeams.map((team) => ({ id: team.id, name: team.name, leader: team.leader, memberNames: team.memberNames, targetYuan: team.target, currentFacts: getTeamStats(team), tasks: team.tasks, settlement: team.settlement })),
          partnerHierarchy: marketPartners.map((partner) => ({ id: partner.id, kind: partner.kind, region: partner.region, parentId: partner.parentId, operatingFacts: partner.metrics, issue: partner.issue })),
          priorityStoreDetails: storeRows,
        },
        metrics: roleView === "store" ? storeMetrics : groupMetrics,
        dimensions: roleView === "group" ? cockpitDimensions : undefined,
        trend: roleView === "store" ? storeTrend : groupTrend,
        customerSummary: roleView === "store" ? storeCustomerSummary : undefined,
        customerService: roleView === "store" ? storeCustomerService : undefined,
        recruitmentFunnel: roleView === "group" ? groupRecruitmentFunnel : undefined,
        storeHealthDistribution: roleView === "group" ? groupStoreHealth : undefined,
        team: roleView === "group" ? teamRows : undefined,
        products: roleView === "store" ? storeProductRankRows : productRankRows,
        storeFollowUp: roleView === "store" ? { lowStockProducts: storeProductFollowups["low-stock"].rows.length, slowMovingProducts: storeProductFollowups["slow-moving"].rows.length, customersWithPlanDue: rawStoreSource.healthService.plansDue, customersAwaitingDataCompletion: rawStoreSource.healthService.customersAwaitingDeviceData } : undefined,
        stores: roleView === "group" ? storeRows : undefined,
        alerts: roleView === "store" ? ["会员复购率低于门店目标", "2 款商品库存偏低", "12 位顾客方案待更新"] : ["部分区域门店经营承压", "会员复购率低于集团目标", "招商达成低于目标"],
      });
      if (requestId !== businessRequestId.current) return;
      setBusinessAnswer(text);
      const snapshot = {
        answer: text,
        updatedAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        version: `${Date.now()}`,
        datasetVersion: roleView === "store" ? storeDemoDatasetVersion : groupDemoDatasetVersion,
      };
      const nextSnapshots = { ...businessSnapshots, [roleView]: snapshot };
      setBusinessSnapshots(nextSnapshots);
      localStorage.setItem(businessSnapshotKey, JSON.stringify(nextSnapshots));
      setBusinessUpdatedAt(snapshot.updatedAt);
      setBusinessState("success");
      const existingToday = todoSnapshots[roleView];
      if (todoConfirmed && existingToday?.date === todayKey) {
        const completedItems = existingToday.items.filter((item) => item.done);
        const refreshedItems = extractBusinessActions(text).slice(0, 5).map((action) => ({ text: action, done: false, carried: false }));
        if (refreshedItems.length) {
          const seen = new Set<string>();
          const mergedItems = [...completedItems, ...refreshedItems].filter((item) => {
            const key = item.text.toLocaleLowerCase().replace(/\s+/g, "");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const todoSnapshot = { date: todayKey, items: mergedItems, diagnosisVersion: snapshot.version };
          const nextTodos = { ...todoSnapshots, [roleView]: todoSnapshot };
          setTodoSnapshots(nextTodos);
          setTodoItems(mergedItems);
          localStorage.setItem(dailyTodoSnapshotKey, JSON.stringify(nextTodos));
          announce(`诊断与待办已同步，保留 ${completedItems.length} 项已完成`);
        } else {
          announce("诊断已更新，未提取到新的行动项，现有待办已保留");
        }
      }
    } catch (error) {
      if (requestId !== businessRequestId.current) return;
      setBusinessError(error instanceof Error ? error.message : "AI 请求失败");
      setBusinessState("error");
    }
  };

  const generateHealthPlan = async () => {
    setHealthState("loading");
    setHealthError("");
    setPushed(false);
    setEditing(false);
    try {
      const text = await requestAi("health", {
        customer: selectedCustomer,
        reportDietContext: customerReportNotes[selectedCustomer.name] || "未提供已核验的体检报告解读",
        readings: selectedCustomer.readings,
        cadence: "每 3 天生成一轮调理食谱",
        source: "健康设备采集数据，指标结构参考中健科汇 APP",
      });
      setHealthAnswer(text);
      setDraft(text);
      const snapshot = { customer: selectedCustomer.name, focus: "AI 已结合当前健康数据生成，待服务人员核对。", content: text, datasetVersion: storeDemoDatasetVersion, updatedAt: new Date().toISOString() };
      const nextSnapshots = { ...singleHealthPlanSnapshots, [selectedCustomer.name]: snapshot };
      setSingleHealthPlanSnapshots(nextSnapshots);
      localStorage.setItem(singleHealthPlanSnapshotKey, JSON.stringify(nextSnapshots));
      setHealthState("success");
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : "AI 请求失败");
      setHealthState("error");
    }
  };

  const openBatchPlans = () => {
    setScreen("batch-plan");
  };

  const generateBatchPlans = async () => {
    setBatchState("loading");
    setBatchError("");
    setBatchPushed(false);
    setBatchReviewed([]);
    try {
      const text = await requestAi("health-batch", {
        customers: batchHealthCustomers.map(customer => ({ ...customer, reportDietContext: customerReportNotes[customer.customer] || "未提供已核验的体检报告解读" })),
        cadence: "健康数据有更新时生成管理建议；调理食谱每 3 天更新一轮",
      });
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      if (start < 0 || end <= start) throw new Error("AI 返回格式不完整，请重试生成");
      const parsed = JSON.parse(text.slice(start, end + 1)) as BatchPlan[];
      const plans = batchHealthCustomers.map((customer) => {
        const plan = parsed.find((item) => item.customer === customer.customer);
        if (!plan || !plan.focus || !plan.content) throw new Error(`${customer.customer} 的方案未完整返回，请重试生成`);
        return plan;
      });
      const generatedAt = new Date().toISOString();
      setBatchPlans(plans);
      setBatchGeneratedAt(formatPlanSnapshotDate(generatedAt));
      localStorage.setItem(batchPlanSnapshotKey, JSON.stringify({ datasetVersion: storeDemoDatasetVersion, generatedAt, plans }));
      setBatchState("success");
    } catch (error) {
      setBatchError(error instanceof Error ? error.message : "AI 批量生成失败");
      setBatchState("error");
    }
  };

  const updateBatchPlan = (customer: string, content: string) => {
    const updated = batchPlans.map((item) => item.customer === customer ? { ...item, content } : item);
    setBatchPlans(updated);
    localStorage.setItem(batchPlanSnapshotKey, JSON.stringify({ datasetVersion: storeDemoDatasetVersion, generatedAt: new Date().toISOString(), plans: updated }));
    setBatchReviewed((items) => items.filter((name) => name !== customer));
    setBatchPushed(false);
  };

  const saveHealthPlanContent = (customer: string, content: string) => {
    const current = singleHealthPlanSnapshots[customer];
    if (current) {
      const nextSnapshots = { ...singleHealthPlanSnapshots, [customer]: { ...current, content, updatedAt: new Date().toISOString() } };
      setSingleHealthPlanSnapshots(nextSnapshots);
      localStorage.setItem(singleHealthPlanSnapshotKey, JSON.stringify(nextSnapshots));
      return;
    }
    if (batchPlans.some((plan) => plan.customer === customer)) updateBatchPlan(customer, content);
  };

  const saveSingleHealthPlan = (customer: string, content: string) => {
    const current = singleHealthPlanSnapshots[customer];
    if (!current) return;
    const nextSnapshots = { ...singleHealthPlanSnapshots, [customer]: { ...current, content, updatedAt: new Date().toISOString() } };
    setSingleHealthPlanSnapshots(nextSnapshots);
    localStorage.setItem(singleHealthPlanSnapshotKey, JSON.stringify(nextSnapshots));
  };

  const toggleBatchReview = (customer: string) => {
    setBatchReviewed((items) => items.includes(customer) ? items.filter((name) => name !== customer) : [...items, customer]);
  };

  const pushBatchPlans = () => {
    setBatchPushed(true);
    setPushedCustomers((customers) => [...new Set([...customers, ...batchPlans.map((plan) => plan.customer)])]);
    announce(`${batchPlans.length} 位顾客方案已推送`);
  };

  const openMember = (member: (typeof teamRows)[number], fromTeam = false, fromDirectory = false) => {
    keyboard.hide();
    setMemberReturnScreen(fromDirectory ? "market" : fromTeam ? "team-detail" : "team");
    const owningTeam = managedTeams.find((team) => team.memberNames.includes(member.name));
    setSelectedMember({ ...member, activeTeam: owningTeam ? `${getTeamStats(owningTeam).active} 人` : member.activeTeam });
    const savedAnalysis = memberAnalysisSnapshots[member.name];
    setMemberAiState(savedAnalysis ? "success" : "idle");
    setMemberAnswer(savedAnalysis?.answer || "");
    setMemberError("");
    setMemberGoalSaved(false);
    setScreen("member-detail");
  };

  const openStoreEmployee = (employee: StoreEmployee, from: "market" | "workbench") => {
    keyboard.hide();
    setStoreEmployeeReturnScreen(from);
    setSelectedStoreEmployee(employee);
    const saved = storeEmployeeAnalysisSnapshots[employee.id];
    setStoreEmployeeAiState(saved ? "success" : "idle");
    setStoreEmployeeAnswer(saved?.answer || "");
    setStoreEmployeeError("");
    setMemberGoalSaved(false);
    setScreen("store-employee-detail");
  };

  const generateStoreEmployeeAnalysis = async () => {
    if (!selectedStoreEmployee) return;
    setStoreEmployeeAiState("loading");
    setStoreEmployeeError("");
    setMemberGoalSaved(false);
    try {
      const text = await requestAi("business", {
        view: "门店员工经营分析",
        employee: selectedStoreEmployee,
        store: { id: "store-hz", name: "杭州延安店", team: storeEmployeeTeamSummary },
        dimensions: ["业绩目标", "订单与顾客", "会员复购", "顾客回访", "健康方案跟进"],
      });
      setStoreEmployeeAnswer(text);
      setStoreEmployeeAiState("success");
      const snapshot = { answer: text, datasetVersion: storeDemoDatasetVersion, updatedAt: new Date().toISOString() };
      const next = { ...storeEmployeeAnalysisSnapshots, [selectedStoreEmployee.id]: snapshot };
      setStoreEmployeeAnalysisSnapshots(next);
      localStorage.setItem(storeEmployeeAnalysisSnapshotKey, JSON.stringify(next));
    } catch (error) {
      setStoreEmployeeError(error instanceof Error ? error.message : "AI 请求失败");
      setStoreEmployeeAiState("error");
    }
  };

  const generateMemberAnalysis = async () => {
    if (!selectedMember) return;
    setMemberAiState("loading");
    setMemberError("");
    setMemberGoalSaved(false);
    try {
      const text = await requestAi("business", {
        view: "单个代理经营复盘",
        member: selectedMember,
        dimensions: ["业绩达成", "订单与新增客户", "客户复购", "健康方案推送", "团队活跃"],
      });
      setMemberAnswer(text);
      setMemberAiState("success");
      const snapshot = { answer: text, datasetVersion: groupDemoDatasetVersion, updatedAt: new Date().toISOString() };
      const nextSnapshots = { ...memberAnalysisSnapshots, [selectedMember.name]: snapshot };
      setMemberAnalysisSnapshots(nextSnapshots);
      localStorage.setItem(memberAnalysisSnapshotKey, JSON.stringify(nextSnapshots));
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "AI 请求失败");
      setMemberAiState("error");
    }
  };

  const changeRoleView = (view: RoleView) => {
    if (view === roleView) return;
    businessRequestId.current += 1;
    setRoleView(view);
    const viewTodos = getTodayTodos(view, todoSnapshots);
    setTodoConfirmed(viewTodos.length > 0);
    setTodoItems(viewTodos);
    setBusinessState("success");
    setBusinessAnswer(businessSnapshots[view].answer);
    setBusinessError("");
    setBusinessUpdatedAt(businessSnapshots[view].updatedAt);
  };

  const confirmBusinessTodos = () => {
    if (!dailyTodoDrafts.length) return;
    const dailyItems = dailyTodoDrafts;
    const snapshot = { date: todayKey, items: dailyItems, diagnosisVersion: currentDiagnosisVersion };
    const nextSnapshots = { ...todoSnapshots, [roleView]: snapshot };
    setTodoSnapshots(nextSnapshots);
    localStorage.setItem(dailyTodoSnapshotKey, JSON.stringify(nextSnapshots));
    setTodoItems(dailyItems);
    setTodoConfirmed(true);
  };

  const toggleTodo = (index: number) => {
    const updated = todoItems.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item);
    const snapshot = { date: todayKey, items: updated, diagnosisVersion: currentDiagnosisVersion };
    const nextSnapshots = { ...todoSnapshots, [roleView]: snapshot };
    setTodoItems(updated);
    setTodoSnapshots(nextSnapshots);
    localStorage.setItem(dailyTodoSnapshotKey, JSON.stringify(nextSnapshots));
  };

  const openPlan = () => {
    const scheduledPlan = singleHealthPlanSnapshots[selectedCustomer.name] || batchPlans.find((plan) => plan.customer === selectedCustomer.name);
    setHealthState(scheduledPlan ? "success" : "idle");
    setHealthAnswer(scheduledPlan?.content || "");
    setDraft(scheduledPlan?.content || "");
    setPushed(batchPushed || pushedCustomers.includes(selectedCustomer.name));
    setEditing(false);
    setHealthError("");
    setScreen("health-plan");
  };

  useEffect(() => {
    try { localStorage.setItem("health-report-notes-v1", JSON.stringify(customerReportNotes)); } catch { /* Keep current-session notes if local storage is unavailable. */ }
  }, [customerReportNotes]);

  useEffect(() => {
    reportRequestId.current += 1;
    const saved = customerReportNotes[selectedCustomerName];
    setReportAnswer(saved || ""); setReportQuestion(""); setReportFileName(""); setReportError(""); setReportState(saved ? "success" : "idle");
  }, [selectedCustomerName]);

  const analyzeHealthReport = async (file: File) => {
    const requestId = ++reportRequestId.current;
    setReportAnswer("");
    setReportQuestion("");
    if (file.size > 8 * 1024 * 1024) {
      setReportError("报告文件不能超过 8 MB");
      setReportState("error");
      return;
    }
    setReportFileName(file.name);
    setReportState("loading");
    setReportError("");
    setReportAnswer("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("无法读取报告文件"));
        reader.onerror = () => reject(new Error("无法读取报告文件"));
        reader.readAsDataURL(file);
      });
      const answer = await requestAi("health-report", {
        customer: selectedCustomer.name,
        mimeType: file.type,
        fileName: file.name,
        dataUrl,
        readings: selectedCustomer.readings,
        profile: selectedCustomer.profile,
      });
      setCustomerReportNotes(previous => ({ ...previous, [selectedCustomer.name]: answer }));
      if (requestId !== reportRequestId.current) return;
      setReportAnswer(answer);
      setReportState("success");
    } catch (error) {
      if (requestId !== reportRequestId.current) return;
      setReportError(error instanceof Error ? error.message : "报告解析失败，请重试");
      setReportState("error");
    }
  };

  const askReportFollowup = async () => {
    const question = reportQuestion.trim();
    if (!question || !reportAnswer) return;
    const requestId = ++reportRequestId.current;
    setReportState("loading");
    setReportError("");
    try {
      const answer = await requestAi("health-report", { customer: selectedCustomer.name, previousAnalysis: reportAnswer, question });
      if (requestId !== reportRequestId.current) return;
      setReportAnswer((previous) => `${previous}\n\n追问：${question}\n${answer}`);
      setReportQuestion("");
      setReportState("success");
    } catch (error) {
      if (requestId !== reportRequestId.current) return;
      setReportError(error instanceof Error ? error.message : "暂时无法回答，请重试");
      setReportState("success");
    }
  };

  const pushPlan = () => {
    keyboard.hide();
    const finalText = editing ? draft : healthAnswer;
    setHealthAnswer(finalText);
    setDraft(finalText);
    saveHealthPlanContent(selectedCustomer.name, finalText);
    setEditing(false);
    setPushed(true);
    setPushedCustomers((customers) => customers.includes(selectedCustomer.name) ? customers : [...customers, selectedCustomer.name]);
    setBatchReviewed((customers) => customers.includes(selectedCustomer.name) ? customers : [...customers, selectedCustomer.name]);
    announce(`${selectedCustomer.name}方案已推送`);
  };

  const renderTeamDirectory = () => <>
    <div className="customer-search"><MagnifyingGlassIcon /><KeyboardInput aria-label="搜索团队" placeholder="搜索团队名称或负责人" value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} /></div>
    <div className="market-team-list">{visibleTeams.map((team) => { const stats = getTeamStats(team); return <button className="surface market-team-card" key={team.id} onClick={() => openTeam(team.id)}><span className="partner-card-head"><span className="partner-avatar"><GroupIcon /></span><span className="market-row-copy"><strong>{team.name}</strong><span>{team.leader}负责 · {team.memberNames.length} 位成员</span></span><ChevronRightIcon /></span><span className="market-team-figures"><span>本月销售 <b>{formatTeamMoney(stats.sales)}</b></span><span>目标完成 <b>{stats.progress}%</b></span></span><span className="market-team-card-bottom"><span>{stats.active < team.memberNames.length ? `${team.memberNames.length - stats.active} 位成员需激活` : "成员经营正常"}</span><b>查看团队 <ChevronRightIcon /></b></span></button>; })}</div>
    {!visibleTeams.length && <div className="partner-empty"><strong>没有找到团队</strong><p>换个名称搜索试试。</p><button className="text-action" onClick={() => { setTeamSearch(""); }}>显示全部团队</button></div>}
  </>;
  const renderMemberRows = (names: string[], fromTeam = false) => names.map((name) => {
    const member = teamRows.find((item) => item.name === name)!;
    const team = managedTeams.find((item) => item.memberNames.includes(name))!;
    const development = memberDevelopment[name];
    return <button className="market-member-row" key={name} onClick={() => openMember(member, fromTeam, !fromTeam)}><span className="avatar">{name.slice(0, 1)}</span><span className="market-row-copy"><strong>{name}{name === team.leader ? <small className="member-leader-label">负责人</small> : null}</strong><span>{fromTeam ? development.status : team.name}</span><small>{development.active ? `最近成交 ${development.lastOrder}` : "近期未成交，建议联系"}</small></span><span className="market-member-sales"><b>{member.gmv}</b><span>本月销售</span></span><ChevronRightIcon /></button>;
  });
  const isDetail = screen === "todos" || screen === "store-employee-detail" || screen === "customer-detail" || screen === "health-report" || screen === "health-plan" || screen === "batch-plan" || screen === "member-detail" || screen === "team-detail" || screen === "product-followup";
  const selectedProductFollowup = storeProductFollowups[productFollowupKey];
  const title = roleView === "store" ? "门店经营" : "CEO 驾驶舱";
  const selectedDashboardMonth = dashboardMonths[roleView];
  const dashboardPeriod = buildDashboardMonth(roleView, selectedDashboardMonth);
  const dashboardMonthOptions = [...new Set([currentDashboardMonth, ...dashboardHistoryMonths])].filter((month) => month <= currentDashboardMonth).sort().reverse();
  const activeMetrics = dashboardPeriod.metrics;

  return (
    <div className="app-shell">
      <MobileScroll className="app-screen" key={`${screen}-${screen === "market" ? marketMode : screen === "team-detail" ? `${selectedTeamId}-${teamDetailTab}` : ""}`}>
        <main className={`app-content ${isDetail ? "detail-content" : ""}`}>
          {(screen === "home" || screen === "workbench") && (
            <>
              <header className="hero">
                <div className="hero-topline">
                  <span className="brand-lockup"><span className="brand-mark">光</span><span>品牌管理端</span></span>
                  <button className="icon-button light" aria-label={hasUnreadNotification ? "通知，有未读" : "通知"} onClick={openNotifications}><BellIcon />{hasUnreadNotification && <span className="notification-dot" aria-hidden="true" />}</button>
                </div>
                <IconLabel>AI BUSINESS CONSOLE</IconLabel>
                <h1>{screen === "workbench" ? "经营工作台" : title}</h1>
                <p>{roleView === "store" ? "门店营收 · 商品动销 · 会员复购 · 顾客健康服务" : "集团业绩 · 市场增长 · 团队经营 · 产品表现"}</p>
                <div className="hero-control-row">
                  <span className="data-period-pill">{screen === "home" ? dashboardPeriod.label : `经营数据 T-1 · ${yesterdayLabel}`}</span>
                  <div className="view-switch" aria-label="切换看板视角">
                    <button className={roleView === "store" ? "selected" : ""} onClick={() => changeRoleView("store")}>门店视图</button>
                    <button className={roleView === "group" ? "selected" : ""} onClick={() => changeRoleView("group")}>集团视图</button>
                  </div>
                </div>
              </header>

              <div className={`page-stack home-stack ${screen === "workbench" ? "workbench-stack" : ""}`}>
                {screen === "workbench" && <>
                <section className="ai-panel">
                  <div className="ai-panel-top">
                    <div className="ai-heading"><span className="ai-glyph"><MagicWandIcon /></span><div><IconLabel>AI BUSINESS INSIGHT</IconLabel><h2>AI 经营诊断</h2></div></div>
                    <button className="live-pill live-action" onClick={generateBusiness} disabled={businessState === "loading"} aria-label={todoConfirmed ? "重新生成经营诊断并同步未完成待办" : "重新生成经营诊断"}>{businessState === "loading" ? "生成中" : "重新生成"}</button>
                  </div>
                  {businessState === "success" && <button type="button" className="diagnosis-summary-card" onClick={() => setDiagnosisSheetOpen(true)} aria-haspopup="dialog">
                    <p>{diagnosisPreview}</p>
                    <span className="diagnosis-summary-footer"><span className="diagnosis-summary-link">查看全部经营诊断 <ChevronRightIcon /></span><span className="diagnosis-summary-meta">最近生成 · {businessUpdatedAt}</span></span>
                  </button>}
                  {businessState === "error" && <div className="ai-error">{businessError}<span>请确认本地 AI 服务已启动后重试。</span></div>}
                  {businessState === "loading" && <div className="ai-loading"><span className="loading-orb" />AI 正在分析经营数据…</div>}
                  {businessState === "idle" && <div className="ai-empty">暂无经营建议</div>}
                </section>
                {!todoConfirmed && businessState === "success" && <section className="surface todo-draft-preview">
                  <div className="workbench-todo-heading"><span className="section-title"><span className="section-icon"><ActivityLogIcon /></span><h2>待办</h2></span><button className="text-action" onClick={openTodos}>查看全部 <ChevronRightIcon /></button></div>
                  {dailyTodoDrafts.length > 0 && <div className="todo-overview"><span>待确认 <strong>{dailyTodoDrafts.length}</strong> 项</span>{draftCarryOverCount > 0 && <span>上周期延续 <strong>{draftCarryOverCount}</strong> 项</span>}</div>}
                  {visibleTodoDrafts.length ? visibleTodoDrafts.map((item, index) => <div className="todo-draft-row" key={`draft-${index}-${item.text}`}><span className="action-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.text}</strong><span>{item.carried ? "上周期未完成 · 延续跟进" : roleView === "store" ? "建议负责人：门店负责人 · 本周期" : "建议负责人：集团/区域负责人 · 本周期"}</span></div></div>) : <p className="todo-draft-empty">当前诊断没有提取到明确行动建议。</p>}
                </section>}
                {todoConfirmed && <section className="surface action-card">
                  <div className="workbench-todo-heading"><span className="section-title"><span className="section-icon"><ActivityLogIcon /></span><h2>待办</h2></span><button className="text-action" onClick={openTodos}>查看全部 <ChevronRightIcon /></button></div>
                  <div className="todo-overview"><span>未完成 <strong>{todoPendingCount}</strong> 项</span>{todoCarryOverCount > 0 && <span>上周期延续 <strong>{todoCarryOverCount}</strong> 项</span>}</div>
                  {todoCarryOverCount > 0 && <div className="todo-overview"><span>上周期延续 <strong>{todoCarryOverCount}</strong> 项</span></div>}
                  {visibleTodoItems.map(({ item, index: itemIndex }, index) => <div className={`action-item todo-item ${item.done ? "completed" : ""}`} key={`${itemIndex}-${item.text}`}><span className="action-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.text}</strong>{item.carried && <span className="todo-carryover">上周期延续</span>}</div><button type="button" className={`todo-check ${item.done ? "done" : ""}`} aria-label={item.done ? `标记未完成：${item.text}` : `标记完成：${item.text}`} onClick={() => toggleTodo(itemIndex)}><CheckCircledIcon /></button></div>)}
                  {!pendingTodoItems.length && <div className="todo-empty">暂无未完成待办</div>}
                </section>}
                {roleView === "store" && <section className="surface team-focus">
                  <SectionHeading icon={<GroupIcon />} title="门店团队分析" action={<button className="text-action" onClick={() => setScreen("market")}>全部员工 <ChevronRightIcon /></button>} />
                  <p className="team-focus-helper">按员工销售目标、顾客回访和方案跟进识别本期辅导重点。</p>
                  <div className="store-employee-summary"><span>{storeEmployeeTeamSummary.employees} 位员工</span><b>{formatTeamMoney(storeEmployeeTeamSummary.salesYuan)} / {formatTeamMoney(storeEmployeeTeamSummary.targetYuan)}</b><small>销售额 / 目标 · {storeEmployeeTeamSummary.callbacksPending} 项回访待跟进</small></div>
                  {[...storeEmployeeRecords].sort((a, b) => a.salesProgressPercent - b.salesProgressPercent).slice(0, 2).map((employee) => <button type="button" className="team-focus-row" key={employee.id} onClick={() => openStoreEmployee(employee, "workbench")}><span className="avatar">{employee.name.slice(0, 1)}</span><span className="team-focus-copy"><strong>{employee.name}<small>{employee.position}</small></strong><span>{employee.orderCount} 笔订单 · {employee.callbackPending} 项回访待跟进</span></span><span className="team-focus-score"><strong>{employee.salesProgressPercent}%</strong><small>目标完成</small></span><ChevronRightIcon /></button>)}
                </section>}
                {roleView === "group" && <section className="surface team-focus">
                  <SectionHeading icon={<GroupIcon />} title="团队分析与跟进" action={<button className="text-action" onClick={() => { setMarketMode("teams"); setScreen("market"); }}>全部团队 <ChevronRightIcon /></button>} />
                  <p className="team-focus-helper">优先跟进未完成任务的团队，按最近截止日和目标进度排列。</p>
                  {priorityTeamFollowups.map(({ team, stats, followup }) => <button type="button" className="team-followup-card" key={team.id} onClick={() => openTeam(team.id)}>
                    <span className="partner-card-head"><span className="partner-avatar"><GroupIcon /></span><span className="market-row-copy"><strong>{team.name}</strong><span>团队长 {team.leader}</span></span><ChevronRightIcon /></span>
                    <span className="team-followup-issue">{team.issue}</span>
                    <span className="team-followup-evidence"><span>目标完成 <b>{stats.progress}%</b></span><span>活跃成员 <b>{stats.active} / {team.memberNames.length}</b></span></span>
                    <span className="team-followup-progress"><span>{followup.pendingCount ? `${followup.pendingCount} 项未完成${followup.feedbackCount ? ` · ${followup.feedbackCount} 项待反馈` : ""}` : "本轮任务已完成"}</span><span>{followup.nextDeadline ? `最近截止 ${followup.nextDeadline}` : "查看成员经营情况"}</span></span>
                  </button>)}
                  {!priorityTeamFollowups.length && <div className="notification-empty">暂无需要优先跟进的团队，可查看全部团队。</div>}
                </section>}
                </>}

                {screen === "home" && <>
                <button className="dashboard-month-selector" aria-haspopup="dialog" onClick={() => { keyboard.hide(); setDashboardMonthOpen(true); }}><ClockIcon /><span>统计月份</span><strong>{selectedDashboardMonth === currentDashboardMonth ? `本月 · ${dashboardPeriod.label}` : dashboardPeriod.label}</strong><ChevronRightIcon /></button>
                {!dashboardPeriod.hasData ? <section className="surface dashboard-month-empty"><strong>{dashboardPeriod.label}暂无经营记录</strong><p>请选择其他月份查看。</p></section> : <>

                <section className="surface metrics-card">
                  <SectionHeading icon={<DashboardIcon />} title={roleView === "store" ? "数据汇总 · 本店经营" : "集团经营结果"} action={<span className="demo-tag">{selectedDashboardMonth === currentDashboardMonth ? "本月 · 截至昨日" : dashboardPeriod.label}</span>} />
                  <div className="metric-grid">{activeMetrics.map((item) => <MetricTile key={item.label} item={item} />)}</div>
                </section>

                <section className="surface chart-card">
                  <SectionHeading icon={<BarChartIcon />} title={roleView === "store" ? "门店销售趋势" : "集团 GMV 趋势"} action={<span className="demo-tag">{dashboardPeriod.trend[0]?.label}–{dashboardPeriod.trend.at(-1)?.label}</span>} />
                  <div className="chart-highlight"><span>{dashboardPeriod.label}表现</span><strong>{dashboardPeriod.metrics[0].value}</strong><em>{dashboardPeriod.snapshot ? roleView === "store" ? `同比 +${Math.round((rawStoreSource.salesPeriod.netSalesYuan / rawStoreSource.salesPeriod.previousYearSalesYuan - 1) * 100)}%` : groupMetrics[0].note.split(" · ")[0] : dashboardPeriod.changeNote}</em></div>
                  <TrendChart items={dashboardPeriod.trend} unit="¥w" periodLabel={dashboardPeriod.label} />
                </section>

                {roleView === "group" && <>
                  <section className="surface market-section ceo-channel-card"><SectionHeading icon={<GroupIcon />} title="渠道增长与活跃" /><div className="metric-grid">{dashboardPeriod.channelMetrics.map((item) => <MetricTile key={item.label} item={item} />)}</div><div className="ceo-drill-links"><button className="inline-drill" onClick={() => { setMarketMode("teams"); setScreen("market"); }}>{dashboardPeriod.snapshot ? "查看团队经营" : "查看当前团队"} <ChevronRightIcon /></button><button className="inline-drill" onClick={() => { setPartnerSearch(""); setMarketMode("partners"); setScreen("market"); }}>{dashboardPeriod.snapshot ? "查看门店经营" : "查看当前门店"} <ChevronRightIcon /></button></div></section>
                  <section className="surface ranking-card"><SectionHeading icon={<GroupIcon />} title="已接入团队目标排行" action={<button className="text-action" onClick={() => setScreen("team")}>查看团队 <ChevronRightIcon /></button>} />{dashboardPeriod.snapshot ? <div className="rank-list">{[...managedTeams].sort((a, b) => getTeamStats(b).progress - getTeamStats(a).progress).map((team) => { const stats = getTeamStats(team); return <button type="button" className="rank-row ceo-team-rank" key={team.id} onClick={() => openTeam(team.id)}><span>{team.name}</span><div className="rank-track"><i style={{ width: `${Math.min(stats.progress, 100)}%` }} /></div><strong>{stats.progress}%</strong></button>; })}</div> : <p className="dashboard-month-unavailable">该月暂无团队目标及业绩记录</p>}</section>
                  <section className="surface ranking-card group-product-card"><SectionHeading icon={<DashboardIcon />} title="重点商品销售与库存" action={<span className="demo-tag">{selectedDashboardMonth === currentDashboardMonth ? "截至昨日" : dashboardPeriod.label}</span>} />{dashboardPeriod.snapshot ? <><div className="group-product-summary"><div><span>重点商品销售额</span><strong>{formatTeamMoney(groupProductSummary.salesYuan)}</strong></div><div><span>纳管商品</span><strong>{groupProductSummary.catalogCount} 款</strong></div><div><span>库存预警</span><strong>{groupProductSummary.warningCount} 款</strong></div><div><span>动销偏慢</span><strong>{groupProductSummary.slowCount} 款</strong></div></div><div className="product-rank-list">{productRankRows.slice(0, 3).map((product) => <ProductRankCard key={product.label} product={product} />)}</div><p className="dimension-note">销售额、库存和周转依据集团商品台账覆盖的重点商品统计，非全量商品目录。</p></> : <p className="dashboard-month-unavailable">该月暂无商品销售及库存快照</p>}</section>
                </>}

                {roleView === "store" && <section className="surface ranking-card">
                  <SectionHeading icon={<DashboardIcon />} title="本店商品动销排行" action={<button className="text-action" onClick={() => setScreen("home")}>经营数据 <ChevronRightIcon /></button>} />
                  {dashboardPeriod.snapshot ? <div className="product-rank-list">{storeProductRankRows.map((product) => <ProductRankCard key={product.label} product={product} />)}</div> : <p className="dashboard-month-unavailable">该月暂无商品销售明细</p>}
                  {dashboardPeriod.snapshot && <p className="dimension-note">结合本店销售、库存与会员复购情况查看商品表现。</p>}
                </section>}

                {roleView === "store" && dashboardPeriod.snapshot && <section className="surface funnel-card">
                    <SectionHeading icon={<BarChartIcon />} title="顾客经营概况" action={<span className="demo-tag">截至昨日</span>} />
                    <StoreCustomerSummary />
                    <div className="ranking-divider" />
                    <SectionHeading icon={<HeartIcon />} title="顾客健康服务进度" action={<span className="demo-tag">设备绑定 {storeDeviceBoundCustomers} 人</span>} />
                    <div className="stacked-bar">{storeCustomerService.map((item) => <i key={item.label} className={item.tone} style={{ width: `${item.percent}%` }} />)}</div>
                    <div className="health-legend">{storeCustomerService.map((item) => <span key={item.label}><i className={item.tone} />{item.label} <b>{item.count}</b></span>)}</div>
                    <button className="inline-drill" onClick={() => setScreen("customers")}>查看顾客服务 <ChevronRightIcon /></button>
                </section>}
                {roleView === "store" && !dashboardPeriod.snapshot && <section className="surface market-section"><SectionHeading icon={<HeartIcon />} title="顾客经营与健康服务" /><p className="dashboard-month-unavailable">该月暂无会员及服务进度快照</p></section>}

                {roleView === "store" && dashboardPeriod.snapshot && <section className="surface agent-pulse-card">
                  <SectionHeading icon={<DashboardIcon />} title="本店经营跟进" action={<span className="demo-tag">待处理</span>} />
                  <div className="pulse-grid">
                    <button type="button" className="pulse-grid-item" onClick={() => openProductFollowup("low-stock")} aria-label="库存偏低商品 2 款，查看详情"><span>库存偏低商品</span><strong>2 款</strong><ChevronRightIcon /></button>
                    <button type="button" className="pulse-grid-item" onClick={() => openProductFollowup("slow-moving")} aria-label="动销偏慢商品 2 款，查看详情"><span>动销偏慢商品</span><strong>2 款</strong><ChevronRightIcon /></button>
                    <button type="button" className="pulse-grid-item" onClick={() => openCustomerQueue("plans")} aria-label="顾客方案待更新 12 位，查看详情"><span>顾客方案待更新</span><strong>12 位</strong><ChevronRightIcon /></button>
                    <button type="button" className="pulse-grid-item" onClick={() => openCustomerQueue("follow-up")} aria-label="会员回访待完成 18 位，查看详情"><span>会员回访待完成</span><strong>18 位</strong><ChevronRightIcon /></button>
                  </div>
                </section>}


                </>}
                </>}

              </div>
            </>
          )}

          {screen === "todos" && (
            <div className={`page-stack subpage-stack ${!todoConfirmed ? "workbench-stack" : ""}`}>
              <SubpageHeader title="全部待办" subtitle={todoConfirmed ? `${todayKey.slice(5).replace("-", "/")} · 共 ${todoItems.length} 项` : `本期诊断建议 · ${dailyTodoDrafts.length} 项待确认`} onBack={() => setScreen("workbench")} />
              {todoConfirmed ? <section className="surface action-card"><div className="todo-status-tabs" role="tablist" aria-label="待办状态"><button type="button" role="tab" aria-selected={todoStatusTab === "pending"} className={todoStatusTab === "pending" ? "active" : ""} onClick={() => setTodoStatusTab("pending")}><span>未完成 {todoPendingCount}</span></button><button type="button" role="tab" aria-selected={todoStatusTab === "done"} className={todoStatusTab === "done" ? "active" : ""} onClick={() => setTodoStatusTab("done")}><span>已完成 {todoDoneCount}</span></button></div>{todoCarryOverCount > 0 && <div className="todo-overview"><span>上周期延续 <strong>{todoCarryOverCount}</strong> 项</span></div>}{filteredTodoItems.map(({ item, index }, rowIndex) => <div className={`action-item todo-item ${item.done ? "completed" : ""}`} key={`${index}-${item.text}`}><span className="action-index">{String(rowIndex + 1).padStart(2, "0")}</span><div><strong>{item.text}</strong>{item.carried && <span className="todo-carryover">上周期延续</span>}</div><button type="button" className={`todo-check ${item.done ? "done" : ""}`} aria-label={item.done ? `标记未完成：${item.text}` : `标记完成：${item.text}`} onClick={() => toggleTodo(index)}><CheckCircledIcon /></button></div>)}{!filteredTodoItems.length && <div className="todo-empty">暂无{todoStatusTab === "pending" ? "未完成" : "已完成"}待办</div>}</section> : <section className="surface todo-draft-preview"><SectionHeading icon={<ActivityLogIcon />} title="本期诊断行动建议" action={<span className="draft-source-pill">待确认</span>} />{dailyTodoDrafts.map((item, index) => <div className="todo-draft-row" key={`all-draft-${index}-${item.text}`}><span className="action-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.text}</strong><span>{item.carried ? "上周期未完成 · 延续跟进" : roleView === "store" ? "建议负责人：门店负责人 · 本周期" : "建议负责人：集团/区域负责人 · 本周期"}</span></div></div>)}</section>}
            </div>
          )}

          {screen === "product-followup" && (
            <div className="page-stack subpage-stack product-followup-stack">
              <SubpageHeader title={selectedProductFollowup.title} subtitle={selectedProductFollowup.subtitle} onBack={() => setScreen("home")} />
              <section className="surface product-followup-card">
                <SectionHeading icon={<DashboardIcon />} title="商品明细" action={<StatusPill tone={productFollowupKey === "low-stock" ? "risk" : "watch"}>{selectedProductFollowup.status}</StatusPill>} />
                <div className="product-followup-list">
                  {selectedProductFollowup.rows.map((product) => <article className="product-followup-row" key={product.name}>
                    <div className="product-followup-product">
                      <ProductThumb productType={product.productType} name={product.name} />
                      <div className="product-followup-identity"><strong>{product.name}</strong><span>规格：{product.spec}</span><StatusPill tone={productFollowupKey === "low-stock" ? "risk" : "watch"}>{productFollowupKey === "low-stock" ? "库存偏低" : "动销偏慢"}</StatusPill></div>
                    </div>
                    <div className="product-followup-stats">
                      <div><span>当前库存</span><b>{product.inventory}</b></div>
                      <div><span>{productFollowupKey === "low-stock" ? "预警线" : "库存周转"}</span><b>{product.benchmark.replace(/^(预警线 |库存周转 )/, "")}</b></div>
                      <div><span>近 7 日销量</span><b>{product.recent.replace("近 7 日销量 ", "")}</b></div>
                    </div>
                  </article>)}
                </div>
              </section>
            </div>
          )}

          {screen === "customers" && (
            <div className="page-stack subpage-stack">
              <SubpageHeader title="顾客" subtitle={roleView === "group" ? "集团顾客健康服务" : "本店重点服务顾客"} onBack={() => { keyboard.hide(); setScreen("home"); }} />
              <section className="batch-entry">
                <div className="batch-entry-head"><span className="batch-entry-mark"><MagicWandIcon /></span><div className="batch-entry-copy"><strong>本轮调理食谱方案</strong><span>AI 已生成 · 每 3 天更新一轮</span></div><StatusPill tone={batchPushed ? "good" : "watch"}>{batchPushed ? "已推送" : `待核对 ${batchPlans.length - batchReviewed.length} 位`}</StatusPill></div>
                <div className="batch-entry-footer"><span><ClockIcon />下轮更新 {cycleDateLabel(2)}</span><button className="primary-button" onClick={() => { keyboard.hide(); openBatchPlans(); }}><MagicWandIcon />{batchPushed ? "查看本轮详情" : "查看本轮方案"}<ChevronRightIcon /></button></div>
              </section>
              <div className="customer-controls">
                <label className="customer-search"><MagnifyingGlassIcon /><KeyboardInput type="search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") keyboard.hide(); }} placeholder="搜索顾客姓名" aria-label="搜索顾客姓名" /></label>
                <div className="filter-row" role="tablist" aria-label="顾客筛选">
                  <button type="button" role="tab" aria-selected={customerFilter === "all"} className={`filter-chip ${customerFilter === "all" ? "active" : ""}`} onClick={() => { keyboard.hide(); setCustomerFilter("all"); }}>全部 {roleView === "store" ? storeCustomerCounts.all : "20.3w"}</button>
                  <button type="button" role="tab" aria-selected={customerFilter === "follow-up"} className={`filter-chip ${customerFilter === "follow-up" ? "active" : ""}`} onClick={() => { keyboard.hide(); setCustomerFilter("follow-up"); }}>待跟进 {roleView === "store" ? storeCustomerCounts.followUp : "1,286"}</button>
                  <button type="button" role="tab" aria-selected={customerFilter === "plans"} className={`filter-chip ${customerFilter === "plans" ? "active" : ""}`} onClick={() => { keyboard.hide(); setCustomerFilter("plans"); }}>方案更新 {roleView === "store" ? storeCustomerCounts.plans : "384"}</button>
                </div>
              </div>
              <div className="customer-list">
                {visibleCustomers.map((customer, index) => (
                  <button className="customer-card" key={customer.name} onClick={() => { keyboard.hide(); setSelectedCustomerName(customer.name as keyof typeof customerProfileData); setScreen("customer-detail"); }}>
                    <div className="customer-card-top"><span className={`avatar ${index === 0 ? "warm" : ""}`}>{customer.avatar}</span><div className="customer-heading"><strong>{customer.name}</strong><span>{customer.age}</span></div><StatusPill tone={pushedCustomers.includes(customer.name) ? "good" : customer.tone}>{pushedCustomers.includes(customer.name) ? "服务中" : customer.note}</StatusPill></div>
                    <div className="customer-metric"><ActivityLogIcon /><span>{customer.metric}</span></div>
                    <div className="customer-cycle-row"><span>三天食谱周期</span><small>{pushedCustomers.includes(customer.name) ? `本轮已推送 · 下轮更新 ${cycleDateLabel(3)}` : singleHealthPlanSnapshots[customer.name]?.updatedAt ? `方案待核对 · 最近生成 ${formatPlanSnapshotDate(singleHealthPlanSnapshots[customer.name].updatedAt)}` : batchPlans.some((plan) => plan.customer === customer.name) ? `待核对方案 · 最近生成 ${batchGeneratedAt}` : customer.cycleNote}</small><ChevronRightIcon /></div>
                  </button>
                ))}
                {!visibleCustomers.length && <div className="customer-empty"><strong>没有找到匹配的顾客</strong><span>试试其他姓名或健康指标，或清除筛选条件。</span><button type="button" onClick={() => { keyboard.hide(); setCustomerSearch(""); setCustomerFilter("all"); }}>清除筛选</button></div>}
              </div>
            </div>
          )}

          {screen === "customer-detail" && (
            <div className="page-stack subpage-stack">
              <SubpageHeader title={selectedCustomer.name} subtitle={`${selectedCustomer.gender} · ${selectedCustomer.age} 岁 · 服务代理 ${selectedCustomer.service}`} onBack={() => setScreen("customers")} />
              <section className="surface customer-current-recipe">
                <div className="customer-recipe-heading"><SectionHeading icon={<MagicWandIcon />} title="本期调理食谱" action={<StatusPill tone={currentPlanStatus.tone}>{currentPlanStatus.label}</StatusPill>} /></div>
                {selectedBatchPlan ? <div className="customer-recipe-content">{selectedBatchPlan.content}</div> : <p className="customer-recipe-empty">当前暂无生成的调理食谱。</p>}
                <div className="customer-recipe-meta"><ClockIcon />最近生成 {selectedPlanDate}</div>
                <button className="primary-button full" onClick={openPlan}>{currentPlanStatus.label === "待同步数据" ? "查看数据状态" : "编辑并推送本期方案"}<ChevronRightIcon /></button>
                <button className="customer-recipe-history" onClick={() => setPlanHistorySheetOpen(true)}>查看历史调理食谱<ChevronRightIcon /></button>
              </section>
              <section className="surface report-analysis-card">
                <SectionHeading icon={<ActivityLogIcon />} title="体检报告解析" />
                <p className="report-analysis-intro">查看报告结论、重点关注和日常注意事项。</p>
                <button className="outline-button report-upload-button" onClick={() => setScreen("health-report")}>进入报告解析<ChevronRightIcon /></button>
              </section>
              <section className="surface profile-card"><span className="mini-label">饮食偏好与忌口</span><p>{selectedCustomer.profile}</p></section>
              <section className="surface health-analysis-card">
                <SectionHeading icon={<ActivityLogIcon />} title="5 项健康数据" action={<span className="muted-small">数据截至 {selectedHealthRows.at(-1)?.date || selectedCustomer.dataTime}</span>} />
                <div className="health-metric-grid" role="tablist" aria-label="选择健康指标">
                  {healthMetricOptions.map((metric) => {
                    const latest = selectedHealthRows.at(-1);
                    return <button type="button" role="tab" aria-selected={selectedHealthMetric === metric.key} className={`health-metric-tab ${selectedHealthMetric === metric.key ? "active" : ""}`} key={metric.key} onClick={() => setSelectedHealthMetric(metric.key)}><span>{metric.label}</span><strong>{latest ? formatHealthReading(latest, metric.key) : "—"}<small>{metric.unit}</small></strong></button>;
                  })}
                </div>
                {selectedHealthMetric === "glucose" && <div className="lipid-metric-picker" role="tablist" aria-label="选择血糖或血脂指标">{lipidMetricOptions.map((metric) => <button type="button" role="tab" aria-selected={selectedLipidMetric === metric.key} className={selectedLipidMetric === metric.key ? "active" : ""} key={metric.key} onClick={() => setSelectedLipidMetric(metric.key)}>{metric.label}</button>)}</div>}
                <div className="health-metric-detail">
                  <div className="health-metric-summary">
                    <div><span>最新记录</span><strong>{healthLatestReading ? (selectedHealthMetric === "glucose" ? getLipidMetricValue(healthLatestReading, selectedLipidMetric).toFixed(1) : formatHealthReading(healthLatestReading, selectedHealthMetric)) : "—"}<small>{activeHealthMetric.unit}</small></strong><time>{healthLatestReading?.date}</time></div>
                    <div><span>{selectedHealthMetric === "pressure" ? "收缩压均值" : "近 7 日均值"}</span><strong>{formatHealthNumber(healthMetricAverage)}<small>{activeHealthMetric.unit}</small></strong><time>{selectedHealthRows.length} 条记录</time></div>
                    <div><span>{selectedHealthMetric === "pressure" ? "收缩压范围" : "近 7 日范围"}</span><strong>{formatHealthNumber(healthMetricMin)}–{formatHealthNumber(healthMetricMax)}<small>{activeHealthMetric.unit}</small></strong><time>{healthMetricChangeText}</time></div>
                  </div>
                  <div className="health-analysis-note"><strong>趋势解读</strong><p>近 {selectedHealthRows.length} 条{activeHealthMetric.label}记录，{selectedHealthMetric === "pressure" ? "收缩压" : activeHealthMetric.label}均值 {formatHealthNumber(healthMetricAverage)} {activeHealthMetric.unit}，{healthMetricChangeText}。该数据用于日常趋势观察。</p></div>
                  <div className="health-chart-head"><strong>{activeHealthMetric.label}每日变化</strong><span>{selectedHealthMetric === "pressure" ? "趋势按收缩压绘制" : "相对变化 · 近 7 日"}</span></div>
                  <div className="health-daily-chart" role="img" aria-label={`${activeHealthMetric.label}近${selectedHealthRows.length}条记录趋势图`}>
                    {selectedHealthRows.map((reading) => {
                      const value = selectedHealthMetric === "glucose" ? getLipidMetricValue(reading, selectedLipidMetric) : getHealthMetricValue(reading, selectedHealthMetric);
                      const height = 18 + ((value - healthMetricMin) / (healthMetricMax - healthMetricMin || 1)) * 34;
                      return <div className="health-chart-column" key={reading.date}><span className="health-chart-track"><i style={{ height: `${height}px` }} /></span><small>{reading.date.slice(-2)}</small></div>;
                    })}
                  </div>
                  <div className="health-daily-heading"><strong>每日明细</strong><span>{selectedHealthRows.length} 天</span></div>
                  <div className="health-daily-list">
                    {selectedHealthRows.map((reading) => <div className="health-daily-row" key={`daily-${reading.date}`}><time>{reading.date}</time><span>{selectedHealthMetric === "glucose" ? getLipidMetricValue(reading, selectedLipidMetric).toFixed(1) : formatHealthReading(reading, selectedHealthMetric)} <small>{activeHealthMetric.unit}</small>{selectedHealthMetric === "sleep" && <small className="health-deep-sleep">深睡 {reading.deepSleep.toFixed(1)} 小时</small>}</span></div>)}
                  </div>
                </div>
              </section>
            </div>
          )}

          {screen === "health-report" && (
            <div className="page-stack subpage-stack">
              <SubpageHeader title="体检报告解析" subtitle={selectedCustomer.name} onBack={() => setScreen("customer-detail")} />
              <section className="surface report-analysis-card">
                <SectionHeading icon={<ActivityLogIcon />} title="体检报告解析" />
                <p className="report-analysis-intro">上传顾客体检报告，先核验文件类型，通过后给出整体结论和注意事项，饮食相关情况会用于后续食谱核对。</p>
                <input ref={reportInputRef} className="report-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" aria-label="上传体检报告" onChange={(event) => { const file = event.target.files?.[0]; if (file) void analyzeHealthReport(file); event.target.value = ""; }} />
                <button className="outline-button report-upload-button" onClick={() => reportInputRef.current?.click()} disabled={reportState === "loading"}><PlusIcon />{reportFileName || "上传体检报告"}</button>
                {reportState === "loading" && <div className="report-analysis-loading"><span className="loading-orb" /><span>正在核验文件并解析体检报告…</span></div>}
                {reportState === "error" && <p className="report-analysis-error">{reportError}</p>}
                {reportState === "success" && <>
                  {reportError && <p className="report-analysis-error">{reportError}</p>}
                  <div className="report-analysis-result"><strong>AI 解析结果</strong><div>{reportAnswer}</div></div>
                  <div className="report-followup-row"><KeyboardInput value={reportQuestion} onChange={(event) => setReportQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { keyboard.hide(); void askReportFollowup(); } }} placeholder="继续询问报告中的指标" aria-label="继续询问报告中的指标" /><button className="report-send-button" onClick={() => { keyboard.hide(); void askReportFollowup(); }} disabled={!reportQuestion.trim()}>发送</button></div>
                </>}
              </section>
            </div>
          )}

          {screen === "health-plan" && (
            <div className="page-stack subpage-stack plan-stack">
              <SubpageHeader eyebrow="AI HEALTH PLAN" title="健康管理方案" subtitle={`${selectedCustomer.name} · 代理编辑后推送`} onBack={() => setScreen("customer-detail")} />
              <div className="plan-source-row"><span><ActivityLogIcon />近期健康数据</span><span>每 3 天更新食谱</span></div>
              <section className="surface plan-context">
                <div className="context-heading"><strong>本次分析依据</strong><span>已同步资料</span></div>
                <div className="context-pills"><span>血糖 {selectedCustomer.readings.glucose}</span><span>血压 {selectedCustomer.readings.pressure}</span><span>体重 {selectedCustomer.readings.weight}</span><span>睡眠 {selectedCustomer.readings.sleep}</span></div>
                <p>饮食资料：{selectedCustomer.profile}</p>
              </section>
              {healthState === "idle" && (
                <section className="ai-plan-empty"><span className="ai-glyph"><MagicWandIcon /></span><h2>生成一份可持续跟进的方案</h2><p>AI 会结合近期健康指标和顾客饮食资料生成管理建议与三天食谱，服务人员可编辑确认。</p><button className="primary-button full" onClick={generateHealthPlan}><MagicWandIcon />调用 AI 生成方案</button></section>
              )}
              {healthState === "loading" && <section className="ai-plan-loading"><span className="loading-orb" /><strong>AI 正在整理健康数据</strong><p>正在生成方案重点和三天调理食谱…</p></section>}
              {healthState === "error" && <section className="ai-error plan-error">{healthError}<span>方案内容尚未生成，稍后可重试。</span><button className="outline-button" onClick={generateHealthPlan}>重试</button></section>}
              {healthState === "success" && (
                <section className="surface generated-plan">
                  <div className="generated-head"><div><span className="mini-label">AI GENERATED</span><h2>本期健康方案</h2></div><StatusPill tone={pushed ? "good" : "watch"}>{pushed ? "已推送" : "待代理确认"}</StatusPill></div>
                  {!editing ? <div className="generated-text">{healthAnswer}</div> : (
                    <label className="edit-field"><span>编辑方案内容</span><KeyboardTextarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="编辑健康方案" /></label>
                  )}
                  <div className="plan-meta"><span><ClockIcon />食谱周期：每 3 天一轮</span><span>顾客：{selectedCustomer.name}</span></div>
                  <div className="plan-actions">
                    {!editing ? <button className="outline-button" onClick={() => { setDraft(healthAnswer); setEditing(true); setPushed(false); }}>编辑方案</button> : <button className="outline-button" onClick={() => { keyboard.hide(); setEditing(false); setHealthAnswer(draft); saveHealthPlanContent(selectedCustomer.name, draft); announce("修改已保存"); }}>保存修改</button>}
                    <button className="primary-button" onClick={pushPlan}>{pushed ? "再次推送" : "确认并推送"}<ArrowRightIcon /></button>
                  </div>
                  <p className="health-disclaimer">请核对顾客资料后推送；健康管理建议不替代专业诊疗意见。</p>
                </section>
              )}
            </div>
          )}

          {screen === "batch-plan" && (
            <div className="page-stack subpage-stack plan-stack batch-stack">
              <SubpageHeader eyebrow="3-DAY SCHEDULED PLAN" title="本轮调理食谱方案" subtitle={`最近生成 ${batchGeneratedAt} · 下次任务 ${scheduledPlanNextRun}`} onBack={() => setScreen(roleView === "store" ? "workbench" : "customers")} />
              <div className="batch-summary"><span><GroupIcon />每 3 天生成一轮 · 本期 {batchPlans.length} 份</span><StatusPill tone={batchPushed ? "good" : batchReviewed.length === batchPlans.length && batchPlans.length ? "good" : "watch"}>{batchPushed ? "已推送" : `已审核 ${batchReviewed.length}/${batchPlans.length || batchHealthCustomers.length}`}</StatusPill></div>
              {batchState === "loading" && <section className="ai-plan-loading"><span className="loading-orb" /><strong>AI 正在批量分析顾客资料</strong><p>正在逐位核对数据完整度并生成可编辑方案…</p></section>}
              {batchState === "error" && <section className="ai-error plan-error">{batchError}<span>尚未生成可推送的方案，请检查连接后重试。</span><button className="outline-button" onClick={generateBatchPlans}>重试批量生成</button></section>}
              {batchState === "success" && batchPlans.map((plan) => {
                const reviewed = batchReviewed.includes(plan.customer);
                return <section className="surface batch-plan-card" key={plan.customer}>
                  <div className="batch-card-heading"><div><span className="mini-label">AI GENERATED · {batchGeneratedAt}</span><h2>{plan.customer}</h2></div><StatusPill tone={batchPushed || pushedCustomers.includes(plan.customer) ? "good" : reviewed ? "good" : "watch"}>{batchPushed || pushedCustomers.includes(plan.customer) ? "已推送" : reviewed ? "已审核" : "待审核"}</StatusPill></div>
                  <p className="batch-focus">{plan.focus}</p>
                  <label className="edit-field"><span>方案内容 · 可直接调整</span><KeyboardTextarea value={plan.content} onChange={(event) => updateBatchPlan(plan.customer, event.target.value)} aria-label={`编辑${plan.customer}的健康方案`} /></label>
                  <label className="review-check"><input type="checkbox" checked={reviewed} onChange={() => toggleBatchReview(plan.customer)} disabled={batchPushed} /><span>我已核对该顾客数据和方案内容</span></label>
                </section>;
              })}
              {batchState === "success" && <>
                <button className="primary-button full batch-send" onClick={pushBatchPlans} disabled={batchPushed || batchReviewed.length !== batchPlans.length}>{batchPushed ? "已完成批量推送" : `审核全部 ${batchPlans.length} 位并批量推送`}<ArrowRightIcon /></button>
                <p className="health-disclaimer">请逐位核实顾客信息后推送；健康建议不构成医疗诊断或治疗方案。</p>
              </>}
            </div>
          )}

          {screen === "team" && roleView === "group" && (
            <div className="page-stack subpage-stack"><SubpageHeader title="全部团队" subtitle="按团队查看经营、成员与执行情况" onBack={() => setScreen("market")} />
              {renderTeamDirectory()}
            </div>
          )}
          {screen === "team-detail" && roleView === "group" && selectedTeam && (
            <div className="page-stack subpage-stack">
              <SubpageHeader title={teamDetailTab === "overview" ? selectedTeam.name : ({ performance: "团队经营数据", execution: "任务与培训", settlement: "结算明细", partners: "关联门店与经销商" } as const)[teamDetailTab]} subtitle={teamDetailTab === "overview" ? `${selectedTeam.leader}负责 · ${selectedTeam.memberNames.length} 位成员` : selectedTeam.name} onBack={() => { keyboard.hide(); if (teamDetailTab !== "overview") setTeamDetailTab("overview"); else { setMarketMode(teamReturnMode); setScreen(teamReturnScreen); } }} />
              {teamDetailTab === "overview" && <>
                <section className="surface market-team-overview"><div className="market-team-figures"><span>本月销售 <b>{formatTeamMoney(getTeamStats(selectedTeam).sales)}</b></span><span>目标完成 <b>{getTeamStats(selectedTeam).progress}%</b></span></div><button className="inline-drill" onClick={() => setTeamDetailTab("performance")}>查看完整经营数据 <ChevronRightIcon /></button></section>
                <section className="surface market-section"><SectionHeading icon={<PersonIcon />} title="团队成员" action={<span className="partner-result-count">点击成员查看详情</span>} />{renderMemberRows(selectedTeam.memberNames, true)}</section>
                <section className="surface market-section market-team-tools"><SectionHeading icon={<GearIcon />} title="团队管理" /><button className="market-row" onClick={() => setTeamDetailTab("execution")}><span className="section-icon"><ClockIcon /></span><span className="market-row-copy"><strong>任务与培训</strong><span>{selectedTeam.tasks.filter((task) => task.status !== "已完成").length} 项任务待跟进 · 查看成员学习情况</span></span><ChevronRightIcon /></button><button className="market-row" onClick={() => setTeamDetailTab("settlement")}><span className="section-icon"><ActivityLogIcon /></span><span className="market-row-copy"><strong>结算明细</strong><span>查看成员待结算、已结算与异常</span></span><ChevronRightIcon /></button><button className="market-row" onClick={() => setTeamDetailTab("partners")}><span className="section-icon"><HomeIcon /></span><span className="market-row-copy"><strong>关联门店与经销商</strong><span>{selectedTeam.partnerIds.length} 个合作对象</span></span><ChevronRightIcon /></button></section>
              </>}
              {teamDetailTab === "performance" && <>
                <section className="surface market-section"><SectionHeading icon={<BarChartIcon />} title="团队经营表现" /><div className="member-kpi-grid">{[["本月零售净额", formatTeamMoney(getTeamStats(selectedTeam).sales)], ["团队目标达成", `${getTeamStats(selectedTeam).progress}%`], ["归属订单", `${getTeamStats(selectedTeam).orders} 笔`], ["购买客户", `${getTeamStats(selectedTeam).customers} 人`], ["月内复购客户占比", `${getTeamStats(selectedTeam).repurchase}%`], ["活跃成员", `${getTeamStats(selectedTeam).active} / ${selectedTeam.memberNames.length} 人`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="dimension-note">本月零售订单按订单号去重，扣除退款；复购按本月购买两次及以上客户计算。经销商进货额另计。</p></section>
              </>}
              {teamDetailTab === "execution" && <>
                <section className="surface market-section"><SectionHeading icon={<ClockIcon />} title="任务进度" action={<span className="demo-tag">{selectedTeam.tasks.filter((task) => task.status === "已完成").length} / {selectedTeam.tasks.length} 完成</span>} />{selectedTeam.tasks.map((task) => <button className="market-row" key={task.title} onClick={() => openMember(teamRows.find((member) => member.name === task.member)!, true)}><span className="market-row-copy"><strong>{task.title}</strong><span>负责 {task.member} · 截止 {task.deadline}</span></span><StatusPill tone={task.status === "已完成" ? "good" : "watch"}>{task.status}</StatusPill><span className="market-row-destination">查看负责人 <ChevronRightIcon /></span></button>)}</section>
                <section className="surface market-section"><SectionHeading icon={<ActivityLogIcon />} title="学习与培养" />{selectedTeam.memberNames.map((name) => <button className="market-row" key={name} onClick={() => openMember(teamRows.find((member) => member.name === name)!, true)}><span className="market-row-copy"><strong>{name} · {memberDevelopment[name].status}</strong><span>产品与服务学习 {memberDevelopment[name].learned} / {memberDevelopment[name].courses} 项</span></span><ChevronRightIcon /></button>)}</section>
              </>}
              {teamDetailTab === "settlement" && <section className="surface market-section"><SectionHeading icon={<ActivityLogIcon />} title="团队成员结算" /><div className="member-kpi-grid"><div><span>成员待结算合计</span><strong>¥{selectedTeam.settlement.reduce((sum, item) => sum + item.pending, 0).toLocaleString("zh-CN")}</strong></div><div><span>成员已结算合计</span><strong>¥{selectedTeam.settlement.reduce((sum, item) => sum + item.settled, 0).toLocaleString("zh-CN")}</strong></div></div>{selectedTeam.settlement.map((item) => <button className="market-row" key={item.member} onClick={() => openMember(teamRows.find((member) => member.name === item.member)!, true)}><span className="market-row-copy"><strong>{item.member}</strong><span>待结算 ¥{item.pending.toLocaleString("zh-CN")} · 已结算 ¥{item.settled.toLocaleString("zh-CN")}</span><small>{item.issue}</small></span><span className="market-row-destination">查看成员 <ChevronRightIcon /></span></button>)}<p className="dimension-note">按成员汇总结算状态，具体账单与结算规则由合作系统提供。</p></section>}
              {teamDetailTab === "partners" && <>
                <section className="surface market-section"><SectionHeading icon={<HomeIcon />} title="关联门店 / 经销商" />{selectedTeam.partnerIds.map((id) => { const partner = marketPartners.find((item) => item.id === id)!; return <button key={id} className="market-row" onClick={() => openPartner(id)}><span className="market-row-copy"><strong>{partner.title}</strong><span>{partner.kind === "dealer" ? "经销商" : "门店"} · {partner.contact}</span></span><ChevronRightIcon /></button>; })}<p className="dimension-note">关联表示业务服务范围；团队业绩按订单归属汇总，不将整店销售再次计入。</p></section>
              </>}
            </div>
          )}

          {screen === "market" && (
            <div className="page-stack subpage-stack">
              {roleView === "group" ? <header className="market-page-heading"><h1>市场</h1><p>管理团队与门店</p></header> : null}
              {roleView === "store" ? <>
                <header className="market-page-heading"><h1>市场</h1><p>杭州延安店 · 门店代理与员工</p></header>
                <section className="surface market-team-overview"><SectionHeading icon={<GroupIcon />} title="本店团队" action={<span className="demo-tag">T-1</span>} /><div className="group-product-summary"><div><span>代理</span><strong>{storeAgentRoster.length} 位</strong></div><div><span>员工</span><strong>{storeEmployeeRecords.length} 位</strong></div><div><span>本月销售</span><strong>{formatTeamMoney(storeEmployeeTeamSummary.salesYuan)}</strong></div></div></section>
                {storeAgentRoster.map((agent) => <section className="surface market-section store-agent-section" key={agent.id}><SectionHeading icon={<GroupIcon />} title={agent.name} action={<span className="partner-result-count">代理 · {agent.employeeCount} 位员工</span>} /><p className="team-focus-helper">仅展示归属杭州延安店的代理及其员工经营数据。</p>{storeEmployeeRecords.filter((employee) => employee.agentName === agent.name).map((employee) => <button type="button" className="market-member-row" key={employee.id} onClick={() => openStoreEmployee(employee, "market")}><span className="avatar">{employee.name.slice(0, 1)}</span><span className="market-row-copy"><strong>{employee.name}</strong><span>{employee.position} · 订单 {employee.orderCount} 笔</span><small>复购 {employee.repeatRatePercent}% · 回访待跟进 {employee.callbackPending} 项</small></span><span className="market-member-sales"><b>{formatTeamMoney(employee.salesYuan)}</b><span>本月销售 · 目标 {employee.salesProgressPercent}%</span></span><ChevronRightIcon /></button>)}</section>)}
              </> : <>
                <div className="partner-type-tabs market-mode-tabs" role="tablist" aria-label="市场管理对象"><button role="tab" aria-selected={marketMode === "teams"} onClick={() => { keyboard.hide(); setMarketMode("teams"); }}>团队 <span>{managedTeams.length}</span></button><button role="tab" aria-selected={marketMode === "partners"} onClick={() => { keyboard.hide(); setPartnerSearch(""); setMarketMode("partners"); }}>门店 <span>{marketPartners.filter((item) => item.kind === "store").length}</span></button></div>
                {marketMode === "teams" ? renderTeamDirectory() : <>
                <div className="customer-search"><MagnifyingGlassIcon /><KeyboardInput aria-label="搜索门店或经销商" placeholder="搜索名称、联系人、所属经销商" value={partnerSearch} onChange={(event) => setPartnerSearch(event.target.value)} /></div>
                <section className="surface market-section">
                  <SectionHeading icon={<GroupIcon />} title="门店列表" action={<span className="partner-result-count">{visiblePartners.length} 个对象</span>} />
                  {visiblePartners.map((item) => <button className="partner-card" key={item.id} onClick={() => openPartner(item.id)}>
                    <span className="partner-card-head"><span className="partner-avatar">{item.kind === "dealer" ? <GroupIcon /> : <HomeIcon />}</span><span className="market-row-copy"><strong>{item.title}</strong><span>{item.kind === "dealer" ? "经销商" : "门店"} · {item.region} · {item.contact}</span></span><ChevronRightIcon /></span>
                    <span className="partner-relationship">{item.parentId ? `所属经销商：${marketPartners.find((parent) => parent.id === item.parentId)?.title}` : `集团直接管理 · 下属 ${marketPartners.filter((child) => child.parentId === item.id).length} 家门店`}</span>
                    <span className="partner-card-metrics">{item.metrics.slice(0, 3).map(([label, value]) => <span key={label}><small>{label}</small><b>{value}</b></span>)}</span>
                    {item.kind === "store" && storeSupplies[item.id] && <span className="store-purchase-preview"><span>本月进货额 <b>{supplyMoney(getStoreSupplyStats(storeSupplies[item.id]).amount)}</b></span><span>最近进货 <b>{getStoreSupplyStats(storeSupplies[item.id]).lastReceivedAt}</b></span></span>}
                    <span className="partner-card-foot"><StatusPill tone={partnerAlerts[item.id] ? "watch" : "good"}>{partnerAlerts[item.id] || item.status}</StatusPill><span>{partnerAlerts[item.id] ? partnerHandled.includes(item.id) ? "本轮跟进已完成" : "待跟进" : "日常维护"} <ChevronRightIcon /></span></span>
                  </button>)}
                  {!visiblePartners.length && <div className="partner-empty"><strong>没有找到门店</strong><p>尝试搜索其他门店名称或联系人。</p><button className="text-action" onClick={() => { setPartnerSearch(""); }}>清空搜索</button></div>}
                </section>
                <details className="surface market-related"><summary>相关业务 · 招商与营销支持</summary><div><button className="market-row" onClick={() => openMarketDetail(marketLeads[0])}><span className="market-row-copy"><strong>招商合作跟进</strong><span>杭州滨江合作意向 · 方案沟通</span></span><ChevronRightIcon /></button><button className="market-row" onClick={() => openMarketDetail(marketCampaigns[0])}><span className="market-row-copy"><strong>门店营销支持</strong><span>秋季营养食品体验周 · 执行跟进</span></span><ChevronRightIcon /></button></div></details>
                </>}
              </>}
            </div>
          )}

          {screen === "member-detail" && selectedMember && (
            <div className="page-stack subpage-stack member-detail-stack">
              <SubpageHeader eyebrow="AGENT PERFORMANCE REVIEW" title={selectedMember.name} subtitle={`${selectedMember.district} · 数据截至昨日（T-1）`} onBack={() => setScreen(memberReturnScreen)} />
              <section className="surface member-overview">
                <div className="member-overview-head"><span className="profile-avatar">{selectedMember.name.slice(0, 1)}</span><div><strong>本月业绩 {selectedMember.gmv}</strong><span>目标达成 {selectedMember.progress}% · {selectedMember.issue}</span></div></div>
                <div className="member-kpi-grid">
                  <div><span>订单量</span><strong>{selectedMember.orders}</strong></div>
                  <div><span>新增客户</span><strong>{selectedMember.newCustomers}</strong></div>
                  <div><span>月内复购客户占比</span><strong>{selectedMember.repurchase}</strong></div>
                  <div><span>健康方案推送</span><strong>{selectedMember.planPush}</strong></div>
                  <div><span>所在团队活跃成员</span><strong>{selectedMember.activeTeam}</strong></div>
                  <div><span>重点观察</span><strong className="member-risk-text">{selectedMember.issue}</strong></div>
                </div>
                <p className="dimension-note">业绩与服务表现由品牌经营数据汇总；代理层级及分账由第三方接口提供。</p>
              </section>
              <section className="surface market-section"><SectionHeading icon={<GroupIcon />} title="团队与关联门店" />{managedTeams.filter((team) => team.memberNames.includes(selectedMember.name)).map((team) => <button className="market-row" key={team.id} onClick={() => openTeam(team.id)}><span className="market-row-copy"><strong>{team.name}</strong><span>负责人 {team.leader} · {team.memberNames.length} 位成员</span></span><ChevronRightIcon /></button>)}{memberDevelopment[selectedMember.name]?.partners.map((id) => <button className="market-row" key={id} onClick={() => openPartner(id)}><span className="market-row-copy"><strong>{marketPartners.find((partner) => partner.id === id)?.title}</strong><span>查看合作档案与经营表现</span></span><ChevronRightIcon /></button>)}</section>
              <section className="ai-panel member-ai-panel">
                <div className="ai-panel-top"><div className="ai-heading"><span className="ai-glyph"><MagicWandIcon /></span><div><IconLabel>AI AGENT COACH</IconLabel><h2>组员经营分析与提升方案</h2></div></div><span className="live-pill"><i />基于个人数据</span></div>
                <p className="ai-intro">AI 将综合业绩、客户复购、方案推送与团队活跃，给出优势、待提升事项、具体行动和阶段目标。</p>
                {memberAiState === "loading" && <div className="ai-loading"><span className="loading-orb" />AI 正在分析组员经营数据…</div>}
                {memberAiState === "error" && <div className="ai-error">{memberError}</div>}
                {memberAiState === "success" && <div className="ai-answer member-analysis">{memberAnswer}</div>}
                <button className="ai-primary" onClick={generateMemberAnalysis} disabled={memberAiState === "loading"}><MagicWandIcon />{memberAiState === "success" ? "重新生成个人分析" : memberAiState === "loading" ? "正在生成" : "生成组员经营分析"}<ArrowRightIcon /></button>
              </section>
              {memberAiState === "success" && <button className="primary-button full" onClick={() => { setMemberGoalSaved(true); announce("阶段辅导目标已保存"); }} disabled={memberGoalSaved}>{memberGoalSaved ? "已保存为辅导目标" : "采纳并保存阶段目标"}<CheckCircledIcon /></button>}
              <footer className="prototype-note">AI 建议供管理者与组员沟通确认，目标期限和责任分工可调整。</footer>
            </div>
          )}

          {screen === "store-employee-detail" && selectedStoreEmployee && (
            <div className="page-stack subpage-stack member-detail-stack">
              <SubpageHeader eyebrow="STORE EMPLOYEE REVIEW" title={selectedStoreEmployee.name} subtitle={`${selectedStoreEmployee.position} · 杭州延安店 · T-1`} onBack={() => setScreen(storeEmployeeReturnScreen)} />
              <section className="surface member-overview"><div className="member-overview-head"><span className="profile-avatar">{selectedStoreEmployee.name.slice(0, 1)}</span><div><strong>{selectedStoreEmployee.agentName} · 门店代理</strong><span>员工经营数据按本店订单、顾客服务及方案记录汇总</span></div></div><div className="member-kpi-grid">{[["本月销售额", formatTeamMoney(selectedStoreEmployee.salesYuan)], ["目标达成", `${selectedStoreEmployee.salesProgressPercent}%`], ["订单 / 客单", `${selectedStoreEmployee.orderCount} 笔 · ¥${selectedStoreEmployee.averageOrderYuan}`], ["新增顾客", `${selectedStoreEmployee.newCustomers} 人`], ["复购顾客", `${selectedStoreEmployee.repeatBuyers} / ${selectedStoreEmployee.repeatEligible} 人 · ${selectedStoreEmployee.repeatRatePercent}%`], ["回访进度", `完成 ${selectedStoreEmployee.callbackCompleted} · 待跟进 ${selectedStoreEmployee.callbackPending}`], ["方案执行中", `${selectedStoreEmployee.healthPlansExecuting} 位`], ["方案待更新", `${selectedStoreEmployee.healthPlansDue} 位`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
              <section className="ai-panel member-ai-panel"><div className="ai-panel-top"><div className="ai-heading"><span className="ai-glyph"><MagicWandIcon /></span><div><IconLabel>AI STORE TEAM COACH</IconLabel><h2>员工经营分析与提升方案</h2></div></div><span className="live-pill"><i />基于个人数据</span></div><p className="ai-intro">结合业绩、订单、复购、回访和方案跟进，分析做得好的方面、待提升事项、可执行动作及阶段目标。</p>{storeEmployeeAiState === "loading" && <div className="ai-loading"><span className="loading-orb" />AI 正在分析员工经营数据…</div>}{storeEmployeeAiState === "error" && <div className="ai-error">{storeEmployeeError}</div>}{storeEmployeeAiState === "success" && <div className="ai-answer member-analysis">{storeEmployeeAnswer}</div>}<button className="ai-primary" onClick={generateStoreEmployeeAnalysis} disabled={storeEmployeeAiState === "loading"}><MagicWandIcon />{storeEmployeeAiState === "success" ? "重新生成员工分析" : storeEmployeeAiState === "loading" ? "正在生成" : "生成员工经营分析"}<ArrowRightIcon /></button></section>
              {storeEmployeeAiState === "success" && <button className="primary-button full" onClick={() => { setMemberGoalSaved(true); announce("员工阶段目标已保存"); }} disabled={memberGoalSaved}>{memberGoalSaved ? "已保存为辅导目标" : "采纳并保存阶段目标"}<CheckCircledIcon /></button>}
              <footer className="prototype-note">经营建议由负责人确认后作为辅导目标；员工销售及服务指标来自本店模拟业务记录。</footer>
            </div>
          )}

          {screen === "mine" && (
            <div className="page-stack subpage-stack">
              <SubpageHeader title="我的" onBack={() => setScreen("home")} />
              <section className="surface profile-hero"><span className="profile-avatar">王</span><div><strong>王总监</strong><span>{roleView === "store" ? "门店负责人" : "品牌管理者"}</span></div><ChevronRightIcon /></section>
              <section className="surface source-list">
                <SectionHeading icon={<ActivityLogIcon />} title="数据来源" />
                <div className="source-row"><span className="source-symbol"><HeartIcon /></span><div><strong>顾客健康数据</strong><span>血糖、血压、体重体脂及睡眠 · 硬件采集</span></div><StatusPill tone="good">已同步</StatusPill></div>
                <div className="source-row"><span className="source-symbol"><BarChartIcon /></span><div><strong>{roleView === "store" ? "门店经营数据" : "集团经营数据"}</strong><span>{roleView === "store" ? "销售、商品与分账 · 品牌及第三方系统" : "业绩、层级与分账 · 品牌及第三方系统"}</span></div><StatusPill tone="good">已同步</StatusPill></div>
                <div className="source-row"><span className="source-symbol"><MagicWandIcon /></span><div><strong>AI 服务状态</strong><span>经营诊断每周生成一次</span></div><StatusPill tone="good">可调用</StatusPill></div>
              </section>
              <section className="surface settings-list">
                <button onClick={() => announce("品牌与区域设置")}>品牌与区域设置 <ChevronRightIcon /></button>
                <button onClick={() => announce("权限配置待业务规则确认")}>角色与授权范围 <ChevronRightIcon /></button>
                <button onClick={() => announce("已打开方案推送记录")}>方案推送记录 <ChevronRightIcon /></button>
              </section>
            </div>
          )}
        </main>
      </MobileScroll>

      {(screen === "workbench" || screen === "todos") && !todoConfirmed && <div className="workbench-action-dock">
        <span>{businessState === "success" ? `确认本期诊断建议 · ${dailyTodoDrafts.length} 项待办` : "诊断生成后可确认本期待办"}</span>
        <button className="primary-button" disabled={businessState !== "success" || !dailyTodoDrafts.length} onClick={confirmBusinessTodos}>{dailyTodoDrafts.length ? `确认生成 ${dailyTodoDrafts.length} 项` : "暂无待办建议"}<ArrowRightIcon /></button>
      </div>}

      <nav className={`bottom-nav ${roleView === "store" ? "role-store" : "role-group"}`} aria-label="管理端导航">
        <NavItem active={tab === "workbench"} name="workbench" label="工作台" onClick={() => setScreen("workbench")} />
        <NavItem active={tab === "home"} name="home" label="看板" onClick={() => setScreen("home")} />
        {roleView === "store" && <NavItem active={tab === "customers"} name="customers" label="顾客" onClick={() => setScreen("customers")} />}
        {roleView === "store" && <NavItem active={tab === "market"} name="customers" label="市场" onClick={() => setScreen("market")} />}
        {roleView === "group" && <NavItem active={tab === "market"} name="customers" label="市场" onClick={() => { keyboard.hide(); setMarketMode("teams"); setScreen("market"); }} />}
        <NavItem active={tab === "mine"} name="mine" label="我的" onClick={() => setScreen("mine")} />
      </nav>
      <BottomSheet open={dashboardMonthOpen} onOpenChange={setDashboardMonthOpen} title="选择统计月份" description="选择月份查看经营数据" snap={0.62}>
        <div className="dashboard-month-options">{dashboardMonthOptions.map((month) => <button type="button" key={month} aria-pressed={selectedDashboardMonth === month} onClick={() => { keyboard.hide(); setDashboardMonths((previous) => ({ ...previous, [roleView]: month })); setDashboardMonthOpen(false); }}><span>{dashboardMonthLabel(month)}{month === currentDashboardMonth && <small>本月</small>}</span>{selectedDashboardMonth === month ? <CheckCircledIcon /> : null}</button>)}</div>
      </BottomSheet>
      <BottomSheet open={roleView === "group" && !!selectedPartner} onOpenChange={(open) => { if (!open) { setPartnerTrail([]); setMarketFollowupDraft(""); } }} title={selectedPartner?.title || "合作对象详情"} description={selectedPartner?.subtitle} snap={0.9}>
        {selectedPartner && <div className="market-detail partner-detail">
          {partnerTrail.length > 1 && <button className="text-action partner-back" onClick={() => { keyboard.hide(); setPartnerTrail((trail) => trail.slice(0, -1)); setPartnerDetailTab("profile"); setMarketFollowupDraft(""); }}><ChevronLeftIcon />返回{marketPartners.find((item) => item.id === partnerTrail.at(-2))?.title}</button>}
          <div className="partner-type-tabs partner-detail-tabs" role="tablist" aria-label="合作对象详情栏目">{[{ id: "profile", label: "合作档案" }, { id: "operation", label: "经营表现" }, ...(selectedStoreSupply ? [{ id: "supply", label: "进货库存" }] : []), { id: "followup", label: "业务跟进" }].map((item) => <button role="tab" aria-selected={partnerDetailTab === item.id} key={item.id} onClick={() => { keyboard.hide(); setPartnerDetailTab(item.id as typeof partnerDetailTab); }}>{item.label}</button>)}</div>
          {partnerDetailTab === "profile" && <>
            <dl className="partner-profile">{[["合作类型", selectedPartner.kind === "dealer" ? "经销商" : "门店"], ["合作状态", selectedPartner.status], ["联系人", selectedPartner.contact], ["所属区域", selectedPartner.region], ["合作起始", selectedPartner.since], ["管理负责人", selectedPartner.owner]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            {selectedPartner.parentId ? <button className="market-row" onClick={() => openPartner(selectedPartner.parentId! , true)}><span className="market-row-copy"><strong>所属经销商</strong><span>{marketPartners.find((item) => item.id === selectedPartner.parentId)?.title}</span></span><ChevronRightIcon /></button> : <div className="market-detail-block"><h3>下属门店 · {marketPartners.filter((item) => item.parentId === selectedPartner.id).length} 家</h3>{marketPartners.filter((item) => item.parentId === selectedPartner.id).map((child) => <button className="market-row" key={child.id} onClick={() => openPartner(child.id, true)}><span className="market-row-copy"><strong>{child.title}</strong><span>{child.contact} · {partnerAlerts[child.id] || child.status}</span></span><ChevronRightIcon /></button>)}</div>}
            <button className="outline-button full" onClick={() => setPartnerDetailTab("operation")}>查看{selectedPartner.kind === "dealer" ? "经销商" : "门店"}经营表现 <ArrowRightIcon /></button>
          </>}
          {partnerDetailTab === "operation" && <>
            <div className="market-detail-block"><h3>{selectedPartner.kind === "dealer" ? "经销商进货与返单" : "门店销售与会员经营"}</h3><div className="member-kpi-grid">{selectedPartner.metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div>
            <div className="market-detail-block"><h3>{selectedPartner.kind === "dealer" ? "渠道经营跟踪" : "门店日常服务"}</h3><div className="member-kpi-grid">{selectedPartner.operation.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div>
            <p className="dimension-note">本月累计 · 截至昨日。{selectedPartner.kind === "dealer" ? "进货按经销商采购订单统计，下属门店零售额另行查看。" : "销售、会员与服务数据均限定本门店。"}</p>
            {selectedStoreSupply && <button className="market-row" onClick={() => setPartnerDetailTab("supply")}><span className="market-row-copy"><strong>进货与库存</strong><span>本月进货 {supplyMoney(getStoreSupplyStats(selectedStoreSupply).amount)} · 最近进货 {getStoreSupplyStats(selectedStoreSupply).lastReceivedAt}</span></span><ChevronRightIcon /></button>}
            <div className="market-detail-block"><h3>经营关注</h3><p>{selectedPartner.issue}</p></div><button className="primary-button full" onClick={() => setPartnerDetailTab("followup")}>跟进这家{selectedPartner.kind === "dealer" ? "经销商" : "门店"} <ArrowRightIcon /></button>
          </>}
          {partnerDetailTab === "supply" && selectedStoreSupply && <>
            <div className="store-supply-source"><span>采购来源</span><strong>{selectedStoreSupply.supplierId === "headquarters" ? "集团总部" : marketPartners.find((item) => item.id === selectedStoreSupply.supplierId)?.title || "待核实"}</strong></div>
            <div className="market-detail-block"><h3>本月进货与库存</h3><div className="member-kpi-grid">{[["本月进货额", supplyMoney(getStoreSupplyStats(selectedStoreSupply).amount)], ["本月进货数量", `${getStoreSupplyStats(selectedStoreSupply).quantity} 盒`], ["最近进货", getStoreSupplyStats(selectedStoreSupply).lastReceivedAt], ["平均返单周期", `${selectedStoreSupply.reorderDays} 天`], ["当前库存", `${getStoreSupplyStats(selectedStoreSupply).stock} 盒`], ["库存周转", `${selectedStoreSupply.turnoverDays} 天`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="dimension-note">本月进货按已收货金额及数量扣除已确认退货统计，待收货另列；与门店零售额分别统计。</p></div>
            <div className="market-detail-block"><h3>商品进货明细</h3>{selectedStoreSupply.products.map((item) => <article className="store-supply-product" key={item.name}><div><strong>{item.name}</strong><span>{item.spec} · 最近收货 {item.receivedAt}</span></div><dl><div><dt>本月收货</dt><dd>{item.received} 盒</dd></div><div><dt>本月退货</dt><dd>{item.returned} 盒</dd></div><div><dt>净进货额</dt><dd>{supplyMoney((item.received - item.returned) * item.unitPrice)}</dd></div><div><dt>当前库存</dt><dd>{item.stock} 盒</dd></div></dl></article>)}</div>
            <div className="market-detail-block"><h3>待收货 · {selectedStoreSupply.pending.length} 笔</h3>{selectedStoreSupply.pending.length ? selectedStoreSupply.pending.map((order) => <article className="store-supply-shipment" key={order.orderId}><strong>{order.name} · {order.quantity} 盒</strong><span>{order.orderId} · 预计 {order.expected} 到货</span><span>待收货金额 {supplyMoney(order.amount)}</span></article>) : <p>暂无待收货订单</p>}</div>
            <div className="market-detail-block"><h3>本月已确认退货</h3><p>{getStoreSupplyStats(selectedStoreSupply).returnedQuantity ? `${getStoreSupplyStats(selectedStoreSupply).returnedQuantity} 盒 · ${supplyMoney(getStoreSupplyStats(selectedStoreSupply).returnedAmount)}，已从本月进货汇总中扣除。` : "暂无已确认退货"}</p></div>
            <button className="outline-button full" onClick={() => setPartnerDetailTab("operation")}>对照门店销售与服务表现 <ChevronRightIcon /></button>
          </>}
          {partnerDetailTab === "followup" && <>
            <div className="market-detail-block"><h3>本轮跟进重点</h3><p>{selectedPartner.action}</p><span className="market-owner">负责：{selectedPartner.owner}</span></div>
            <div className="partner-followup-kinds" aria-label="跟进类型">{["经营回访", "培训赋能", "营销支持"].map((kind) => <button key={kind} aria-pressed={partnerFollowupKind === kind} onClick={() => { keyboard.hide(); setPartnerFollowupKind(kind); }}>{kind}</button>)}</div>
            <label className="market-note-label" htmlFor="partner-followup">记录进展与下次安排</label><KeyboardTextarea id="partner-followup" value={marketFollowupDraft} onChange={(event) => setMarketFollowupDraft(event.target.value)} placeholder="填写已沟通事项、支持安排与下次跟进时间" />
            <button className="primary-button full" disabled={!marketFollowupDraft.trim()} onClick={() => { const next = { ...marketFollowups, [selectedPartner.id]: [`${new Date().toLocaleString("zh-CN")} · ${partnerFollowupKind} · ${selectedPartner.owner}：${marketFollowupDraft.trim()}`, ...(marketFollowups[selectedPartner.id] || [])] }; localStorage.setItem("group-market-followups-v1", JSON.stringify(next)); setMarketFollowups(next); setMarketFollowupDraft(""); keyboard.hide(); announce("跟进记录已保存"); }}>保存跟进记录</button>
            {partnerAlerts[selectedPartner.id] && <button className="outline-button full" disabled={!partnerHandled.includes(selectedPartner.id) && !marketFollowups[selectedPartner.id]?.length} onClick={() => { const done = partnerHandled.includes(selectedPartner.id); const next = done ? partnerHandled.filter((id) => id !== selectedPartner.id) : [...partnerHandled, selectedPartner.id]; localStorage.setItem("group-partner-handled-v1", JSON.stringify(next)); setPartnerHandled(next); announce(done ? "已恢复为待跟进" : "本轮跟进已完成"); }}>{partnerHandled.includes(selectedPartner.id) ? "恢复为待跟进" : "完成本轮跟进"}</button>}
            <div className="market-detail-block"><h3>跟进记录</h3>{marketFollowups[selectedPartner.id]?.map((entry, index) => <p key={index} className="market-saved-note">{entry}</p>)}{selectedPartner.history.map((entry) => <p key={entry} className="market-history">{entry}</p>)}</div>
          </>}
        </div>}
      </BottomSheet>
      <BottomSheet open={roleView === "group" && !!marketDetail} onOpenChange={(open) => { if (!open) setMarketDetail(null); }} title={marketDetail?.title || "市场详情"} description={marketDetail?.subtitle} snap={0.88}>
        {marketDetail && <div className="market-detail">
          <div className="member-kpi-grid">{marketDetail.metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <div className="market-detail-block"><h3>当前关注</h3><p>{marketDetail.issue}</p></div>
          <div className="market-detail-block"><h3>下一步行动</h3><p>{marketDetail.action}</p><span className="market-owner">负责：{marketDetail.owner}</span></div>
          <div className="market-detail-block"><h3>跟进记录</h3>{marketFollowups[marketDetail.id]?.map((entry, index) => <p key={index} className="market-saved-note">{entry}</p>)}{marketDetail.history.map((entry) => <p key={entry} className="market-history">{entry}</p>)}</div>
          <label className="market-note-label" htmlFor="market-followup">补充跟进情况</label>
          <KeyboardTextarea id="market-followup" value={marketFollowupDraft} onChange={(event) => setMarketFollowupDraft(event.target.value)} placeholder="记录本次进展、下次跟进时间或待协调事项" />
          <button className="primary-button full" disabled={!marketFollowupDraft.trim()} onClick={() => { const next = { ...marketFollowups, [marketDetail.id]: [`${new Date().toLocaleString("zh-CN")} · ${marketFollowupDraft.trim()}`, ...(marketFollowups[marketDetail.id] || [])] }; localStorage.setItem("group-market-followups-v1", JSON.stringify(next)); setMarketFollowups(next); setMarketFollowupDraft(""); keyboard.hide(); announce("跟进记录已保存"); }}>保存跟进记录</button>
        </div>}
      </BottomSheet>
      <BottomSheet
        open={planHistorySheetOpen}
        onOpenChange={setPlanHistorySheetOpen}
        title="调理食谱记录"
        description={`${selectedCustomer.name} · 每 3 天更新一次`}
        snap={0.68}
      >
        <div className="plan-history-list">
          {planHistoryRows.map((record, index) => <div className="plan-history-record" key={`${record.title}-${record.date}`}>
            <span className={`plan-history-marker ${index === 0 ? "current" : ""}`} />
            <div className="plan-history-copy"><div className="plan-history-heading"><strong>{record.title}</strong><StatusPill tone={record.tone}>{record.status}</StatusPill></div><time>{record.date}</time><p>{record.detail}</p></div>
          </div>)}
        </div>
      </BottomSheet>
      <BottomSheet
        open={notificationSheetOpen}
        onOpenChange={setNotificationSheetOpen}
        title="系统通知"
        snap={0.55}
      >
        <div className="notification-list">
          {roleView === "store" ? <button className="notification-item" onClick={() => { setNotificationSheetOpen(false); setScreen("batch-plan"); }}>
            <span className="notification-icon"><HeartIcon /></span>
            <span className="notification-copy"><strong>{batchPushed ? "顾客调理食谱已推送" : "新一轮顾客调理食谱已生成"}</strong><span>{batchPushed ? "本轮方案已完成推送，可查看推送详情。" : `每 3 天生成一次 · 待核对 ${batchPlans.length - batchReviewed.length} 位顾客`}</span><small>最近生成 {batchGeneratedAt} · 下次任务 {scheduledPlanNextRun}</small></span>
            <ChevronRightIcon />
          </button> : <div className="notification-empty">暂无新的系统通知</div>}
        </div>
      </BottomSheet>
      <BottomSheet
        open={diagnosisSheetOpen}
        onOpenChange={setDiagnosisSheetOpen}
        title={`${roleView === "store" ? "门店" : "集团"}经营诊断`}
        description={`数据口径 T-1 · 最近生成 ${businessUpdatedAt || "待生成"}`}
        snap={0.88}
      >
        <div className="diagnosis-sheet-content">
          <div className="diagnosis-sheet-lead"><span className="mini-label">AI BUSINESS INSIGHT</span><strong>经营结论与行动建议</strong></div>
          {businessState === "success" && <div className="report-body">{businessAnswer}</div>}
          {businessState === "loading" && <div className="ai-loading"><span className="loading-orb" />AI 正在分析经营数据…</div>}
          {businessState === "error" && <div className="sheet-error"><p>{businessError}</p><span>已有分析内容仍会保留，可稍后再试。</span></div>}
          {businessState === "idle" && <div className="ai-empty">暂无经营建议</div>}
          <button className="primary-button full diagnosis-sheet-action" onClick={generateBusiness} disabled={businessState === "loading"}><MagicWandIcon />{businessState === "loading" ? "正在生成" : todoConfirmed ? "重新生成并同步待办" : "重新生成"}</button>
        </div>
      </BottomSheet>
      {toast && <div className="toast-message" role="status"><CheckCircledIcon />{toast}</div>}
    </div>
  );
}

type FilledTabIconName = "workbench" | "home" | "customers" | "mine";

function FilledTabIcon({ name, active }: { name: FilledTabIconName; active: boolean }) {
  const shapeFill = active ? "currentColor" : "none";
  const detailStroke = active && name === "workbench" ? "var(--color-surface)" : "currentColor";
  const paths: Record<FilledTabIconName, ReactNode> = {
    workbench: <><rect x="5" y="3.5" width="14" height="17" rx="2" fill={shapeFill} /><path d="m8 9 1.2 1.2L11.5 8m1.5 1.5h3m-8 4.5 1.2 1.2 2.8-3m1.5 1.5h3" fill="none" stroke={detailStroke} strokeLinecap="round" strokeLinejoin="round" /></>,
    home: <><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4" fill={shapeFill} /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4" fill={shapeFill} /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4" fill={shapeFill} /><rect x="13" y="13" width="7.5" height="7.5" rx="1.4" fill={shapeFill} /></>,
    customers: <><circle cx="9" cy="8" r="3" fill={shapeFill} /><circle cx="17" cy="9" r="2.5" fill={shapeFill} /><path d="M3 20a6 6 0 0 1 12 0v.5H3V20Zm12-4a5 5 0 0 1 6 4.5h-4.5A7.5 7.5 0 0 0 15 16Z" fill={shapeFill} /></>,
    mine: <><circle cx="12" cy="8" r="3.4" fill={shapeFill} /><path d="M4.5 20a7.5 7.5 0 0 1 15 0v1h-15v-1Z" fill={shapeFill} /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function NavItem({ active, name, label, onClick }: { active: boolean; name: FilledTabIconName; label: string; onClick: () => void }) {
  return <button type="button" className={`nav-item ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} onClick={onClick}><span><FilledTabIcon name={name} active={active} /></span><small>{label}</small></button>;
}

function SubpageHeader({ eyebrow, title, subtitle, onBack }: { eyebrow?: string; title: string; subtitle?: string; onBack: () => void }) {
  return <header className="subpage-header"><button type="button" className="back-button" onClick={onBack} aria-label="返回"><ChevronLeftIcon /></button><div>{eyebrow && <IconLabel>{eyebrow}</IconLabel>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></header>;
}
