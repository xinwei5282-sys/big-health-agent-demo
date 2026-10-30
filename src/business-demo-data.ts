/**
 * Fixed source fixtures for the B-side demo. Page labels and AI request facts
 * are derived below so the same T-1 inputs cannot drift across views.
 * Amounts are CNY; the network and priority-detail fixtures have separate scopes.
 */
export const storeDemoDatasetVersion = "store-demo-v7";
export const groupDemoDatasetVersion = "group-demo-v6";

const yuanToWan = (amount: number) => amount / 10_000;
const ratePercent = (part: number, whole: number) => whole ? Math.round(part / whole * 100) : 0;
const moneyWan = (amount: number) => `¥${yuanToWan(amount).toFixed(1)}w`;
const roundedShares = (counts: number[]) => {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const values = counts.map((count) => Math.round(count / total * 1000) / 10);
  if (values.length) values[values.length - 1] = Math.round((100 - values.slice(0, -1).reduce((sum, value) => sum + value, 0)) * 10) / 10;
  return values;
};

// POS and member-service source facts for the directly consumer-facing store.
const storeSeed = {
  storeId: "store-hz",
  storeName: "杭州延安店",
  salesMonths: [
    { month: "5月", netSalesYuan: 152_000 }, { month: "6月", netSalesYuan: 164_000 },
    { month: "7月", netSalesYuan: 158_000 }, { month: "8月", netSalesYuan: 176_000 },
    { month: "9月", netSalesYuan: 168_000 }, { month: "10月", netSalesYuan: 186_000 },
  ],
  salesPeriod: { netSalesYuan: 186_000, salesTargetYuan: 202_173, previousYearSalesYuan: 166_071, orders: 426, previousYearOrders: 394 },
  members: { active: 286, newThisMonth: 34, repeatBuyers: 109, repeatEligible: 286, repeatTargetPercent: 42 },
  callbacks: { total: 75, completed: 57, pending: 18 },
  healthService: { deviceBoundCustomers: 103, plansExecuting: 86, plansDue: 12, customersAwaitingDeviceData: 5 },
  products: [
    { id: "sku-grain-protein", name: "高蛋白谷物粉", spec: "400g/盒", productType: "grain", monthlySalesYuan: 48_000, stock: 8, warningLine: 12, salesLast7Days: 26, turnoverDays: 12 },
    { id: "sku-sesame-low-sugar", name: "低糖芝麻丸", spec: "30粒/盒", productType: "sesame", monthlySalesYuan: 36_000, stock: 6, warningLine: 10, salesLast7Days: 18, turnoverDays: 18 },
    { id: "sku-light-porridge", name: "轻食营养粥", spec: "300g/盒", productType: "porridge", monthlySalesYuan: 29_000, stock: 42, warningLine: 12, salesLast7Days: 4, turnoverDays: 63 },
    { id: "sku-quinoa-crisp", name: "藜麦坚果脆", spec: "180g/袋", productType: "grain", monthlySalesYuan: 24_000, stock: 36, warningLine: 10, salesLast7Days: 5, turnoverDays: 49 },
    { id: "sku-oatmeal", name: "每日燕麦片", spec: "500g/袋", productType: "grain", monthlySalesYuan: 18_000, stock: 65, warningLine: 18, salesLast7Days: 21, turnoverDays: 25 },
    { id: "sku-brown-rice", name: "杂粮糙米饭", spec: "300g/盒", productType: "porridge", monthlySalesYuan: 18_000, stock: 48, warningLine: 14, salesLast7Days: 12, turnoverDays: 31 },
    { id: "sku-black-bean", name: "黑豆谷物粉", spec: "400g/盒", productType: "grain", monthlySalesYuan: 13_000, stock: 40, warningLine: 12, salesLast7Days: 9, turnoverDays: 34 },
  ],
};

// Deterministic POS fixture: charts and KPIs are derived from order lines,
// customer records, service records, callback records and inventory movements.
const allocateCount = (total: number, slots: number, offset = 0) => {
  const counts = Array.from({ length: slots }, () => Math.floor(total / slots));
  for (let index = 0; index < total % slots; index += 1) counts[(index * 173 + offset) % slots] += 1;
  return counts;
};
const allocateWeightedTotal = (total: number, slots: number, seed: number) => {
  const weights = Array.from({ length: slots }, (_, index) => 300 + ((index * 73 + seed * 97) % 700));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const raw = weights.map((weight) => total * weight / weightSum);
  const amounts = raw.map(Math.floor);
  let remainder = total - amounts.reduce((sum, amount) => sum + amount, 0);
  const byFraction = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; index < remainder; index += 1) amounts[byFraction[index].index] += 1;
  return amounts;
};
const allocateByWeights = (total: number, weights: number[]) => {
  if (!weights.length) return [];
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => total * weight / weightSum);
  const amounts = raw.map(Math.floor);
  let remainder = total - amounts.reduce((sum, amount) => sum + amount, 0);
  const byFraction = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; index < remainder; index += 1) amounts[byFraction[index].index] += 1;
  return amounts;
};
const storeOrderCount = storeSeed.salesPeriod.orders;
export const storeEmployeeRoster = [
  { id: "STAFF-HZ-001", name: "周宁", position: "会员顾问", agentName: "张伟", salesTargetYuan: 48_000 },
  { id: "STAFF-HZ-002", name: "林佳", position: "营养顾问", agentName: "张伟", salesTargetYuan: 42_000 },
  { id: "STAFF-HZ-003", name: "王超", position: "健康服务顾问", agentName: "张伟", salesTargetYuan: 40_000 },
  { id: "STAFF-HZ-004", name: "陈悦", position: "会员顾问", agentName: "赵敏", salesTargetYuan: 39_000 },
  { id: "STAFF-HZ-005", name: "刘敏", position: "营养顾问", agentName: "赵敏", salesTargetYuan: 33_173 },
];
const recentUnitTargets = [26, 18, 4, 5, 21, 12, 9];
const storeSkuCatalog = storeSeed.products.map((product, index) => ({
  ...product,
  unitPriceYuan: [200, 150, 100, 120, 100, 100, 100][index],
  monthlyUnits: product.monthlySalesYuan / [200, 150, 100, 120, 100, 100, 100][index],
  recentUnits: recentUnitTargets[index],
}));
const storeOrderCustomerIds = (() => {
  const assignments: string[] = [];
  for (let customerIndex = 0; customerIndex < storeSeed.members.repeatBuyers; customerIndex += 1) {
    const id = "CUS-HZ-" + String(customerIndex + 1).padStart(4, "0");
    assignments.push(id, id);
    if (customerIndex < 31) assignments.push(id);
  }
  for (let customerIndex = storeSeed.members.repeatBuyers; assignments.length < storeOrderCount; customerIndex += 1) {
    assignments.push("CUS-HZ-" + String(customerIndex + 1).padStart(4, "0"));
  }
  return Array.from({ length: storeOrderCount }, (_, index) => assignments[(index * 173) % assignments.length]);
})();
const currentMonthOrders = Array.from({ length: storeOrderCount }, (_, index) => ({
  id: "POS-HZ-1026-" + String(index + 1).padStart(4, "0"),
  customerId: storeOrderCustomerIds[index],
  employeeId: storeEmployeeRoster[(Number(storeOrderCustomerIds[index].split("-").at(-1)) - 1) % storeEmployeeRoster.length].id,
  date: "2026-10-" + String(index < 95 ? 22 + (index % 7) : 1 + (index * 17) % 21).padStart(2, "0"),
  status: "paid" as const,
}));
export const storeOrderLines = storeSkuCatalog.flatMap((product, skuIndex) => {
  const quantities = Array.from({ length: storeOrderCount }, () => 0);
  const recentIndexes = currentMonthOrders.map((order, index) => ({ order, index })).filter(({ order }) => Number(order.date.slice(-2)) > 21).map(({ index }) => index);
  const previousIndexes = currentMonthOrders.map((order, index) => ({ order, index })).filter(({ order }) => Number(order.date.slice(-2)) <= 21).map(({ index }) => index);
  const allocateInto = (count: number, indices: number[], offset: number, recent: boolean) => {
    const baselineBySku = allocateCount(indices.length, storeSkuCatalog.length);
    const baselineCount = recent ? product.recentUnits : baselineBySku[skuIndex];
    const baselineStart = recent ? recentUnitTargets.slice(0, skuIndex).reduce((sum, value) => sum + value, 0) : baselineBySku.slice(0, skuIndex).reduce((sum, value) => sum + value, 0);
    indices.slice(baselineStart, baselineStart + baselineCount).forEach((index) => { quantities[index] += 1; });
    const values = allocateCount(count - baselineCount, indices.length, offset);
    indices.forEach((index, position) => { quantities[index] += values[position]; });
  };
  allocateInto(product.recentUnits, recentIndexes, skuIndex * 11, true);
  allocateInto(product.monthlyUnits - product.recentUnits, previousIndexes, skuIndex * 19, false);
  return quantities.flatMap((quantity, orderIndex) => quantity ? [{
    orderId: currentMonthOrders[orderIndex].id,
    skuId: product.id,
    productName: product.name,
    quantity,
    unitPriceYuan: product.unitPriceYuan,
    netAmountYuan: quantity * product.unitPriceYuan,
  }] : []);
});
export const storeSalesOrders = currentMonthOrders.map((order) => {
  const lines = storeOrderLines.filter((line) => line.orderId === order.id);
  return { ...order, lines, netAmountYuan: lines.reduce((sum, line) => sum + line.netAmountYuan, 0) };
}).filter((order) => order.netAmountYuan > 0);
export const storeHistoricalOrders = storeSeed.salesMonths.slice(0, -1).flatMap((month, monthIndex) => {
  const orderCount = 360 + ((monthIndex * 23) % 55);
  const amounts = allocateWeightedTotal(month.netSalesYuan, orderCount, monthIndex + 1);
  return Array.from({ length: orderCount }, (_, index) => ({
    id: "POS-HZ-H" + String(monthIndex + 5).padStart(2, "0") + "-" + String(index + 1).padStart(4, "0"),
    customerId: "CUS-HZ-" + String(1 + (index * 17 + monthIndex * 29) % storeSeed.members.active).padStart(4, "0"),
    date: "2026-" + String(monthIndex + 5).padStart(2, "0") + "-" + String(1 + (index * 11 + monthIndex) % 28).padStart(2, "0"),
    month: month.month,
    netAmountYuan: amounts[index],
    status: "paid" as const,
  }));
});
const storePreviousYearAmounts = allocateCount(storeSeed.salesPeriod.previousYearSalesYuan, storeSeed.salesPeriod.previousYearOrders, 17);
export const storePreviousYearOrders = Array.from({ length: storeSeed.salesPeriod.previousYearOrders }, (_, index) => ({
  id: "POS-HZ-202510-" + String(index + 1).padStart(4, "0"),
  netAmountYuan: storePreviousYearAmounts[index],
  status: "paid" as const,
}));
export const storeCustomerRecords = Array.from({ length: storeSeed.members.active }, (_, index) => {
  const id = "CUS-HZ-" + String(index + 1).padStart(4, "0");
  const orders = storeSalesOrders.filter((order) => order.customerId === id);
  const featured = id === "CUS-HZ-0087" ? { name: "李阿姨", age: 58, gender: "女" as const, dietPreference: "少盐清淡", dietaryRestriction: "忌海鲜 · 不吃香菜" }
    : id === "CUS-HZ-0001" ? { name: "王叔", age: 62, gender: "男" as const, dietPreference: "未填写", dietaryRestriction: "未填写" }
      : id === "CUS-HZ-0102" ? { name: "张姐", age: 45, gender: "女" as const, dietPreference: "未填写", dietaryRestriction: "未填写" } : null;
  return {
    id,
    displayName: featured?.name || `顾客${String(index + 1).padStart(3, "0")}`,
    storeId: storeSeed.storeId,
    employeeId: orders[0]?.employeeId || storeEmployeeRoster[index % storeEmployeeRoster.length].id,
    status: "active" as const,
    registeredAt: index < storeSeed.members.newThisMonth ? "2026-10-" + String(1 + (index * 7) % 28).padStart(2, "0") : "2025-" + String(1 + index % 9).padStart(2, "0") + "-15",
    age: featured?.age || 30 + (index * 11) % 45,
    gender: featured?.gender || (index % 2 ? "女" as const : "男" as const),
    dietPreference: featured?.dietPreference || ["清淡均衡", "少盐", "控糖", "高蛋白", "未填写"][index % 5],
    dietaryRestriction: featured?.dietaryRestriction || ["无", "忌海鲜", "不吃香菜", "乳糖不耐", "未填写"][index % 5],
    orderCount: orders.length,
    netSalesYuan: orders.reduce((sum, order) => sum + order.netAmountYuan, 0),
    lastPurchaseAt: orders.map((order) => order.date).sort().at(-1) || null,
    repeatBuyer: orders.length >= 2,
  };
});
export const storeCallbackRecords = Array.from({ length: storeSeed.callbacks.total }, (_, index) => ({
  id: "CALL-HZ-" + String(index + 1).padStart(3, "0"),
  customerId: storeCustomerRecords[index].id,
  employeeId: storeCustomerRecords[index].employeeId,
  status: index < storeSeed.callbacks.completed ? "completed" as const : "pending" as const,
  dueAt: "2026-10-" + String(1 + (index * 11) % 28).padStart(2, "0"),
}));
export const storeHealthServiceRecords = Array.from({ length: storeSeed.healthService.deviceBoundCustomers }, (_, index) => ({
  customerId: storeCustomerRecords[index].id,
  employeeId: storeCustomerRecords[index].employeeId,
  deviceBound: true as const,
  planStatus: index < storeSeed.healthService.plansExecuting ? "executing" as const : index < storeSeed.healthService.plansExecuting + storeSeed.healthService.plansDue ? "due" as const : "awaiting-data" as const,
  latestReadingAt: index < storeSeed.healthService.plansExecuting + storeSeed.healthService.plansDue ? "2026-10-" + String(1 + (index * 5) % 28).padStart(2, "0") : null,
}));
export const storeEmployeeRecords = storeEmployeeRoster.map((employee) => {
  const orders = storeSalesOrders.filter((order) => order.employeeId === employee.id);
  const customers = storeCustomerRecords.filter((customer) => customer.employeeId === employee.id);
  const callbacks = storeCallbackRecords.filter((record) => record.employeeId === employee.id);
  const healthPlans = storeHealthServiceRecords.filter((record) => record.employeeId === employee.id);
  const salesYuan = orders.reduce((total, order) => total + order.netAmountYuan, 0);
  const repeatEligible = customers.filter((customer) => customer.orderCount > 0).length;
  return {
    ...employee,
    storeId: storeSeed.storeId,
    salesYuan,
    salesProgressPercent: Math.round(salesYuan / employee.salesTargetYuan * 100),
    orderCount: orders.length,
    averageOrderYuan: orders.length ? Math.round(salesYuan / orders.length) : 0,
    customerCount: customers.length,
    newCustomers: customers.filter((customer) => customer.registeredAt.startsWith("2026-10")).length,
    repeatBuyers: customers.filter((customer) => customer.repeatBuyer).length,
    repeatEligible,
    repeatRatePercent: repeatEligible ? Math.round(customers.filter((customer) => customer.repeatBuyer).length / repeatEligible * 100) : 0,
    callbackCompleted: callbacks.filter((record) => record.status === "completed").length,
    callbackPending: callbacks.filter((record) => record.status === "pending").length,
    healthPlansExecuting: healthPlans.filter((record) => record.planStatus === "executing").length,
    healthPlansDue: healthPlans.filter((record) => record.planStatus === "due").length,
  };
});
type StoreHealthReading = { customerId: string; storeId: string; measuredAt: string; glucose: number; totalCholesterol: number; triglyceride: number; hdl: number; ldl: number; systolic: number; diastolic: number; weightKg: number; bodyFatPercent: number; sleepHours: number; deepSleepHours: number };
const featuredHealthSamples: Record<string, number[][]> = {
  "CUS-HZ-0087": [
    [8.1, 5.8, 2.1, 1.1, 3.7, 141, 88, 68.5, 31.5, 5.8, 1.4], [7.8, 5.7, 2.0, 1.1, 3.6, 139, 87, 68.4, 31.4, 6.1, 1.5], [8.0, 5.7, 1.9, 1.2, 3.5, 140, 86, 68.3, 31.3, 6.0, 1.5], [7.6, 5.6, 1.9, 1.2, 3.5, 137, 85, 68.2, 31.2, 6.4, 1.7], [7.9, 5.5, 1.8, 1.2, 3.4, 138, 86, 68.1, 31.1, 6.2, 1.6], [7.7, 5.5, 1.8, 1.2, 3.4, 139, 85, 68.0, 31.0, 6.1, 1.5], [7.8, 5.4, 1.7, 1.3, 3.3, 138, 86, 68.0, 31.0, 6.2, 1.6],
  ],
  "CUS-HZ-0001": [
    [6.4, 4.8, 1.4, 1.4, 2.8, 134, 83, 72.8, 26.8, 6.9, 1.7], [6.2, 4.7, 1.3, 1.4, 2.7, 133, 82, 72.7, 26.7, 7.0, 1.8], [6.3, 4.7, 1.3, 1.5, 2.7, 132, 83, 72.6, 26.6, 7.2, 1.9], [6.1, 4.6, 1.2, 1.5, 2.6, 131, 82, 72.6, 26.6, 7.1, 1.8], [6.2, 4.6, 1.2, 1.5, 2.6, 133, 81, 72.5, 26.5, 7.0, 1.7], [6.2, 4.5, 1.2, 1.5, 2.5, 132, 82, 72.5, 26.5, 7.2, 1.9], [6.2, 4.5, 1.1, 1.6, 2.5, 132, 82, 72.4, 26.4, 7.1, 1.8],
  ],
  "CUS-HZ-0102": [
    [7.2, 5.2, 1.6, 1.3, 3.2, 135, 85, 61.2, 29.8, 6.1, 1.5], [7.0, 5.1, 1.5, 1.3, 3.1, 134, 84, 61.1, 29.7, 6.0, 1.4], [7.1, 5.1, 1.5, 1.3, 3.1, 136, 85, 61.1, 29.7, 6.4, 1.6], [6.9, 5.0, 1.4, 1.4, 3.0, 133, 83, 61.0, 29.6, 6.3, 1.6], [7.0, 5.0, 1.4, 1.4, 3.0, 134, 84, 60.9, 29.5, 6.2, 1.5], [6.8, 4.9, 1.3, 1.4, 2.9, 132, 82, 60.9, 29.5, 6.6, 1.8], [6.9, 4.9, 1.3, 1.5, 2.9, 133, 83, 60.8, 29.4, 6.5, 1.7],
  ],
};
const readingFromValues = (values: number[]): Omit<StoreHealthReading, "customerId" | "storeId" | "measuredAt"> => ({ glucose: values[0], totalCholesterol: values[1], triglyceride: values[2], hdl: values[3], ldl: values[4], systolic: values[5], diastolic: values[6], weightKg: values[7], bodyFatPercent: values[8], sleepHours: values[9], deepSleepHours: values[10] });
export const storeHealthDailyReadingLedger: StoreHealthReading[] = storeHealthServiceRecords.flatMap((service, customerIndex) => {
  const featured = featuredHealthSamples[service.customerId];
  if (!featured && service.planStatus === "awaiting-data") return [];
  const base = 1000 + customerIndex * 37;
  const samples = featured ? featured.map(readingFromValues) : Array.from({ length: 7 }, (_, dayIndex) => {
    const wave = (customerIndex * 7 + dayIndex * 3) % 9;
    return readingFromValues([5.4 + wave * 0.1, 4.2 + (wave % 6) * 0.1, 0.9 + (wave % 7) * 0.1, 1.2 + (wave % 5) * 0.1, 2.4 + (wave % 6) * 0.1, 112 + (wave % 24), 72 + (wave % 14), 52 + (customerIndex % 31) + dayIndex * 0.02, 21 + (customerIndex % 16) + dayIndex * 0.03, 6.2 + (wave % 10) * 0.1, 1.2 + (wave % 7) * 0.1]);
  });
  return samples.map((sample, dayIndex) => ({ ...sample, customerId: service.customerId, storeId: storeSeed.storeId, measuredAt: `2026-10-${String((service.customerId === "CUS-HZ-0102" ? 17 : 22) + dayIndex).padStart(2, "0")}T07:${String((base + dayIndex * 11) % 60).padStart(2, "0")}:00+08:00` }));
});
const storeProductTransactions = storeSkuCatalog.map((product) => {
  const lines = storeOrderLines.filter((line) => line.skuId === product.id);
  const soldUnits = lines.reduce((sum, line) => sum + line.quantity, 0);
  const recentUnits = lines.filter((line) => Number(currentMonthOrders.find((order) => order.id === line.orderId)?.date.slice(-2) || "0") > 21).reduce((sum, line) => sum + line.quantity, 0);
  const receivedUnits = [200, 120, 150, 100, 100, 150, 100][storeSkuCatalog.indexOf(product)];
  const returnedUnits = [0, 0, 20, 0, 0, 0, 0][storeSkuCatalog.indexOf(product)];
  const openingUnits = product.stock + soldUnits + returnedUnits - receivedUnits;
  return {
    ...product,
    monthlySalesYuan: lines.reduce((sum, line) => sum + line.netAmountYuan, 0),
    salesLast7Days: recentUnits,
    turnoverDays: recentUnits ? Math.ceil(product.stock * 7 / recentUnits) : 999,
    receivedUnits,
    returnedUnits,
    stock: openingUnits + receivedUnits - soldUnits - returnedUnits,
    inventoryMovements: [{ kind: "opening" as const, quantity: openingUnits }, { kind: "purchase-received" as const, quantity: receivedUnits }, { kind: "pos-sale" as const, quantity: -soldUnits }, ...(returnedUnits ? [{ kind: "purchase-return" as const, quantity: -returnedUnits }] : [])],
  };
});
export const storeMonthlyOrderLedger = [...storeHistoricalOrders, ...storeSalesOrders];
export const storeDailySalesLedger = storeSeed.salesMonths.flatMap((month, monthIndex) =>
  Array.from({ length: 28 }, (_, dayIndex) => {
    const monthOrders = storeMonthlyOrderLedger.filter((order) => order.date.slice(5, 7) === String(monthIndex + 5).padStart(2, "0") && Number(order.date.slice(-2)) === dayIndex + 1);
    return { month: month.month, date: "2026-" + String(monthIndex + 5).padStart(2, "0") + "-" + String(dayIndex + 1).padStart(2, "0"), netSalesYuan: monthOrders.reduce((sum, order) => sum + order.netAmountYuan, 0) };
  }),
);
const storeMonthLabels = storeSeed.salesMonths.map((item) => item.month);
const derivedSalesMonths = storeMonthLabels.map((month) => ({ month, netSalesYuan: storeDailySalesLedger.filter((row) => row.month === month).reduce((sum, row) => sum + row.netSalesYuan, 0) }));
const storeOrderNetSales = storeSalesOrders.reduce((sum, order) => sum + order.netAmountYuan, 0);
const storeRepeatBuyers = storeCustomerRecords.filter((customer) => customer.repeatBuyer).length;
export const rawStoreSource = {
  ...storeSeed,
  salesMonths: derivedSalesMonths,
  salesPeriod: {
    ...storeSeed.salesPeriod,
    netSalesYuan: storeOrderNetSales,
    salesTargetYuan: storeSeed.salesPeriod.salesTargetYuan,
    previousYearSalesYuan: storePreviousYearOrders.reduce((sum, order) => sum + order.netAmountYuan, 0),
    orders: storeSalesOrders.length,
    previousYearOrders: storePreviousYearOrders.length,
  },
  members: { ...storeSeed.members, active: storeCustomerRecords.filter((customer) => customer.status === "active").length, repeatBuyers: storeRepeatBuyers },
  callbacks: { total: storeCallbackRecords.length, completed: storeCallbackRecords.filter((row) => row.status === "completed").length, pending: storeCallbackRecords.filter((row) => row.status === "pending").length },
  healthService: {
    ...storeSeed.healthService,
    deviceBoundCustomers: storeHealthServiceRecords.filter((row) => row.deviceBound).length,
    plansExecuting: storeHealthServiceRecords.filter((row) => row.planStatus === "executing").length,
    plansDue: storeHealthServiceRecords.filter((row) => row.planStatus === "due").length,
    customersAwaitingDeviceData: storeHealthServiceRecords.filter((row) => row.planStatus === "awaiting-data").length,
  },
  products: storeProductTransactions,
};

const storeProductFlags = rawStoreSource.products.map((product) => ({
  ...product,
  lowStock: product.stock < product.warningLine,
  slowMoving: product.turnoverDays >= 45,
}));
export const storeProductRankRows = [...storeProductFlags]
  .sort((a, b) => b.monthlySalesYuan - a.monthlySalesYuan)
  .slice(0, 3)
  .map((product) => ({ label: product.name, spec: product.spec, productType: product.productType, value: moneyWan(product.monthlySalesYuan), progress: Math.round(product.monthlySalesYuan / Math.max(...rawStoreSource.products.map((item) => item.monthlySalesYuan)) * 100) }));
const storeServiceCounts = [rawStoreSource.healthService.plansExecuting, rawStoreSource.healthService.plansDue, rawStoreSource.healthService.customersAwaitingDeviceData];
const storeServiceShares = roundedShares(storeServiceCounts);
const lowStockProducts = storeProductFlags.filter((product) => product.lowStock);
const slowMovingProducts = storeProductFlags.filter((product) => product.slowMoving);
const storePeriod = rawStoreSource.salesPeriod;
const storeRepeatRate = ratePercent(rawStoreSource.members.repeatBuyers, rawStoreSource.members.repeatEligible);

export const storeMetrics = [
  { label: "本月销售额", value: moneyWan(storePeriod.netSalesYuan), note: `月目标达成 ${ratePercent(storePeriod.netSalesYuan, storePeriod.salesTargetYuan)}% · 同比 ↑${ratePercent(storePeriod.netSalesYuan - storePeriod.previousYearSalesYuan, storePeriod.previousYearSalesYuan)}%`, kind: "up" },
  { label: "会员复购率", value: `${storeRepeatRate}%`, note: `距 ${rawStoreSource.members.repeatTargetPercent}% 目标差 ${rawStoreSource.members.repeatTargetPercent - storeRepeatRate} 个百分点`, kind: "focus" },
  { label: "本月订单", value: `${storePeriod.orders} 笔`, note: `客单价 ¥${Math.round(storePeriod.netSalesYuan / storePeriod.orders)} · 同比 ↑${ratePercent(storePeriod.orders - storePeriod.previousYearOrders, storePeriod.previousYearOrders)}%`, kind: "up" },
  { label: "待完成顾客回访", value: `${rawStoreSource.callbacks.pending} 位`, note: `回访完成率 ${ratePercent(rawStoreSource.callbacks.completed, rawStoreSource.callbacks.total)}%`, kind: "watch" },
  { label: "库存偏低商品", value: `${lowStockProducts.length} 款`, note: "优先核对补货", kind: "focus" },
  { label: "待更新健康方案", value: `${rawStoreSource.healthService.plansDue} 位`, note: "顾客数据更新后需跟进", kind: "focus" },
];
export const storeTrend = rawStoreSource.salesMonths.map((item) => ({ label: item.month, value: yuanToWan(item.netSalesYuan) }));
export const storeCustomerSummary = [
  { label: "活跃会员", value: `${rawStoreSource.members.active} 人` },
  { label: "本月新增会员", value: `${rawStoreSource.members.newThisMonth} 人` },
];
export const storeCustomerService = [
  { label: "方案执行中", count: storeServiceCounts[0], percent: storeServiceShares[0], tone: "good" },
  { label: "待更新方案", count: storeServiceCounts[1], percent: storeServiceShares[1], tone: "watch" },
  { label: "待补充数据", count: storeServiceCounts[2], percent: storeServiceShares[2], tone: "risk" },
];
export const storeDeviceBoundCustomers = rawStoreSource.healthService.deviceBoundCustomers;
export const storeProductFollowups = {
  "low-stock": {
    title: "库存偏低商品", subtitle: `${lowStockProducts.length} 款商品低于门店库存预警线 · 截至昨日（T-1）`, status: "库存预警",
    rows: lowStockProducts.map((product) => ({ name: product.name, spec: product.spec, packLabel: product.productType === "sesame" ? "黑芝麻" : "谷物营养", productType: product.productType, inventory: `${product.stock} 件`, benchmark: `预警线 ${product.warningLine} 件`, recent: `近 7 日销量 ${product.salesLast7Days} 件` })),
  },
  "slow-moving": {
    title: "动销偏慢商品", subtitle: `${slowMovingProducts.length} 款商品近 7 日动销偏慢 · 截至昨日（T-1）`, status: "动销关注",
    rows: slowMovingProducts.map((product) => ({ name: product.name, spec: product.spec, packLabel: product.productType === "porridge" ? "轻食营养" : "谷物营养", productType: product.productType, inventory: `${product.stock} 件`, benchmark: `库存周转 ${product.turnoverDays} 天`, recent: `近 7 日销量 ${product.salesLast7Days} 件` })),
  },
} as const;

// Company-wide regional snapshots, third-party management feeds, and drill-down samples stay separate.
const groupSeed = {
  regions: [
    { region: "华东", stores: 1_214, openedStores: 14, closedStores: 5, activeAgents: 23, agents: 28 },
    { region: "华南", stores: 926, openedStores: 12, closedStores: 4, activeAgents: 19, agents: 23 },
    { region: "华北", stores: 700, openedStores: 10, closedStores: 4, activeAgents: 14, agents: 18 },
    { region: "西南", stores: 652, openedStores: 7, closedStores: 2, activeAgents: 12, agents: 15 },
    { region: "华中", stores: 484, openedStores: 6, closedStores: 2, activeAgents: 8, agents: 10 },
    { region: "西北", stores: 310, openedStores: 4, closedStores: 0, activeAgents: 6, agents: 6 },
  ],
  gmvMonths: [
    { month: "5月", factor: 0.741 }, { month: "6月", factor: 0.808 },
    { month: "7月", factor: 0.772 }, { month: "8月", factor: 0.865 },
    { month: "9月", factor: 0.935 }, { month: "10月", factor: 1 },
  ],
  recruitmentStages: [
    { label: "区域线索", count: 126 }, { label: "有效洽谈", count: 48 },
    { label: "签约代理", count: 21 }, { label: "新店开业", count: 8 },
  ],
  recruitmentTarget: { signedAgentTarget: 27 },
  agentActivity: { active: 82, total: 100, waitingEnablement: 18 },
  membershipTargets: { repeatRatePercent: 45 },
  storeActivity: { activeStores: 3_730, followUpStores: 12, reorderingDealers: 41, eligibleDealers: 100 },
  settlement: {
    monthlyBills: 250, onTimeBills: 243,
    pendingBills: [
      { id: "SET-1028-01", partnerId: "dealer-hy", amountYuan: 286_000, status: "待核对" },
      { id: "SET-1028-02", partnerId: "dealer-wz", amountYuan: 238_000, status: "待核对" },
      { id: "SET-1028-03", partnerId: "store-hz", amountYuan: 160_000, status: "待核对" },
    ],
  },
  healthService: { syncEligible: 25_000, synced: 18_000, customersAwaitingPlanUpdate: 36 },
  aiActions: { generated: 50, adopted: 34, pending: 14, completed: 2 },
  teams: [
    { id: "team-hz", name: "杭州成长团队", leader: "张伟", memberNames: ["张伟", "赵敏"], targetYuan: 80_000, partnerIds: ["dealer-hy", "store-hz"], issue: "目标进度偏慢，重点跟进成员邀约与新人培养。", settlement: [{ member: "张伟", pending: 1_800, settled: 4_600, issue: "无异常" }, { member: "赵敏", pending: 600, settled: 1_500, issue: "无异常" }], tasks: [{ title: "完成重点会员回访并反馈结果", member: "张伟", deadline: "10/30", status: "进行中" }, { title: "完成产品学习与首月复盘", member: "赵敏", deadline: "10/31", status: "待反馈" }] },
    { id: "team-nb", name: "宁波经营团队", leader: "李文娟", memberNames: ["李文娟", "陈晨"], targetYuan: 60_000, partnerIds: ["store-nb"], issue: "一位成员近期未成交，需核对客户跟进与商品推荐情况。", settlement: [{ member: "李文娟", pending: 1_200, settled: 3_200, issue: "无异常" }, { member: "陈晨", pending: 400, settled: 1_000, issue: "1 笔订单待核对" }], tasks: [{ title: "完成本期产品培训", member: "李文娟", deadline: "10/30", status: "进行中" }, { title: "提交客户跟进清单与本周成交计划", member: "陈晨", deadline: "10/30", status: "待反馈" }] },
    { id: "team-wz", name: "温州服务团队", leader: "王芳", memberNames: ["王芳", "刘洋"], targetYuan: 60_000, partnerIds: ["dealer-wz", "store-wz"], issue: "团队目标进度较好，继续跟进门店体验与会员服务。", settlement: [{ member: "王芳", pending: 1_600, settled: 4_200, issue: "无异常" }, { member: "刘洋", pending: 900, settled: 2_400, issue: "无异常" }], tasks: [{ title: "完成本周会员服务复盘", member: "王芳", deadline: "10/28", status: "已完成" }, { title: "收集门店商品体验反馈", member: "刘洋", deadline: "10/31", status: "进行中" }] },
  ],
  teamMembers: [
    { name: "张伟", teamId: "team-hz", district: "杭州 · 直属代理", targetYuan: 50_000, netSalesYuan: 32_000, orderCount: 38, newCustomers: 26, repeatBuyers: 8, repeatEligible: 25, planPushCompleted: 18, planPushEligible: 22, activeDownline: 8, issue: "邀约量较上月下降", active: true, developmentStatus: "持续经营", learned: 4, courses: 4, lastOrder: "10/28", partnerIds: ["dealer-hy", "store-hz"] },
    { name: "李文娟", teamId: "team-nb", district: "宁波 · 二级代理", targetYuan: 36_000, netSalesYuan: 26_000, orderCount: 31, newCustomers: 19, repeatBuyers: 11, repeatEligible: 30, planPushCompleted: 21, planPushEligible: 24, activeDownline: 6, issue: "学习计划待完成", active: true, developmentStatus: "持续经营", learned: 3, courses: 4, lastOrder: "10/28", partnerIds: ["store-nb"] },
    { name: "王芳", teamId: "team-wz", district: "温州 · 服务负责人", targetYuan: 33_721, netSalesYuan: 29_000, orderCount: 42, newCustomers: 28, repeatBuyers: 11, repeatEligible: 25, planPushCompleted: 29, planPushEligible: 30, activeDownline: 10, issue: "暂无重点风险", active: true, developmentStatus: "持续经营", learned: 4, courses: 4, lastOrder: "10/28", partnerIds: ["dealer-wz", "store-wz"] },
    { name: "赵敏", teamId: "team-hz", district: "杭州 · 销售成员", targetYuan: 30_000, netSalesYuan: 18_000, orderCount: 20, newCustomers: 14, repeatBuyers: 4, repeatEligible: 14, planPushCompleted: 8, planPushEligible: 12, activeDownline: 1, issue: "新成员待完成首月培养", active: true, developmentStatus: "新人培养", learned: 2, courses: 4, lastOrder: "10/27", partnerIds: ["store-hz"] },
    { name: "陈晨", teamId: "team-nb", district: "宁波 · 销售成员", targetYuan: 25_000, netSalesYuan: 14_000, orderCount: 16, newCustomers: 11, repeatBuyers: 4, repeatEligible: 15, planPushCompleted: 6, planPushEligible: 9, activeDownline: 1, issue: "连续 7 天未成交", active: false, developmentStatus: "待激活", learned: 1, courses: 4, lastOrder: "10/21", partnerIds: ["store-nb"] },
    { name: "刘洋", teamId: "team-wz", district: "温州 · 销售成员", targetYuan: 25_000, netSalesYuan: 21_000, orderCount: 24, newCustomers: 17, repeatBuyers: 7, repeatEligible: 17, planPushCompleted: 12, planPushEligible: 14, activeDownline: 2, issue: "暂无重点风险", active: true, developmentStatus: "持续经营", learned: 4, courses: 4, lastOrder: "10/28", partnerIds: ["store-wz"] },
  ],
  products: [
    { id: "g-sku-grain", name: "高蛋白谷物粉", spec: "400g/盒", productType: "grain" },
    { id: "g-sku-sesame", name: "低糖芝麻丸", spec: "30粒/盒", productType: "sesame" },
    { id: "g-sku-porridge", name: "轻食营养粥", spec: "300g/盒", productType: "porridge" },
    { id: "g-sku-quinoa", name: "藜麦坚果脆", spec: "180g/袋", productType: "grain" },
    { id: "g-sku-oat", name: "每日燕麦片", spec: "500g/袋", productType: "grain" },
    { id: "g-sku-rice", name: "杂粮糙米饭", spec: "300g/盒", productType: "porridge" },
    { id: "g-sku-blackbean", name: "黑豆谷物粉", spec: "400g/盒", productType: "grain" },
  ],
};

// Build a deterministic store-level ledger. Regional totals, trends, and
// health-state charts are rolled up from these records.
export const groupStoreLifecycleLedger = groupSeed.regions.flatMap((region, regionIndex) => [
  ...Array.from({ length: region.openedStores }, (_, index) => ({
    eventId: "STORE-OPEN-" + String(regionIndex + 1) + "-" + String(index + 1).padStart(3, "0"),
    storeId: "NET-" + String(groupSeed.regions.slice(0, regionIndex).reduce((sum, row) => sum + row.stores, 0) + (regionIndex === 0 ? 3 : 0) + index + 1).padStart(5, "0"),
    region: region.region,
    event: "opened" as const,
    occurredAt: "2026-10-" + String(1 + (index * 5 + regionIndex) % 28).padStart(2, "0"),
  })),
  ...Array.from({ length: region.closedStores }, (_, index) => ({
    eventId: "STORE-CLOSE-" + String(regionIndex + 1) + "-" + String(index + 1).padStart(3, "0"),
    storeId: "NET-CLOSED-" + String(regionIndex + 1) + "-" + String(index + 1).padStart(3, "0"),
    region: region.region,
    event: "closed" as const,
    occurredAt: "2026-10-" + String(1 + (index * 7 + regionIndex) % 28).padStart(2, "0"),
  })),
]);
const groupStoreRecords = (() => {
  let globalIndex = 0;
  const allStores = groupSeed.regions.reduce((sum, region) => sum + region.stores, 0);
  return groupSeed.regions.flatMap((region, regionIndex) => {
    const count = region.stores;
    return Array.from({ length: count }, (_, index) => {
      const priorityStoreIds = ["store-hz", "store-nb", "store-wz"];
      const id = globalIndex < priorityStoreIds.length ? priorityStoreIds[globalIndex] : "NET-" + String(globalIndex + 1).padStart(5, "0");
      const currentGmv = globalIndex === 0 ? rawStoreSource.salesPeriod.netSalesYuan : globalIndex === 1 ? 124_000 : globalIndex === 2 ? 98_000 : 5_000 + ((globalIndex * 137 + regionIndex * 277) % 9_000);
      const memberCount = globalIndex === 0 ? rawStoreSource.members.active : globalIndex === 1 ? 214 : globalIndex === 2 ? 168 : 10 + ((globalIndex * 37 + regionIndex * 11) % 70);
      const newMemberCount = globalIndex === 0 ? rawStoreSource.members.newThisMonth : (globalIndex * 7 + regionIndex) % 6;
      const repeatBuyerCount = globalIndex === 0 ? rawStoreSource.members.repeatBuyers : globalIndex === 1 ? 66 : globalIndex === 2 ? 49 : Math.round(memberCount * (38 + ((globalIndex * 7) % 8)) / 100);
      const transactionCount = globalIndex === 0 ? rawStoreSource.salesPeriod.orders : globalIndex === 1 ? 310 : globalIndex === 2 ? 245 : Math.max(Math.max(1, Math.round(currentGmv / 430)), memberCount + repeatBuyerCount);
      const hash = (globalIndex * 173) % allStores;
      const record = {
        id,
        storeName: globalIndex === 0 ? "杭州延安店" : globalIndex === 1 ? "宁波天一店" : globalIndex === 2 ? "温州五马店" : region.region + "门店" + String(index + 1).padStart(4, "0"),
        region: region.region,
        monthGmvYuan: currentGmv,
        monthlyTargetYuan: globalIndex === 0 ? rawStoreSource.salesPeriod.salesTargetYuan : globalIndex === 1 ? Math.ceil(currentGmv / 0.76) : globalIndex === 2 ? Math.ceil(currentGmv / 0.68) : Math.ceil(Math.round(currentGmv / 1.18) * 1.28),
        previousYearGmvYuan: globalIndex === 0 ? rawStoreSource.salesPeriod.previousYearSalesYuan : globalIndex === 1 ? Math.round(currentGmv / 1.12) : globalIndex === 2 ? Math.round(currentGmv / 1.12) : Math.round(currentGmv / 1.18),
        orderCount: transactionCount,
        memberCount,
        previousYearMemberCount: Math.max(1, memberCount - newMemberCount - Math.round(memberCount * 0.04)),
        newMembers: newMemberCount,
        repeatBuyers: repeatBuyerCount,
        repeatRatePercent: Math.round(repeatBuyerCount / memberCount * 100),
        active: hash < Math.round(allStores * 0.87),
        followUp: hash < groupSeed.storeActivity.followUpStores,
        healthStatus: globalIndex === 0 ? "healthy" : globalIndex === 1 ? "attention" : globalIndex === 2 ? "warning" : hash < Math.round(allStores * 0.746) ? "healthy" : hash < Math.round(allStores * 0.942) ? "attention" : "warning",
        issue: globalIndex === 0 ? "复购率低于门店目标" : globalIndex === 1 ? "返单下滑" : globalIndex === 2 ? "客流下降" : "",
        openedThisMonth: regionIndex === 0 ? index >= 3 && index < region.openedStores + 3 : index < region.openedStores,
        monthlySalesHistory: [] as { month: string; gmvYuan: number }[],
      };
      globalIndex += 1;
      return record;
    });
  });
})();
const monthlyHistoryRows = groupSeed.gmvMonths.flatMap((month, monthIndex) => {
  const values = groupStoreRecords.map((store) => store.id === "store-hz"
    ? storeSeed.salesMonths[monthIndex].netSalesYuan
    : Math.round(store.monthGmvYuan * month.factor));
  groupStoreRecords.forEach((store, index) => store.monthlySalesHistory.push({ month: month.month, gmvYuan: values[index] }));
  return groupStoreRecords.map((store, index) => ({ storeId: store.id, region: store.region, month: month.month, gmvYuan: values[index] }));
});
export const groupStoreLedger = groupStoreRecords;
export const groupStoreMonthlyLedger = monthlyHistoryRows;
const dietaryPreferences = ["清淡均衡", "少盐", "控糖", "高蛋白", "未填写"];
const dietaryRestrictions = ["无", "忌海鲜", "不吃香菜", "乳糖不耐", "坚果过敏", "未填写"];
const groupCustomerPrefix = (storeId: string) => ({ "store-hz": "CUS-HZ", "store-nb": "CUS-NB", "store-wz": "CUS-WZ" }[storeId] || `CUS-${storeId}`);
export const groupStoreCustomerLedger = groupStoreRecords.flatMap((store, storeIndex) => Array.from({ length: store.memberCount }, (_, index) => ({
  customerId: `${groupCustomerPrefix(store.id)}-${String(index + 1).padStart(4, "0")}`,
  storeId: store.id,
  region: store.region,
  status: "active" as const,
  registeredAt: index < store.newMembers
    ? `2026-10-${String(1 + (index * 7 + storeIndex) % 28).padStart(2, "0")}`
    : `2025-${String(1 + (index * 5 + storeIndex) % 9).padStart(2, "0")}-15`,
  age: 28 + (index * 13 + storeIndex * 7) % 48,
  gender: (index + storeIndex) % 2 ? "女" as const : "男" as const,
  newThisMonth: index < store.newMembers,
  repeatBuyer: index < store.repeatBuyers,
  dietPreference: dietaryPreferences[(index * 3 + storeIndex) % dietaryPreferences.length],
  dietaryRestriction: dietaryRestrictions[(index * 5 + storeIndex) % dietaryRestrictions.length],
})));
const aggregateGroupRegions = groupSeed.regions.map((region) => {
  const rows = groupStoreRecords.filter((store) => store.region === region.region);
  const sum = (pick: (store: (typeof groupStoreRecords)[number]) => number) => rows.reduce((total, store) => total + pick(store), 0);
  return {
    region: region.region,
    gmvYuan: sum((store) => store.monthGmvYuan),
    targetYuan: sum((store) => store.monthlyTargetYuan),
    previousYearGmvYuan: sum((store) => store.previousYearGmvYuan),
    stores: rows.length,
    openedStores: groupStoreLifecycleLedger.filter((event) => event.region === region.region && event.event === "opened").length,
    closedStores: groupStoreLifecycleLedger.filter((event) => event.region === region.region && event.event === "closed").length,
    members: groupStoreCustomerLedger.filter((customer) => customer.region === region.region && customer.status === "active").length,
    newMembers: groupStoreCustomerLedger.filter((customer) => customer.region === region.region && customer.newThisMonth).length,
    repeatBuyers: groupStoreCustomerLedger.filter((customer) => customer.region === region.region && customer.repeatBuyer).length,
    activeAgents: 0,
    agents: 0,
  };
});
const aggregateGroupMonths = groupSeed.gmvMonths.map((month) => ({
  month: month.month,
  gmvYuan: groupStoreMonthlyLedger.filter((row) => row.month === month.month).reduce((sum, row) => sum + row.gmvYuan, 0),
}));
const agentRelations = groupSeed.regions.flatMap((region, regionIndex) => Array.from({ length: region.agents }, (_, index) => ({
  id: "AGT-" + regionIndex + "-" + String(index + 1).padStart(3, "0"),
  region: region.region,
  status: index < region.activeAgents ? "active" as const : "inactive" as const,
  tier: index === 0 ? "区域负责人" : index % 5 === 0 ? "一级代理" : "服务代理",
  parentAgentId: index === 0 ? null : "AGT-" + regionIndex + "-" + String(Math.floor((index - 1) / 5) * 5 + 1).padStart(3, "0"),
  lastActivityDate: index < region.activeAgents ? "2026-10-" + String(1 + (index * 3) % 28).padStart(2, "0") : null,
})));
export const rawAgentRecords = agentRelations.map((agent) => ({
  ...agent,
  downlineCount: agentRelations.filter((child) => child.parentAgentId === agent.id).length,
}));
const completeGroupRegions = aggregateGroupRegions.map((region) => ({
  ...region,
  activeAgents: rawAgentRecords.filter((agent) => agent.region === region.region && agent.status === "active").length,
  agents: rawAgentRecords.filter((agent) => agent.region === region.region).length,
}));
const dealerIds = Array.from({ length: groupSeed.storeActivity.eligibleDealers }, (_, index) => index === 0 ? "dealer-hy" : index === 1 ? "dealer-wz" : "DEALER-" + String(index + 1).padStart(3, "0"));
export const groupDealerPurchaseOrderLedger = dealerIds.slice(0, groupSeed.storeActivity.reorderingDealers).flatMap((dealerId, dealerIndex) => {
  const orderCount = dealerIndex === 0 ? 6 : dealerIndex === 1 ? 4 : 1 + (dealerIndex % 3);
  const totalYuan = dealerIndex === 0 ? 128_000 : dealerIndex === 1 ? 82_000 : 30_000 + ((dealerIndex * 1_773) % 70_000);
  const amounts = allocateWeightedTotal(totalYuan / 100, orderCount, dealerIndex + 31).map((units) => units * 100);
  return amounts.map((amountYuan, orderIndex) => ({
    id: "DPO-" + String(dealerIndex + 1).padStart(3, "0") + "-" + String(orderIndex + 1).padStart(2, "0"),
    dealerId,
    orderDate: "2026-10-" + String(1 + (dealerIndex * 7 + orderIndex * 5) % 28).padStart(2, "0"),
    amountYuan,
    status: "received" as const,
  }));
});
export const groupDealerPurchaseLineLedger = groupDealerPurchaseOrderLedger.flatMap((order, orderIndex) => {
  const quantities = allocateCount(order.amountYuan / 100, 3, orderIndex * 11);
  return quantities.map((quantity, lineIndex) => ({
    orderId: order.id,
    skuId: groupSeed.products[(orderIndex + lineIndex) % groupSeed.products.length].id,
    quantity,
    unitPriceYuan: 100,
    netAmountYuan: quantity * 100,
  }));
});
export const groupDealerRecords = dealerIds.map((id, index) => {
  const orders = groupDealerPurchaseOrderLedger.filter((order) => order.dealerId === id);
  return {
    id,
    region: groupSeed.regions[index % groupSeed.regions.length].region,
    reorderStatus: orders.length ? "reordered" as const : "no-reorder" as const,
    purchaseOrderCount: orders.length,
    monthlyPurchaseYuan: orders.reduce((sum, order) => sum + order.amountYuan, 0),
    lastOrderDate: orders.map((order) => order.orderDate).sort().at(-1) || null,
    monthlyTargetYuan: index === 0 ? 139_130 : index === 1 ? 105_130 : Math.max(30_000, Math.round(orders.reduce((sum, order) => sum + order.amountYuan, 0) / 0.85)),
    reorderCycleDays: index === 0 ? 18 : index === 1 ? 26 : 16 + (index * 7) % 18,
    stockTurnoverDays: index === 0 ? 32 : index === 1 ? 46 : 24 + (index * 11) % 35,
  };
});
export const groupRecruitmentLeadRecords = (() => {
  const stageCounts = groupSeed.recruitmentStages;
  return Array.from({ length: stageCounts[0].count }, (_, index) => ({
    id: "LEAD-" + String(index + 1).padStart(4, "0"),
    stage: index < stageCounts[3].count ? "opened" as const
      : index < stageCounts[2].count ? "signed" as const
        : index < stageCounts[1].count ? "qualified" as const : "new" as const,
    region: groupSeed.regions[index % groupSeed.regions.length].region,
    createdAt: "2026-10-" + String(1 + (index * 5) % 28).padStart(2, "0"),
  }));
})();
export const groupSettlementBillRecords = (() => {
  const pending = groupSeed.settlement.pendingBills;
  const paidOnTime = groupSeed.settlement.onTimeBills;
  const count = groupSeed.settlement.monthlyBills;
  return Array.from({ length: count }, (_, index) => {
    const pendingBill = pending[index - (count - pending.length)];
    return {
      id: pendingBill?.id || "SET-202610-" + String(index + 1).padStart(4, "0"),
      partnerId: pendingBill?.partnerId || ["dealer-hy", "dealer-wz", "store-hz", "store-nb", "store-wz"][index % 5],
      amountYuan: pendingBill?.amountYuan ?? 3_000 + ((index * 137) % 8_000),
      status: pendingBill ? "pending" as const : index < paidOnTime ? "paid-on-time" as const : "paid-late" as const,
    };
  });
})();
const hzHealthSyncRecords = storeHealthServiceRecords.map((record) => ({
  ...record,
  storeId: "store-hz",
  syncStatus: record.planStatus === "awaiting-data" ? "not-synced" as const : "synced" as const,
  planUpdateDue: record.planStatus === "due",
}));
const nbHealthSyncRecords = Array.from({ length: 214 }, (_, index) => ({
  customerId: "CUS-NB-" + String(index + 1).padStart(4, "0"),
  storeId: "store-nb",
  deviceBound: true as const,
  syncStatus: index < 193 ? "synced" as const : "not-synced" as const,
  planStatus: index < 9 ? "due" as const : index < 193 ? "executing" as const : "awaiting-data" as const,
  planUpdateDue: index < 9,
}));
const wzHealthSyncRecords = Array.from({ length: 168 }, (_, index) => ({
  customerId: "CUS-WZ-" + String(index + 1).padStart(4, "0"),
  storeId: "store-wz",
  deviceBound: true as const,
  syncStatus: index < 151 ? "synced" as const : "not-synced" as const,
  planStatus: index < 7 ? "due" as const : index < 151 ? "executing" as const : "awaiting-data" as const,
  planUpdateDue: index < 7,
}));
const groupOtherHealthEligible = groupSeed.healthService.syncEligible - hzHealthSyncRecords.length - nbHealthSyncRecords.length - wzHealthSyncRecords.length;
const groupOtherHealthSynced = groupSeed.healthService.synced - hzHealthSyncRecords.filter((row) => row.syncStatus === "synced").length - nbHealthSyncRecords.filter((row) => row.syncStatus === "synced").length - wzHealthSyncRecords.filter((row) => row.syncStatus === "synced").length;
const groupOtherPlanDue = groupSeed.healthService.customersAwaitingPlanUpdate - hzHealthSyncRecords.filter((row) => row.planUpdateDue).length - nbHealthSyncRecords.filter((row) => row.planUpdateDue).length - wzHealthSyncRecords.filter((row) => row.planUpdateDue).length;
export const groupHealthSyncRecords = [
  ...hzHealthSyncRecords,
  ...nbHealthSyncRecords,
  ...wzHealthSyncRecords,
  ...Array.from({ length: groupOtherHealthEligible }, (_, index) => ({
    storeId: groupStoreRecords[3 + index % (groupStoreRecords.length - 3)].id,
    customerId: `CUS-${groupStoreRecords[3 + index % (groupStoreRecords.length - 3)].id}-${String(1 + Math.floor(index / (groupStoreRecords.length - 3))).padStart(4, "0")}`,
    deviceBound: true as const,
    syncStatus: index < groupOtherHealthSynced ? "synced" as const : "not-synced" as const,
    planStatus: index < groupOtherPlanDue ? "due" as const : index < groupOtherHealthSynced ? "executing" as const : "awaiting-data" as const,
    planUpdateDue: index < groupOtherPlanDue,
  })),
];
export const groupStoreCallbackLedger = [
  ...storeCallbackRecords.map((record) => ({ ...record, storeId: "store-hz" })),
  ...Array.from({ length: 40 }, (_, index) => ({ id: "CALL-NB-" + String(index + 1).padStart(3, "0"), customerId: "CUS-NB-" + String(index + 1).padStart(4, "0"), storeId: "store-nb", status: index < 16 ? "completed" as const : "pending" as const, dueAt: "2026-10-" + String(1 + (index * 7) % 28).padStart(2, "0") })),
  ...Array.from({ length: 36 }, (_, index) => ({ id: "CALL-WZ-" + String(index + 1).padStart(3, "0"), customerId: "CUS-WZ-" + String(index + 1).padStart(4, "0"), storeId: "store-wz", status: index < 15 ? "completed" as const : "pending" as const, dueAt: "2026-10-" + String(1 + (index * 9) % 28).padStart(2, "0") })),
  ...groupStoreRecords.filter((store) => !["store-hz", "store-nb", "store-wz"].includes(store.id)).flatMap((store, storeIndex) => {
    const total = 2 + storeIndex % 5;
    const completed = Math.round(total * 0.76);
    return Array.from({ length: total }, (_, index) => ({ id: "CALL-" + store.id + "-" + String(index + 1).padStart(2, "0"), customerId: "CUS-" + store.id + "-" + String(index + 1).padStart(4, "0"), storeId: store.id, status: index < completed ? "completed" as const : "pending" as const, dueAt: "2026-10-" + String(1 + (index * 11 + storeIndex) % 28).padStart(2, "0") }));
  }),
];
export const groupAiActionRecords = Array.from({ length: groupSeed.aiActions.generated }, (_, index) => ({
  id: "AI-ACTION-" + String(index + 1).padStart(3, "0"),
  status: index < groupSeed.aiActions.completed ? "completed" as const
    : index < groupSeed.aiActions.completed + groupSeed.aiActions.adopted - groupSeed.aiActions.completed ? "adopted" as const
      : index < groupSeed.aiActions.completed + groupSeed.aiActions.adopted - groupSeed.aiActions.completed + groupSeed.aiActions.pending ? "pending" as const : "not-adopted" as const,
}));
export const groupStoreProductLedger = groupSeed.products.flatMap((product, productIndex) => {
  const unitPriceYuan = [200, 150, 100, 125, 100, 100, 100][productIndex];
  const salesShare = [0.032, 0.024, 0.018, 0.014, 0.012, 0.01, 0.008][productIndex];
  const targetCoverageDays = [20, 24, 58, 52, 18, 61, 33][productIndex];
  return groupStoreRecords.map((store, index) => {
    const soldUnits = store.id === "store-hz" ? rawStoreSource.products.find((row) => row.name === product.name)!.monthlyUnits : Math.round(store.monthGmvYuan * salesShare / unitPriceYuan);
    const stockUnits = store.id === "store-hz" ? rawStoreSource.products.find((row) => row.name === product.name)!.stock : Math.round(soldUnits * targetCoverageDays / 30);
    const receivedUnits = store.id === "store-hz" ? rawStoreSource.products.find((row) => row.name === product.name)!.receivedUnits : Math.min(stockUnits + soldUnits, Math.max(0, Math.round(soldUnits * 1.18)));
    const returnedUnits = store.id === "store-hz" ? rawStoreSource.products.find((row) => row.name === product.name)!.returnedUnits : productIndex === 2 && soldUnits > 0 && index % 29 === 0 ? Math.max(1, Math.round(soldUnits * 0.03)) : 0;
    const openingUnits = Math.max(0, stockUnits - receivedUnits + soldUnits + returnedUnits);
    return {
    storeId: store.id,
    skuId: product.id,
    productName: product.name,
    spec: product.spec,
    productType: product.productType,
    unitPriceYuan: store.id === "store-hz" ? rawStoreSource.products.find((row) => row.name === product.name)!.unitPriceYuan : unitPriceYuan,
    soldUnits,
    salesYuan: soldUnits * (store.id === "store-hz" ? rawStoreSource.products.find((row) => row.name === product.name)!.unitPriceYuan : unitPriceYuan),
    stockUnits,
    warningStockUnits: store.id === "store-hz" ? rawStoreSource.products.find((row) => row.name === product.name)!.warningLine : Math.ceil(soldUnits * (targetCoverageDays < 30 ? 1 : 0.8)),
    receivedUnits,
    returnedUnits,
    purchaseUnitPriceYuan: [90, 50, 60, 58, 48, 52, 55][productIndex],
    inventoryMovements: [
      { kind: "opening" as const, quantity: openingUnits },
      { kind: "purchase-received" as const, quantity: receivedUnits },
      { kind: "pos-sale" as const, quantity: -soldUnits },
      ...(returnedUnits ? [{ kind: "purchase-return" as const, quantity: -returnedUnits }] : []),
    ],
  };
  });
});
const groupRetailItemLines = [
  ...storeOrderLines.map((line) => ({ ...line, storeId: "store-hz" })),
  ...groupStoreProductLedger.filter((product) => product.storeId !== "store-hz").flatMap((product, productIndex) => {
  const store = groupStoreRecords.find((row) => row.id === product.storeId)!;
  const storeNumber = Number(product.storeId.replace(/\D/g, "").slice(-3) || 0);
  const quantities = allocateCount(product.soldUnits, store.orderCount, productIndex * 19 + storeNumber);
  return quantities.flatMap((quantity, orderIndex) => quantity ? [{
    orderId: `POS-${product.storeId}-${String(orderIndex + 1).padStart(4, "0")}`,
    storeId: product.storeId,
    skuId: product.skuId,
    productName: product.productName,
    quantity,
    unitPriceYuan: product.unitPriceYuan,
    netAmountYuan: quantity * product.unitPriceYuan,
  }] : []);
  }),
];
const groupItemAmountByOrder = new Map<string, number>();
for (const line of groupRetailItemLines) groupItemAmountByOrder.set(line.orderId, (groupItemAmountByOrder.get(line.orderId) || 0) + line.netAmountYuan);
export const groupRetailOrderLedger = groupStoreRecords.flatMap((store, storeIndex) => {
  if (store.id === "store-hz") return storeSalesOrders.map((order) => ({ ...order, storeId: store.id }));
  const otherGoodsSales = store.monthGmvYuan - groupStoreProductLedger.filter((product) => product.storeId === store.id).reduce((sum, product) => sum + product.salesYuan, 0);
  const otherGoodsWeights = Array.from({ length: store.orderCount }, (_, orderIndex) => 100 + (groupItemAmountByOrder.get(`POS-${store.id}-${String(orderIndex + 1).padStart(4, "0")}`) || 0));
  const otherGoodsByOrder = allocateByWeights(otherGoodsSales, otherGoodsWeights);
  const customerAssignments = Array.from({ length: store.memberCount }, (_, index) => `${groupCustomerPrefix(store.id)}-${String(index + 1).padStart(4, "0")}`);
  for (let index = 0; index < store.repeatBuyers; index += 1) customerAssignments.push(`${groupCustomerPrefix(store.id)}-${String(index + 1).padStart(4, "0")}`);
  let extraOrderIndex = 0;
  return Array.from({ length: store.orderCount }, (_, orderIndex) => {
    const id = `POS-${store.id}-${String(orderIndex + 1).padStart(4, "0")}`;
    const skuSales = groupItemAmountByOrder.get(id) || 0;
    const customerId = customerAssignments[orderIndex] || `${groupCustomerPrefix(store.id)}-${String(1 + extraOrderIndex++ % Math.max(1, store.repeatBuyers)).padStart(4, "0")}`;
    return {
      id,
      storeId: store.id,
      customerId,
      date: `2026-10-${String(1 + (orderIndex * 11 + storeIndex * 3) % 28).padStart(2, "0")}`,
      status: "paid" as const,
      netAmountYuan: skuSales + otherGoodsByOrder[orderIndex],
    };
  });
});
const groupOrdersByStore = new Map<string, typeof groupRetailOrderLedger>();
for (const order of groupRetailOrderLedger) groupOrdersByStore.set(order.storeId, [...(groupOrdersByStore.get(order.storeId) || []), order]);
export const groupRetailOrderLineLedger = [
  ...groupRetailItemLines,
  ...groupRetailOrderLedger.map((order) => {
    const remainder = order.netAmountYuan - (groupItemAmountByOrder.get(order.id) || 0);
    return {
      orderId: order.id,
      storeId: order.storeId,
      skuId: "g-sku-other-food",
      productName: "其他食品组合",
      quantity: 1,
      unitPriceYuan: remainder,
      netAmountYuan: remainder,
    };
  }),
];
for (const store of groupStoreRecords) {
  const orders = groupOrdersByStore.get(store.id) || [];
  store.monthGmvYuan = orders.reduce((sum, order) => sum + order.netAmountYuan, 0);
  store.orderCount = orders.length;
}
export const groupStoreInventoryMovementLedger = groupStoreProductLedger.flatMap((product) => product.inventoryMovements.map((movement, index) => ({
  movementId: `INV-${product.storeId}-${product.skuId}-${String(index + 1).padStart(2, "0")}`,
  storeId: product.storeId,
  skuId: product.skuId,
  productName: product.productName,
  kind: movement.kind,
  quantity: movement.quantity,
  unitPriceYuan: product.purchaseUnitPriceYuan,
})));
export const teamRetailOrderLedger = groupSeed.teamMembers.flatMap((member, memberIndex) => {
  const amounts = allocateCount(member.netSalesYuan, member.orderCount, memberIndex * 13);
  return Array.from({ length: member.orderCount }, (_, orderIndex) => ({
    id: "TEAM-POS-" + String(memberIndex + 1).padStart(2, "0") + "-" + String(orderIndex + 1).padStart(3, "0"),
    memberName: member.name,
    customerId: "TEAM-CUS-" + String(memberIndex + 1).padStart(2, "0") + "-" + String(1 + (orderIndex * 7) % member.repeatEligible).padStart(3, "0"),
    orderDate: "2026-10-" + String(1 + (orderIndex * 11 + memberIndex * 3) % 28).padStart(2, "0"),
    netAmountYuan: amounts[orderIndex],
    status: "paid" as const,
  }));
});
export const teamCustomerCohortLedger = groupSeed.teamMembers.flatMap((member, memberIndex) => Array.from({ length: member.repeatEligible }, (_, index) => ({
  memberName: member.name,
  customerId: "TEAM-CUS-" + String(memberIndex + 1).padStart(2, "0") + "-" + String(index + 1).padStart(3, "0"),
  eligibleForRepurchase: true as const,
  repeatedThisMonth: index < member.repeatBuyers,
})));
export const teamNewCustomerLedger = groupSeed.teamMembers.flatMap((member, memberIndex) => Array.from({ length: member.newCustomers }, (_, index) => ({
  memberName: member.name,
  customerId: "TEAM-NEW-" + String(memberIndex + 1).padStart(2, "0") + "-" + String(index + 1).padStart(3, "0"),
  registeredAt: "2026-10-" + String(1 + (index * 7 + memberIndex) % 28).padStart(2, "0"),
})));
export const teamPlanPushLedger = groupSeed.teamMembers.flatMap((member, memberIndex) => Array.from({ length: member.planPushEligible }, (_, index) => ({
  memberName: member.name,
  planId: "TEAM-PLAN-" + String(memberIndex + 1).padStart(2, "0") + "-" + String(index + 1).padStart(3, "0"),
  status: index < member.planPushCompleted ? "pushed" as const : "pending-review" as const,
})));
export const teamDownlineLedger = groupSeed.teamMembers.flatMap((member, memberIndex) => Array.from({ length: member.activeDownline }, (_, index) => ({
  memberName: member.name,
  agentId: "DOWNLINE-" + String(memberIndex + 1).padStart(2, "0") + "-" + String(index + 1).padStart(3, "0"),
  status: "active" as const,
})));
const aggregateTeamMembers = groupSeed.teamMembers.map((member) => {
  const orders = teamRetailOrderLedger.filter((order) => order.memberName === member.name);
  const cohort = teamCustomerCohortLedger.filter((customer) => customer.memberName === member.name);
  const newCustomers = teamNewCustomerLedger.filter((customer) => customer.memberName === member.name);
  const planPushes = teamPlanPushLedger.filter((plan) => plan.memberName === member.name);
  const downline = teamDownlineLedger.filter((agent) => agent.memberName === member.name);
  return {
    ...member,
    netSalesYuan: orders.reduce((sum, order) => sum + order.netAmountYuan, 0),
    orderCount: orders.length,
    newCustomers: newCustomers.length,
    repeatBuyers: cohort.filter((customer) => customer.repeatedThisMonth).length,
    repeatEligible: cohort.filter((customer) => customer.eligibleForRepurchase).length,
    planPushCompleted: planPushes.filter((plan) => plan.status === "pushed").length,
    planPushEligible: planPushes.length,
    activeDownline: downline.filter((agent) => agent.status === "active").length,
  };
});
const aggregateGroupProducts = groupSeed.products.map((product) => {
  const rows = groupStoreProductLedger.filter((row) => row.skuId === product.id);
  const monthlyUnits = rows.reduce((total, row) => total + row.soldUnits, 0);
  const stockUnits = rows.reduce((total, row) => total + row.stockUnits, 0);
  const warningStockUnits = rows.reduce((total, row) => total + row.warningStockUnits, 0);
  return {
    ...product,
    monthlySalesYuan: rows.reduce((total, row) => total + row.salesYuan, 0),
    stock: stockUnits,
    warningLine: warningStockUnits,
    turnoverDays: monthlyUnits ? Math.ceil(stockUnits * 30 / monthlyUnits) : 0,
  };
});
export const rawGroupSource = {
  ...groupSeed,
  regions: completeGroupRegions,
  gmvMonths: aggregateGroupMonths,
  agentActivity: {
    active: rawAgentRecords.filter((agent) => agent.status === "active").length,
    total: rawAgentRecords.length,
    waitingEnablement: rawAgentRecords.filter((agent) => agent.status === "inactive").length,
  },
  storeActivity: {
    ...groupSeed.storeActivity,
    activeStores: groupStoreRecords.filter((store) => store.active).length,
    followUpStores: groupStoreRecords.filter((store) => store.followUp).length,
    reorderingDealers: groupDealerRecords.filter((dealer) => dealer.reorderStatus === "reordered").length,
    eligibleDealers: groupDealerRecords.length,
  },
  storeHealth: {
    healthy: groupStoreRecords.filter((store) => store.healthStatus === "healthy").length,
    attention: groupStoreRecords.filter((store) => store.healthStatus === "attention").length,
    warning: groupStoreRecords.filter((store) => store.healthStatus === "warning").length,
  },
  members: {
    active: groupStoreCustomerLedger.filter((customer) => customer.status === "active").length,
    newThisMonth: groupStoreCustomerLedger.filter((customer) => customer.newThisMonth).length,
    repeatBuyers: groupStoreCustomerLedger.filter((customer) => customer.repeatBuyer).length,
    previousYearTotal: groupStoreRecords.reduce((sum, store) => sum + store.previousYearMemberCount, 0),
  },
  recruitmentStages: [
    { label: "区域线索", count: groupRecruitmentLeadRecords.length },
    { label: "有效洽谈", count: groupRecruitmentLeadRecords.filter((lead) => ["qualified", "signed", "opened"].includes(lead.stage)).length },
    { label: "签约代理", count: groupRecruitmentLeadRecords.filter((lead) => ["signed", "opened"].includes(lead.stage)).length },
    { label: "新店开业", count: groupRecruitmentLeadRecords.filter((lead) => lead.stage === "opened").length },
  ],
  settlement: {
    ...groupSeed.settlement,
    monthlyBills: groupSettlementBillRecords.length,
    onTimeBills: groupSettlementBillRecords.filter((bill) => bill.status === "paid-on-time").length,
    pendingBills: groupSettlementBillRecords.filter((bill) => bill.status === "pending"),
  },
  healthService: {
    syncEligible: groupHealthSyncRecords.length,
    synced: groupHealthSyncRecords.filter((row) => row.syncStatus === "synced").length,
    customersAwaitingPlanUpdate: groupHealthSyncRecords.filter((row) => row.planUpdateDue).length,
  },
  aiActions: {
    generated: groupAiActionRecords.length,
    adopted: groupAiActionRecords.filter((row) => row.status === "adopted" || row.status === "completed").length,
    pending: groupAiActionRecords.filter((row) => row.status === "pending").length,
    completed: groupAiActionRecords.filter((row) => row.status === "completed").length,
  },
  products: aggregateGroupProducts,
  teamMembers: aggregateTeamMembers,
  priorityStoreFacts: groupStoreRecords.filter((store) => ["store-hz", "store-nb", "store-wz"].includes(store.id)),
};

const sumBy = <T,>(rows: T[], value: (row: T) => number) => rows.reduce((total, row) => total + value(row), 0);
const groupGmv = sumBy(rawGroupSource.regions, (row) => row.gmvYuan);
const groupTarget = sumBy(rawGroupSource.regions, (row) => row.targetYuan);
const groupPreviousYearGmv = sumBy(rawGroupSource.regions, (row) => row.previousYearGmvYuan);
const groupStores = sumBy(rawGroupSource.regions, (row) => row.stores);
const groupNewStores = sumBy(rawGroupSource.regions, (row) => row.openedStores) - sumBy(rawGroupSource.regions, (row) => row.closedStores);
const groupMembers = sumBy(rawGroupSource.regions, (row) => row.members);
const groupNewMembers = sumBy(rawGroupSource.regions, (row) => row.newMembers);
const groupRepeatRate = ratePercent(sumBy(rawGroupSource.regions, (row) => row.repeatBuyers), groupMembers);
const groupAgentRate = ratePercent(rawGroupSource.agentActivity.active, rawGroupSource.agentActivity.total);
const groupStoreActiveRate = ratePercent(rawGroupSource.storeActivity.activeStores, groupStores);
const groupProductFlags = rawGroupSource.products.map((product) => ({ ...product, lowStock: product.stock < product.warningLine, slowMoving: product.turnoverDays >= 45 }));
const groupAtRiskProducts = groupProductFlags.filter((product) => product.lowStock || product.slowMoving);
const groupSlowProducts = groupProductFlags.filter((product) => product.slowMoving);
const groupTopProducts = [...groupProductFlags].sort((a, b) => b.monthlySalesYuan - a.monthlySalesYuan).slice(0, 3);
const groupSettlementPendingYuan = sumBy(rawGroupSource.settlement.pendingBills, (row) => row.amountYuan);
const groupHealthSyncRate = ratePercent(rawGroupSource.healthService.synced, rawGroupSource.healthService.syncEligible);
const groupActionAdoptionRate = ratePercent(rawGroupSource.aiActions.adopted, rawGroupSource.aiActions.generated);

const groupSignedTargetPercent = ratePercent(rawGroupSource.recruitmentStages[2].count, rawGroupSource.recruitmentTarget.signedAgentTarget);
export const groupMetrics = [
  { label: "集团销售额 GMV", value: moneyWan(groupGmv), note: `同比 ↑${ratePercent(groupGmv - groupPreviousYearGmv, groupPreviousYearGmv)}% · 月目标达成 ${ratePercent(groupGmv, groupTarget)}%`, kind: "up" },
  { label: "会员复购率", value: groupRepeatRate + "%", note: "距 " + rawGroupSource.membershipTargets.repeatRatePercent + "% 目标差 " + (rawGroupSource.membershipTargets.repeatRatePercent - groupRepeatRate) + " 个百分点", kind: "focus" },
  { label: "门店网络规模", value: `${groupStores.toLocaleString("zh-CN")} 家`, note: `本月净增 ${groupNewStores} 家`, kind: "plain" },
  { label: "会员总量", value: `${(groupMembers / 10_000).toFixed(1)}w`, note: `本月新增 ${(groupNewMembers / 10_000).toFixed(1)}w · 同比 ↑${ratePercent(groupMembers - rawGroupSource.members.previousYearTotal, rawGroupSource.members.previousYearTotal)}%`, kind: "up" },
  { label: "招商达成", value: `${groupSignedTargetPercent}%`, note: `已签约 ${rawGroupSource.recruitmentStages[2].count} 家 · 当前开业 ${rawGroupSource.recruitmentStages.at(-1)!.count} 家`, kind: "focus" },
  { label: "代理团队活跃率", value: `${groupAgentRate}%`, note: `${rawGroupSource.agentActivity.waitingEnablement} 位代理待赋能`, kind: "watch" },
  { label: "产品动销预警", value: `${groupAtRiskProducts.length} 款`, note: `${groupSlowProducts.length} 款库存周转偏慢`, kind: "focus" },
  { label: "待结算分账", value: moneyWan(groupSettlementPendingYuan), note: `${rawGroupSource.settlement.pendingBills.length} 笔待核对 · 按期分账率 ${ratePercent(rawGroupSource.settlement.onTimeBills, rawGroupSource.settlement.monthlyBills)}%`, kind: "plain" },
];
export const cockpitDimensions = [
  { title: "业绩", value: moneyWan(groupGmv), metric: "本月 GMV · 同比 +" + ratePercent(groupGmv - groupPreviousYearGmv, groupPreviousYearGmv) + "%", detail: "复购率 " + groupRepeatRate + "%，低于 " + rawGroupSource.membershipTargets.repeatRatePercent + "% 目标", source: "门店级销售台账", tone: "up" },
  { title: "市场", value: `${groupSignedTargetPercent}%`, metric: "招商签约目标达成", detail: `${rawGroupSource.recruitmentStages[0].count} 条线索 · ${rawGroupSource.recruitmentStages[2].count} 家签约 · ${rawGroupSource.recruitmentStages.at(-1)!.count} 家开业`, source: "招商跟进记录", tone: "watch" },
  { title: "团队", value: `${groupAgentRate}%`, metric: "代理活跃率", detail: `${rawGroupSource.agentActivity.waitingEnablement} 位代理待赋能`, source: "第三方层级与活跃数据", tone: "up" },
  { title: "产品", value: `${groupAtRiskProducts.length} 款`, metric: "商品动销预警", detail: `${groupSlowProducts.length} 款库存周转偏慢`, source: "商品库存与销售快照", tone: "risk" },
  { title: "门店运营", value: `${groupStoreActiveRate}%`, metric: "门店活跃度", detail: `返单经销商 ${ratePercent(rawGroupSource.storeActivity.reorderingDealers, rawGroupSource.storeActivity.eligibleDealers)}% · ${rawGroupSource.storeActivity.followUpStores} 家门店待跟进`, source: "门店经营与第三方返单数据", tone: "watch" },
  { title: "财务分账", value: moneyWan(groupSettlementPendingYuan), metric: "待核对分账", detail: `按期分账率 ${ratePercent(rawGroupSource.settlement.onTimeBills, rawGroupSource.settlement.monthlyBills)}% · ${rawGroupSource.settlement.pendingBills.length} 笔`, source: "第三方分账数据", tone: "watch" },
  { title: "顾客健康服务", value: `${groupHealthSyncRate}%`, metric: "近 7 天设备数据同步率", detail: `${rawGroupSource.healthService.customersAwaitingPlanUpdate} 位顾客待更新方案`, source: "硬件数据聚合", tone: "up" },
  { title: "AI 执行闭环", value: `${groupActionAdoptionRate}%`, metric: "建议采纳率", detail: `${rawGroupSource.aiActions.pending} 项行动待跟进`, source: "AI 任务记录", tone: "up" },
];
export const groupTrend = rawGroupSource.gmvMonths.map((item) => ({ label: item.month, value: yuanToWan(item.gmvYuan) }));
export const managedTeams = rawGroupSource.teams.map((team) => ({ ...team, target: team.targetYuan }));
export const teamRows = rawGroupSource.teamMembers.map((member) => ({
  ...member,
  gmv: moneyWan(member.netSalesYuan),
  progress: ratePercent(member.netSalesYuan, member.targetYuan),
  orders: `${member.orderCount} 单`,
  newCustomerCount: member.newCustomers,
  newCustomers: `${member.newCustomers} 人`,
  repurchase: `${ratePercent(member.repeatBuyers, member.repeatEligible)}%`,
  planPush: `${member.planPushCompleted} / ${member.planPushEligible}`,
  activeTeam: `${member.activeDownline} 人`,
}));
export const memberDevelopment = Object.fromEntries(rawGroupSource.teamMembers.map((member) => [member.name, {
  status: member.developmentStatus,
  active: member.active,
  learned: member.learned,
  courses: member.courses,
  lastOrder: member.lastOrder,
  partners: member.partnerIds,
}]));
export const storeAgentRoster = rawGroupSource.teams
  .filter((team) => team.partnerIds.includes("store-hz"))
  .flatMap((team) => team.memberNames
    .filter((name) => name !== team.leader)
    .flatMap((name) => {
      const member = rawGroupSource.teamMembers.find((item) => item.teamId === team.id && item.name === name);
      return member && member.partnerIds.includes("store-hz") ? [member] : [];
    }))
  .map((member) => ({ id: `AGENT-${member.teamId}-${member.name}`, name: member.name, teamId: member.teamId, roleLabel: "团队", employeeCount: storeEmployeeRoster.filter((employee) => employee.agentName === member.name).length, salesYuan: member.netSalesYuan, targetYuan: member.targetYuan, orderCount: member.orderCount, newCustomers: member.newCustomers, repeatRatePercent: ratePercent(member.repeatBuyers, member.repeatEligible), active: member.active, issue: member.issue }));
const groupStageStart = rawGroupSource.recruitmentStages[0].count;
export const groupRecruitmentFunnel = rawGroupSource.recruitmentStages.map((stage) => ({ label: stage.label, count: String(stage.count), progress: Math.round(stage.count / groupStageStart * 100) }));
const groupHealthCounts = [rawGroupSource.storeHealth.healthy, rawGroupSource.storeHealth.attention, rawGroupSource.storeHealth.warning];
const groupHealthShares = roundedShares(groupHealthCounts);
export const groupStoreHealth = [
  { label: "健康", count: groupHealthCounts[0], percent: groupHealthShares[0], tone: "good" },
  { label: "关注", count: groupHealthCounts[1], percent: groupHealthShares[1], tone: "watch" },
  { label: "预警", count: groupHealthCounts[2], percent: groupHealthShares[2], tone: "risk" },
];
export const productRankRows = groupTopProducts.map((product) => ({ label: product.name, spec: product.spec, productType: product.productType, value: moneyWan(product.monthlySalesYuan), progress: Math.round(product.monthlySalesYuan / groupTopProducts[0].monthlySalesYuan * 100) }));

export const storeBusinessSourceForAi = {
  sourceScope: "门店经营事实按订单、顾客、回访、健康服务和商品库存流水汇总；顾客健康值只提供聚合状态，不包含姓名或个人健康结论。",
  sourceLineage: {
    currentMonthOrders: storeSalesOrders.length,
    allPeriodOrderHeaders: storeMonthlyOrderLedger.length,
    historicalOrderHeaders: storeHistoricalOrders.length,
    currentMonthOrderLines: storeOrderLines.length,
    orderNetAmountYuan: storeSalesOrders.reduce((sum, order) => sum + order.netAmountYuan, 0),
    activeCustomerRecords: storeCustomerRecords.filter((customer) => customer.status === "active").length,
    customerRecordsWithOrderSummary: storeCustomerRecords.length,
    callbackRecords: storeCallbackRecords.length,
    healthServiceRecords: storeHealthServiceRecords.length,
    dailyHealthReadings: storeHealthDailyReadingLedger.length,
    customerProfileRecords: storeCustomerRecords.length,
    inventoryMovementRecords: storeProductTransactions.reduce((sum, product) => sum + product.inventoryMovements.length, 0),
    dailySalesRecords: storeDailySalesLedger.length,
    employeeRecords: storeEmployeeRecords.length,
  },
  salesPeriod: storePeriod,
  memberFacts: rawStoreSource.members,
  callbackFacts: rawStoreSource.callbacks,
  productFacts: storeProductFlags,
  healthServiceFacts: rawStoreSource.healthService,
  employeeOperatingFacts: storeEmployeeRecords.map(({ id, name, position, salesTargetYuan, salesYuan, orderCount, newCustomers, repeatBuyers, repeatEligible, callbackCompleted, callbackPending, healthPlansDue }) => ({ id, name, position, salesTargetYuan, salesYuan, orderCount, newCustomers, repeatBuyers, repeatEligible, callbackCompleted, callbackPending, healthPlansDue })),
};
export const groupBusinessSourceForAi = {
  sourceScope: "集团经营指标由门店级月度经营记录汇总；商品由门店-SKU流水汇总；代理、经销商返单、招商、结算、设备同步和AI行动分别按各自明细记录汇总。三家重点门店已纳入集团总量，不重复加总。",
  sourceLineage: {
    storeRecords: groupStoreLedger.length,
    customerRecords: groupStoreCustomerLedger.length,
    retailOrderRecords: groupRetailOrderLedger.length,
    retailOrderLineRecords: groupRetailOrderLineLedger.length,
    storeLifecycleEvents: groupStoreLifecycleLedger.length,
    storeMonthlyRecords: groupStoreMonthlyLedger.length,
    storeSkuRecords: groupStoreProductLedger.length,
    inventoryMovementRecords: groupStoreInventoryMovementLedger.length,
    agentRecords: rawAgentRecords.length,
    dealerRecords: groupDealerRecords.length,
    dealerPurchaseOrders: groupDealerPurchaseOrderLedger.length,
    dealerPurchaseLines: groupDealerPurchaseLineLedger.length,
    recruitmentLeadRecords: groupRecruitmentLeadRecords.length,
    settlementBillRecords: groupSettlementBillRecords.length,
    healthSyncRecords: groupHealthSyncRecords.length,
    aiActionRecords: groupAiActionRecords.length,
    teamRetailOrders: teamRetailOrderLedger.length,
  },
  regionalFacts: rawGroupSource.regions,
  customerAggregateFacts: { active: rawGroupSource.members.active, newThisMonth: rawGroupSource.members.newThisMonth, repeatBuyers: rawGroupSource.members.repeatBuyers, previousYearTotal: rawGroupSource.members.previousYearTotal },
  priorityStoreFacts: rawGroupSource.priorityStoreFacts,
  storeLifecycleFacts: groupStoreLifecycleLedger,
  dealerPurchaseFacts: groupDealerRecords.map(({ id, region, reorderStatus, purchaseOrderCount, monthlyPurchaseYuan, monthlyTargetYuan, reorderCycleDays, stockTurnoverDays, lastOrderDate }) => ({ id, region, reorderStatus, purchaseOrderCount, monthlyPurchaseYuan, monthlyTargetYuan, reorderCycleDays, stockTurnoverDays, lastOrderDate })),
  recruitmentFacts: rawGroupSource.recruitmentStages,
  agentHierarchyAndActivity: rawGroupSource.agentActivity,
  agentHierarchyRecords: rawAgentRecords,
  productFacts: groupProductFlags,
  settlementFacts: rawGroupSource.settlement,
  healthServiceAggregate: rawGroupSource.healthService,
  aiActionFacts: rawGroupSource.aiActions,
  teamRetailOrderEvidence: teamRetailOrderLedger,
};
