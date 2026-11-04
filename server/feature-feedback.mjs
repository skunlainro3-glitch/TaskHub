// Read-only access to survey records collected before the in-app form was retired.
export const featureIds = ['portal', 'operations', 'sync', 'pooling', 'import', 'quick_actions'];
export const testerFields = ['email','consent_at','consent_version','role','company_size','features_seen_or_used','test_started_at','test_finished_at','liked','disliked','monthly_price_vnd','price_status','observer_note'];
export const featureFields = ['email','feature','mode','result','importance','ease','intent','observed_at','comment'];
export function parseFeatureFeedback(row) {
  if (!row) return null;
  return { ...row, entries: JSON.parse(row.entries) };
}

export async function surveyExportRows(db) {
  const rows = await db.prepare(`SELECT f.*,u.email,u.role,u.company_size,u.consent_at,u.consent_version,
    (SELECT MIN(e.created) FROM events e WHERE e.user_id=u.id AND e.action='test_started') AS test_started_at
    FROM feature_feedback f JOIN users u ON u.id=f.user_id WHERE u.role NOT IN ('admin','reviewer','staff') ORDER BY f.created,u.email`).all();
  const testers = [], features = [];
  for (const raw of rows) {
    const row = parseFeatureFeedback(raw), experienced = row.entries.filter(e => e.mode !== 'untried');
    testers.push({ email:row.email,consent_at:row.consent_at,consent_version:row.consent_version,role:row.role,company_size:row.company_size,
      features_seen_or_used:experienced.map(e=>e.feature+':'+e.mode).join('; '),test_started_at:row.test_started_at || '',test_finished_at:row.created,
      liked:row.liked,disliked:row.disliked,monthly_price_vnd:row.price ?? '',price_status:row.price_status,observer_note:'' });
    // Untried answers stay in the original record; they are not observations of use.
    for (const entry of experienced) features.push({ email:row.email,feature:entry.feature,mode:entry.mode,result:entry.result,importance:entry.importance ?? '',ease:entry.ease ?? '',intent:entry.intent,observed_at:row.created,comment:'' });
  }
  return { testers, features };
}
