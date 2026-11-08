import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync, readdirSync} from 'node:fs';

test('productivity migration preserves legacy records and staff deletion keeps task text', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys=ON');
    const migrations = readdirSync('cloud/drizzle').filter(file => file.endsWith('.sql')).sort();
    for (const file of migrations.filter(file => file < '0006_')) db.exec(readFileSync('cloud/drizzle/' + file, 'utf8'));
    db.exec(`INSERT INTO workspaces VALUES ('qa','QA migration');
      INSERT INTO users VALUES ('owner','owner@example.test','QA owner','not-a-secret','qa','operations','','2026-11-09','qa');
      INSERT INTO users VALUES ('staff','staff@example.test','QA staff','not-a-secret','qa','staff','','2026-11-09','qa');
      INSERT INTO tours VALUES ('tour','qa','QA tour','QA destination','2026-12-20','1 day',100,10,2,'QA description','QA itinerary','danang',1,3,'2026-11-09');
      INSERT INTO tasks(id,workspace,tour_id,title,assignee,due,priority,status,created,version) VALUES ('task','qa','tour','QA task','Legacy name','2026-12-19','normal','todo','2026-11-09',4);`);
    const before = Object.fromEntries(['users','workspaces','tours','tasks'].map(table => [table, db.prepare('SELECT * FROM ' + table).all()]));
    const additions = migrations.filter(file => file.startsWith('0006_'));
    assert.equal(additions.length, 1);
    db.exec(readFileSync('cloud/drizzle/' + additions[0], 'utf8'));
    for (const [table, records] of Object.entries(before)) {
      const after = db.prepare('SELECT * FROM ' + table).all().map(row => {
        const copy = {...row};
        if (table === 'tasks') {assert.equal(copy.assignee_id, null); delete copy.assignee_id;}
        return copy;
      });
      assert.deepEqual(after, records.map(row => ({...row})));
    }
    for (const table of ['quotes','quote_audit','task_templates','task_template_runs']) assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ' + table).get().n, 0);
    db.prepare("UPDATE tasks SET assignee_id='staff' WHERE id='task'").run();
    db.prepare("DELETE FROM users WHERE id='staff'").run();
    const task = db.prepare("SELECT * FROM tasks WHERE id='task'").get();
    assert.equal(task.assignee_id, null);
    assert.equal(task.assignee, 'Legacy name');
    assert.equal(task.version, 4);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally {db.close();}
});
