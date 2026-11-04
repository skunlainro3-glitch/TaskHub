import { requireCapability } from "../shared/access.mjs";
import {
  emptyPlanning,
  planningInput,
  planningResults,
} from "../shared/planning.mjs";

export async function loadPlanning(db, user) {
  requireCapability(user, "canReadPlanning");
  const row = await db
    .prepare(
      "SELECT p.payload,p.version,p.updated,u.name AS updated_by FROM workspace_planning p LEFT JOIN users u ON u.id=p.updated_by WHERE p.workspace=?",
    )
    .get(user.workspace);
  return row
    ? {
        plan: JSON.parse(row.payload),
        version: row.version,
        updated: row.updated,
        updated_by: row.updated_by,
      }
    : { plan: emptyPlanning(), version: 0, updated: null, updated_by: null };
}
export async function savePlanning(db, user, input) {
  requireCapability(user, "canEditPlanning");
  if (!Number.isSafeInteger(input.version) || input.version < 0)
    throw Object.assign(Error("Thiếu phiên bản kế hoạch."), { status: 400 });
  const payload = JSON.stringify(planningInput(input.plan)),
    updated = new Date().toISOString();
  planningResults(input.plan);
  // A version-zero create cannot overwrite an existing plan. All edits are CAS.
  const result =
    input.version === 0
      ? await db
          .prepare(
            "INSERT INTO workspace_planning(workspace,payload,version,updated,updated_by) VALUES (?,?,1,?,?) ON CONFLICT(workspace) DO NOTHING",
          )
          .run(user.workspace, payload, updated, user.id)
      : await db
          .prepare(
            "UPDATE workspace_planning SET payload=?,version=version+1,updated=?,updated_by=? WHERE workspace=? AND version=?",
          )
          .run(payload, updated, user.id, user.workspace, input.version);
  if (result.changes) return loadPlanning(db, user);
  throw Object.assign(
    Error("Kế hoạch đã thay đổi. Tải bản mới để đối chiếu trước khi lưu."),
    { status: 409 },
  );
}
