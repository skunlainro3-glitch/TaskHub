import { sqliteTable, text, integer, index, primaryKey, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
const requiredText = (name: string) => text(name).notNull();
const requiredInteger = (name: string) => integer(name).notNull();
export const workspaces = sqliteTable('workspaces', { id: text('id').primaryKey(), name: requiredText('name') });
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), email: requiredText('email').unique(), name: requiredText('name'), password: requiredText('password'),
  workspace: requiredText('workspace').references(() => workspaces.id, { onDelete: 'cascade' }),
  role: requiredText('role'), company_size: requiredText('company_size'), consent_at: requiredText('consent_at'), consent_version: requiredText('consent_version'),
}, t => [index('users_retention').on(t.role,t.consent_at)]);
export const sessions = sqliteTable('sessions', {
  token: text('token').primaryKey(), user_id: requiredText('user_id').references(() => users.id,{onDelete:'cascade'}), expires: requiredInteger('expires'),
}, t => [index('sessions_expiry').on(t.expires)]);
export const tours = sqliteTable('tours', {
  id: text('id').primaryKey(), workspace: requiredText('workspace').references(() => workspaces.id,{onDelete:'cascade'}),
  title: requiredText('title'), destination: requiredText('destination'), departure: requiredText('departure'), duration: requiredText('duration'),
  price: requiredInteger('price'), capacity: requiredInteger('capacity'), reserved: requiredInteger('reserved'), description: requiredText('description'),
  itinerary: requiredText('itinerary'), theme: requiredText('theme'), published: requiredInteger('published'), version: requiredInteger('version').default(1), updated: requiredText('updated'),
}, t => [index('tours_workspace').on(t.workspace),check('tour_price',sql`${t.price} >= 0`),check('tour_capacity',sql`${t.capacity} > 0`),check('tour_reserved',sql`${t.reserved} >= 0 AND ${t.reserved} <= ${t.capacity}`)]);
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), workspace: requiredText('workspace').references(() => workspaces.id,{onDelete:'cascade'}),
  tour_id: requiredText('tour_id').references(() => tours.id,{onDelete:'cascade'}),title: requiredText('title'),assignee: requiredText('assignee'),
  due: requiredText('due'),priority: requiredText('priority'),status: requiredText('status'),created: requiredText('created'),version:requiredInteger('version').default(1),
});
export const inquiries = sqliteTable('inquiries', {
  id: text('id').primaryKey(),workspace: requiredText('workspace').references(() => workspaces.id,{onDelete:'cascade'}),
  tour_id: requiredText('tour_id').references(() => tours.id,{onDelete:'cascade'}),name: requiredText('name'),email: requiredText('email'),people: requiredInteger('people'),
  note: requiredText('note'),status: requiredText('status'),created: requiredText('created'),consent_version: requiredText('consent_version'),version: requiredInteger('version').default(1),
});
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),user_id: requiredText('user_id').references(() => users.id,{onDelete:'cascade'}),action: requiredText('action'),entity: requiredText('entity'),created: requiredText('created'),
}, t => [index('events_user').on(t.user_id)]);
export const feedback = sqliteTable('feedback', {
  user_id: text('user_id').primaryKey().references(() => users.id,{onDelete:'cascade'}),portal: requiredInteger('portal'),operations: requiredInteger('operations'),sync: requiredInteger('sync'),ease: requiredInteger('ease'),
  intent: requiredText('intent'),price: requiredInteger('price'),liked: requiredText('liked'),disliked: requiredText('disliked'),created: requiredText('created'),
});
export const featureFeedback = sqliteTable('feature_feedback', {
  user_id:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),entries:requiredText('entries'),price:integer('price'),
  price_status:requiredText('price_status'),liked:requiredText('liked'),disliked:requiredText('disliked'),created:requiredText('created'),
},t=>[check('feature_feedback_price',sql`${t.price} IS NULL OR (${t.price}>=0 AND ${t.price}<=100000000)`),check('feature_feedback_price_status',sql`${t.price_status} IN ('provided','undecided','not_decider','declined')`)]);
export const rateLimits = sqliteTable('rate_limits', {
  key: requiredText('key'),bucket: requiredInteger('bucket'),n: requiredInteger('n'),
},t=>[primaryKey({columns:[t.key,t.bucket]}),index('rate_limit_expiry').on(t.bucket)]);
export const pooling = sqliteTable('pooling', {
  id:text('id').primaryKey(),workspace:requiredText('workspace').references(()=>workspaces.id,{onDelete:'cascade'}),
  tour_id:requiredText('tour_id').references(()=>tours.id,{onDelete:'cascade'}),partner:requiredText('partner'),seats:requiredInteger('seats'),
  unit_price:requiredInteger('unit_price'),paid:requiredInteger('paid').default(0),status:requiredText('status'),note:requiredText('note'),
  version:requiredInteger('version').default(1),created:requiredText('created'),updated:requiredText('updated'),
},t=>[index('pooling_workspace').on(t.workspace),index('pooling_tour').on(t.tour_id),
  check('pool_seats',sql`${t.seats}>0 AND ${t.seats}<=1000`),check('pool_price',sql`${t.unit_price}>=0 AND ${t.unit_price}<=1000000000`),
  check('pool_paid',sql`${t.paid}>=0 AND ${t.paid}<=${t.seats}*${t.unit_price}`),check('pool_status',sql`${t.status} IN ('pending','confirmed','cancelled')`)]);
export const poolingAudit = sqliteTable('pooling_audit', {
  id:text('id').primaryKey(),workspace:requiredText('workspace').references(()=>workspaces.id,{onDelete:'cascade'}),
  pooling_id:requiredText('pooling_id').references(()=>pooling.id,{onDelete:'cascade'}),actor_id:text('actor_id').references(()=>users.id,{onDelete:'set null'}),
  action:requiredText('action'),paid_before:requiredInteger('paid_before'),paid_after:requiredInteger('paid_after'),
  status_before:requiredText('status_before'),status_after:requiredText('status_after'),created:requiredText('created'),
},t=>[index('pooling_audit_workspace').on(t.workspace),index('pooling_audit_pooling').on(t.pooling_id)]);
// Additive account tables preserve the original users insert contract and data.
// Preserve deployed schema/history; this table has no active application reader/writer.
export const accountProfiles = sqliteTable('account_profiles', {
  user_id:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),verified_at:text('verified_at'),
});
export const accountTokens = sqliteTable('account_tokens', {
  token:text('token').primaryKey(),user_id:requiredText('user_id').references(()=>users.id,{onDelete:'cascade'}),purpose:requiredText('purpose'),
  expires:requiredInteger('expires'),used_at:text('used_at'),created:requiredText('created'),
},t=>[index('account_tokens_user').on(t.user_id,t.purpose),check('account_token_purpose',sql`${t.purpose} IN ('verify','reset')`)]);
export const workspaceMembers = sqliteTable('workspace_members', {
  user_id:text('user_id').primaryKey().references(()=>users.id,{onDelete:'cascade'}),workspace:requiredText('workspace').references(()=>workspaces.id,{onDelete:'cascade'}),
  permission:requiredText('permission'),created:requiredText('created'),department:requiredText('department').default('general'),
},t=>[index('workspace_members_workspace').on(t.workspace),check('member_permission',sql`${t.permission} IN ('viewer','editor')`)]);
export const workspaceInvites = sqliteTable('workspace_invites', {
  id:text('id').primaryKey(),token:requiredText('token').unique(),workspace:requiredText('workspace').references(()=>workspaces.id,{onDelete:'cascade'}),
  email:requiredText('email'),permission:requiredText('permission'),invited_by:text('invited_by').references(()=>users.id,{onDelete:'set null'}),
  expires:requiredInteger('expires'),used_at:text('used_at'),created:requiredText('created'),department:requiredText('department').default('general'),
},t=>[index('workspace_invites_workspace').on(t.workspace),check('invite_permission',sql`${t.permission} IN ('viewer','editor')`)]);
export const workspacePlanning = sqliteTable('workspace_planning', {
  workspace:text('workspace').primaryKey().references(()=>workspaces.id,{onDelete:'cascade'}),payload:requiredText('payload'),
  version:requiredInteger('version').default(1),updated:requiredText('updated'),updated_by:text('updated_by').references(()=>users.id,{onDelete:'set null'}),
});
