import { analyticsRange, buildAnalytics } from "../shared/analytics.mjs";
import { workspaceAccess } from "../shared/access.mjs";

export async function loadAnalytics(db, user, input) {
  analyticsRange(input);
  const access = workspaceAccess(user);
  const [tours, tasks, inquiries, pooling] = await Promise.all([
    db
      .prepare("SELECT * FROM tours WHERE workspace=? ORDER BY departure,title")
      .all(user.workspace),
    db
      .prepare("SELECT due,status FROM tasks WHERE workspace=?")
      .all(user.workspace),
    access.canReadInquiries
      ? db
          .prepare("SELECT created,status FROM inquiries WHERE workspace=?")
          .all(user.workspace)
      : [],
    access.canReadPooling
      ? db
          .prepare(
            "SELECT p.*,t.title AS tour_title,t.departure FROM pooling p JOIN tours t ON t.id=p.tour_id WHERE p.workspace=? ORDER BY t.departure,p.partner,p.created",
          )
          .all(user.workspace)
      : [],
  ]);
  return buildAnalytics({ tours, tasks, inquiries, pooling }, user, input);
}
