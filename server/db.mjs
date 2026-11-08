import { connectDatabase } from "./connection.mjs";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export async function openDatabase(dir = process.env.DATA_DIR || "./data") {
  mkdirSync(dir, { recursive: true });
  const db = connectDatabase(resolve(dir, "taskhub.sqlite"));
  await db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,role TEXT NOT NULL,company_size TEXT NOT NULL,consent_at TEXT NOT NULL,consent_version TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS tours(id TEXT PRIMARY KEY,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,title TEXT NOT NULL,destination TEXT NOT NULL,departure TEXT NOT NULL,duration TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>=0),capacity INTEGER NOT NULL CHECK(capacity>0),reserved INTEGER NOT NULL CHECK(reserved>=0 AND reserved<=capacity),description TEXT NOT NULL,itinerary TEXT NOT NULL,theme TEXT NOT NULL,published INTEGER NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,title TEXT NOT NULL,assignee TEXT NOT NULL,due TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inquiries(id TEXT PRIMARY KEY,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,name TEXT NOT NULL,email TEXT NOT NULL,people INTEGER NOT NULL,note TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL,consent_version TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,action TEXT NOT NULL,entity TEXT NOT NULL,created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS feedback(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,portal INTEGER NOT NULL,operations INTEGER NOT NULL,sync INTEGER NOT NULL,ease INTEGER NOT NULL,intent TEXT NOT NULL,price INTEGER NOT NULL,liked TEXT NOT NULL,disliked TEXT NOT NULL,created TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS tours_workspace ON tours(workspace); CREATE INDEX IF NOT EXISTS events_user ON events(user_id);`);
  await db.exec(`CREATE TABLE IF NOT EXISTS pooling(id TEXT PRIMARY KEY,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,partner TEXT NOT NULL,seats INTEGER NOT NULL CHECK(seats>0 AND seats<=1000),unit_price INTEGER NOT NULL CHECK(unit_price>=0 AND unit_price<=1000000000),paid INTEGER NOT NULL DEFAULT 0 CHECK(paid>=0 AND paid<=seats*unit_price),status TEXT NOT NULL CHECK(status IN ('pending','confirmed','cancelled')),note TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created TEXT NOT NULL,updated TEXT NOT NULL); CREATE INDEX IF NOT EXISTS pooling_workspace ON pooling(workspace); CREATE INDEX IF NOT EXISTS pooling_tour ON pooling(tour_id);`);
  const taskColumns = await db.prepare('PRAGMA table_info(tasks)').all();
  if (!taskColumns.some(column => column.name === 'version')) await db.exec('ALTER TABLE tasks ADD COLUMN version INTEGER NOT NULL DEFAULT 1');
  if (!taskColumns.some(column => column.name === 'assignee_id')) await db.exec('ALTER TABLE tasks ADD COLUMN assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL');
  const inquiryColumns = await db.prepare('PRAGMA table_info(inquiries)').all();
  if (!inquiryColumns.some(column => column.name === 'version')) await db.exec('ALTER TABLE inquiries ADD COLUMN version INTEGER NOT NULL DEFAULT 1');
  await db.exec(`CREATE TABLE IF NOT EXISTS feature_feedback(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,entries TEXT NOT NULL,price INTEGER CHECK(price IS NULL OR (price>=0 AND price<=100000000)),price_status TEXT NOT NULL CHECK(price_status IN ('provided','undecided','not_decider','declined')),liked TEXT NOT NULL,disliked TEXT NOT NULL,created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pooling_audit(id TEXT PRIMARY KEY,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,pooling_id TEXT NOT NULL REFERENCES pooling(id) ON DELETE CASCADE,actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,action TEXT NOT NULL,paid_before INTEGER NOT NULL,paid_after INTEGER NOT NULL,status_before TEXT NOT NULL,status_after TEXT NOT NULL,created TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS pooling_audit_workspace ON pooling_audit(workspace); CREATE INDEX IF NOT EXISTS pooling_audit_pooling ON pooling_audit(pooling_id);`);
  await db.exec(readFileSync(new URL('./pooling-triggers.sql',import.meta.url),'utf8'));
  // Historical schema compatibility only; no active feature uses account_profiles.
  await db.exec(`CREATE TABLE IF NOT EXISTS account_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,verified_at TEXT);
    CREATE TABLE IF NOT EXISTS account_tokens(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')),expires INTEGER NOT NULL,used_at TEXT,created TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS account_tokens_user ON account_tokens(user_id,purpose);
    CREATE TABLE IF NOT EXISTS workspace_members(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,permission TEXT NOT NULL CHECK(permission IN ('viewer','editor')),created TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS workspace_members_workspace ON workspace_members(workspace);
    CREATE TABLE IF NOT EXISTS workspace_invites(id TEXT PRIMARY KEY,token TEXT UNIQUE NOT NULL,workspace TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,email TEXT NOT NULL,permission TEXT NOT NULL CHECK(permission IN ('viewer','editor')),invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,expires INTEGER NOT NULL,used_at TEXT,created TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS workspace_invites_workspace ON workspace_invites(workspace);`);
  for (const table of ['workspace_members','workspace_invites']) {
    const columns = await db.prepare('PRAGMA table_info('+table+')').all();
    if (!columns.some(column => column.name === 'department'))
      await db.exec("ALTER TABLE "+table+" ADD COLUMN department TEXT NOT NULL DEFAULT 'general'");
  }
  await db.exec(`CREATE TABLE IF NOT EXISTS workspace_planning(workspace TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,payload TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated TEXT NOT NULL,updated_by TEXT REFERENCES users(id) ON DELETE SET NULL);`);
  await db.exec(readFileSync(new URL('./productivity-schema.sql', import.meta.url), 'utf8'));
  if (!db.remote)
    await db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
  return db;
}

export async function transaction(db, fn) {
  return db.transaction(fn);
}
export async function purgeExpired(db) {
  const cutoff = new Date(Date.now() - 180 * 86400000).toISOString();
  return await transaction(db, async () => {
    const old = await db
      .prepare(
        "SELECT workspace FROM users WHERE role NOT IN ('admin','reviewer','staff') AND workspace!='agency' AND consent_at<?",
      )
      .all(cutoff);
    for (const row of old)
      await db.prepare("DELETE FROM workspaces WHERE id=?").run(row.workspace);
    await db.prepare("DELETE FROM users WHERE role='staff' AND consent_at<?").run(cutoff);
    await db.prepare('DELETE FROM account_tokens WHERE expires<?').run(Date.now());
    await db.prepare('DELETE FROM workspace_invites WHERE expires<?').run(Date.now());
    await db.prepare("DELETE FROM inquiries WHERE created<?").run(cutoff);
    await db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    return old.length;
  });
}
export const now = () => new Date().toISOString();
export async function seedWorkspace(db, id, name) {
  await db.prepare("INSERT INTO workspaces VALUES (?,?)").run(id, name);
  // Workspaces start empty. Business information must be entered by the owner.
}

// Both private cost information and customer contacts are excluded from public output.
export async function publicTours(db, workspace) {
  return await db
    .prepare(
      "SELECT id,title,destination,departure,duration,price,capacity,reserved,description,itinerary,theme,version,updated FROM tours WHERE workspace=? AND published=1 ORDER BY departure",
    )
    .all(workspace);
}
