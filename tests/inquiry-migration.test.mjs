import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { openDatabase } from '../server/db.mjs';

const migrations = readdirSync('cloud/drizzle').filter(f => f.endsWith('.sql')).sort();
function legacyDatabase(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys=ON');
  for (const file of migrations.filter(f => f < '0005_'))
    db.exec(readFileSync('cloud/drizzle/' + file, 'utf8'));
  db.exec(`INSERT INTO workspaces VALUES ('qa','QA only');
    INSERT INTO users VALUES ('user','qa@example.test','QA','not-a-credential','qa','operations','10to30','2026-11-04','QA');
    INSERT INTO tours VALUES ('tour','qa','QA tour','QA destination','2026-12-20','1 day',100,10,2,'QA description','QA itinerary','danang',1,3,'2026-11-04');
    INSERT INTO tasks(id,workspace,tour_id,title,assignee,due,priority,status,created) VALUES ('task','qa','tour','QA task','QA','2026-12-19','normal','todo','2026-11-04');
    INSERT INTO inquiries VALUES ('lead','qa','tour','QA visitor','visitor@example.test',2,'QA note','contacted','2026-11-04','inquiry-v1');
    INSERT INTO pooling VALUES ('pool','qa','tour','QA partner',1,100,0,'pending','QA',1,'2026-11-04','2026-11-04');
    INSERT INTO feedback VALUES ('user',4,4,4,4,'maybe',0,'QA','QA','2026-11-04');`);
  return db;
}
function businessSnapshot(db) {
  return Object.fromEntries(['workspaces','users','tours','tasks','inquiries','pooling','pooling_audit','events','feedback','feature_feedback'].map(table => [table, db.prepare('SELECT * FROM ' + table).all().map(row => {
    const copy = {...row};
    if (table === 'inquiries') delete copy.version;
    if (table === 'tasks') delete copy.assignee_id;
    return copy;
  })]));
}

test('D1 inquiry migration adds a version without rebuilding or changing existing business rows', () => {
  const db = legacyDatabase(':memory:');
  try {
    const before = businessSnapshot(db);
    db.exec(readFileSync('cloud/drizzle/0005_inquiry_version.sql','utf8'));
    assert.deepEqual(businessSnapshot(db),before);
    assert.equal(db.prepare("SELECT version FROM inquiries WHERE id='lead'").get().version,1);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  } finally { db.close(); }
});

test('local SQLite inquiry upgrade preserves old data and is safe to reopen', async () => {
  const root=resolve(tmpdir()), dir=mkdtempSync(join(root,'taskhub-inquiry-migration-'));
  const legacy=legacyDatabase(join(dir,'taskhub.sqlite'));
  const before=businessSnapshot(legacy);
  legacy.close();
  const previous={url:process.env.TURSO_DATABASE_URL,required:process.env.REQUIRE_REMOTE_DB};
  // This test covers the built-in local file upgrade. API integration tests
  // separately run the same versioned writes with SQLite and libSQL drivers.
  process.env.TURSO_DATABASE_URL='';
  process.env.REQUIRE_REMOTE_DB='0';
  let db;
  try {
    db=await openDatabase(dir);
    assert.equal((await db.prepare("SELECT version FROM inquiries WHERE id='lead'").get()).version,1);
    db.close();db=null;
    db=await openDatabase(dir);
    assert.equal((await db.prepare("SELECT version FROM inquiries WHERE id='lead'").get()).version,1);
    db.close();db=null;
    const raw=new DatabaseSync(join(dir,'taskhub.sqlite'));
    try { assert.deepEqual(businessSnapshot(raw),before); } finally { raw.close(); }
  } finally {
    db?.close();
    if(previous.url===undefined)delete process.env.TURSO_DATABASE_URL;else process.env.TURSO_DATABASE_URL=previous.url;
    if(previous.required===undefined)delete process.env.REQUIRE_REMOTE_DB;else process.env.REQUIRE_REMOTE_DB=previous.required;
    assert.ok(dir.startsWith(root+sep+'taskhub-inquiry-migration-'));
    rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  }
});
