// Department describes the work; viewer/editor describes whether it can be changed.
// Survey occupations never grant access to another company's workspace.
export const departmentNames = {
  operations: "Điều hành",
  sales: "Kinh doanh",
  accounting: "Kế toán",
  manager: "Quản lý",
  general: "Nhân viên tổng hợp",
};
export function validDepartment(value = "general") {
  if (typeof value !== "string" || !Object.hasOwn(departmentNames, value))
    throw Object.assign(Error("Chọn vai trò nhân viên hợp lệ."), {
      status: 400,
    });
  return value;
}
export function workspaceAccess(user) {
  const staff = user?.role === "staff",
    reviewer = user?.role === "reviewer";
  const owner = Boolean(user && !staff && !reviewer);
  const department = staff
    ? user.department || user.staff_department || "general"
    : null;
  const permission = user?.workspace_permission || user?.staff_permission;
  const write = owner || (staff && permission === "editor");
  const inDepartment = (...names) =>
    owner || reviewer || (staff && names.includes(department));
  const editable = (...names) => write && (owner || names.includes(department));
  return {
    department,
    label: owner
      ? "Chủ không gian"
      : reviewer
        ? "Người đánh giá"
        : departmentNames[department] || "Chưa phân vai",
    canManageTeam: owner,
    canReadInquiries: inDepartment("general", "manager", "sales", "operations"),
    canReadPooling: inDepartment(
      "general",
      "manager",
      "operations",
      "accounting",
    ),
    canReadPlanning: inDepartment("manager"),
    canEditPlanning: editable("manager"),
    canEditTours: editable("general", "manager", "operations"),
    canEditTasks: editable("general", "manager", "operations", "sales"),
    canEditInquiries: editable("general", "manager", "sales"),
    canManageDeals: editable("general", "manager", "operations"),
    canRecordReceipts: editable("general", "manager", "accounting"),
  };
}
export function requireCapability(user, capability) {
  if (!workspaceAccess(user)[capability])
    throw Object.assign(
      Error("Vai trò hiện tại không được thực hiện thao tác này."),
      { status: 403 },
    );
}
