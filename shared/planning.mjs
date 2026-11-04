export const planFeatures = {
  tours: "Quản lý tour/lịch/chỗ",
  portal: "Cổng khách hàng",
  tasks: "Công việc",
  pooling: "Ghép tour/đối soát",
  import: "Nhập Excel/CSV",
  roles: "Phân vai nhân viên",
};
export const emptyPlanning = () => ({
  value: {
    monthlyTasks: null,
    minutesBefore: null,
    minutesAfter: null,
    hourlyCost: null,
    monthlyFee: null,
  },
  plans: [],
  extras: [],
  notes: "",
});
const fail = (message) => {
  throw Object.assign(Error(message), { status: 400 });
};
function amount(value, label, limit = 1e12) {
  if (value === null || value === "") return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > limit
  )
    fail(label + " không hợp lệ.");
  return value;
}
function title(value) {
  if (typeof value !== "string" || value.length > 80)
    fail("Tên dòng dự kiến tối đa 80 ký tự.");
  return value.trim();
}
export function planningInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("Dữ liệu kế hoạch không hợp lệ.");
  const v = input.value || {},
    result = emptyPlanning();
  if (typeof v !== "object" || Array.isArray(v)) fail("Các giả định phải là một đối tượng.");
  if (
    input.notes !== undefined &&
    (typeof input.notes !== "string" || input.notes.length > 2000)
  )
    fail("Cơ sở số liệu tối đa 2.000 ký tự.");
  result.notes = (input.notes || "").trim();
  for (const key of Object.keys(result.value))
    result.value[key] = amount(v[key] ?? null, "Giả định " + key);
  if (
    !Array.isArray(input.plans) ||
    input.plans.length > 4 ||
    !Array.isArray(input.extras) ||
    input.extras.length > 4
  )
    fail("Tối đa 4 gói và 4 dòng thu một lần.");
  result.plans = input.plans.map((p) => {
    if (
      !p ||
      !Array.isArray(p.features) ||
      p.features.some((f) => typeof f !== "string" || !Object.hasOwn(planFeatures, f))
    )
      fail("Chọn tính năng đã triển khai cho gói.");
    return {
      name: title(p.name),
      price: amount(p.price ?? null, "Giá tháng"),
      customers: amount(p.customers ?? null, "Số doanh nghiệp", 1e6),
      features: [...new Set(p.features)],
    };
  });
  result.extras = input.extras.map((p) => {
    if (!p || typeof p !== "object" || Array.isArray(p))
      fail("Dòng thu một lần không hợp lệ.");
    return {
      name: title(p.name),
      price: amount(p.price ?? null, "Đơn giá một lần"),
      quantity: amount(p.quantity ?? null, "Số lượng", 1e6),
    };
  });
  if (
    result.plans.some(
      (p) => p.customers !== null && !Number.isInteger(p.customers),
    ) ||
    result.extras.some(
      (p) => p.quantity !== null && !Number.isInteger(p.quantity),
    )
  )
    fail("Số lượng cần là số nguyên.");
  return result;
}
export function planningResults(input) {
  const p = planningInput(input),
    v = p.value;
  const complete = (...a) => a.every((x) => x !== null);
  const hours = complete(v.monthlyTasks, v.minutesBefore, v.minutesAfter)
    ? (v.monthlyTasks * (v.minutesBefore - v.minutesAfter)) / 60
    : null;
  const laborValue = complete(hours, v.hourlyCost)
    ? hours * v.hourlyCost
    : null;
  const netValue = complete(laborValue, v.monthlyFee)
    ? laborValue - v.monthlyFee
    : null;
  const mrr =
    p.plans.length &&
    p.plans.every((x) => x.name && complete(x.price, x.customers))
      ? p.plans.reduce((s, x) => s + x.price * x.customers, 0)
      : null;
  const oneTime =
    p.extras.length &&
    p.extras.every((x) => x.name && complete(x.price, x.quantity))
      ? p.extras.reduce((s, x) => s + x.price * x.quantity, 0)
      : null;
  const results = {
    hours,
    laborValue,
    netValue,
    mrr,
    annualRunRate: mrr === null ? null : mrr * 12,
    oneTime,
  };
  if (
    Object.values(results).some(
      (v) => v !== null && Math.abs(v) > Number.MAX_SAFE_INTEGER,
    )
  )
    fail("Giả định quá lớn để tính chính xác. Giảm số lượng hoặc đơn giá.");
  return results;
}
