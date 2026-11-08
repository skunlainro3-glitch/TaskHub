import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { openDatabase, seedWorkspace } from "../server/db.mjs";
import { quoteAccess, quoteInput, quoteRows, quoteTotals } from "../shared/quotes.mjs";
import { listQuotes, getQuote, createQuote, updateQuote, transitionQuote, quoteExportData } from "../server/quotes.mjs";
import { qaTour } from "./fixtures.mjs";

const rejected = (status) => (error) => error.status === status;
const quoteFields = (tourId, extra = {}) => ({
  tour_id: tourId, recipient_name: "Khách QA", recipient_email: "quote@example.test",
  people: 3, unit_price: 1000000, discount_amount: 100000,
  valid_until: "2099-12-31", notes: "Dữ liệu tự động, không phải khách thật.", ...extra,
});

test("quote input uses integer VND, real dates, explicit recipient and bounded discounts", () => {
  const parsed = quoteInput(quoteFields("tour"));
  assert.deepEqual(quoteTotals(parsed), { subtotal: 3000000, discount_amount: 100000, total: 2900000 });
  assert.equal(quoteInput({ ...parsed, unit_price: undefined }, 1250000).unit_price, 1250000);
  for (const bad of [
    null, {}, { ...parsed, people: 1.5 }, { ...parsed, people: 0 },
    { ...parsed, people: 1001 }, { ...parsed, discount_amount: 3000001 },
    { ...parsed, unit_price: -1 }, { ...parsed, unit_price: 1.5 },
    { ...parsed, valid_until: "2026-02-30" }, { ...parsed, valid_until: "12/12/2026" },
    { ...parsed, recipient_name: " " }, { ...parsed, recipient_email: "no-address" },
    { ...parsed, notes: "x".repeat(2001) }, { ...parsed, tour_id: [] },
  ]) assert.throws(() => quoteInput(bad), rejected(400));
  assert.throws(() => quoteTotals(null), rejected(400));
});

test("quote permissions separate sales, operations, manager, accounting and read-only roles", () => {
  const staff = (department, permission = "editor") => ({ role: "staff", department, staff_permission: permission });
  assert.equal(quoteAccess(staff("sales")).canEdit, true);
  assert.equal(quoteAccess(staff("operations")).canRead, true);
  assert.equal(quoteAccess(staff("operations")).canEdit, false);
  assert.equal(quoteAccess(staff("accounting")).canRead, false);
  assert.equal(quoteAccess(staff("manager")).canApprove, true);
  assert.equal(quoteAccess(staff("manager", "viewer")).canApprove, false);
  assert.equal(quoteAccess({ role: "reviewer" }).canRead, true);
  assert.equal(quoteAccess({ role: "reviewer" }).canEdit, false);
});

test("quotations preserve approved snapshots, guard review and keep a truthful concurrent history", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "taskhub-quotes-"));
  const previous = process.env.TURSO_DATABASE_URL;
  if (process.env.TEST_DATABASE_DRIVER === "libsql") process.env.TURSO_DATABASE_URL = "file::memory:";
  else delete process.env.TURSO_DATABASE_URL;
  const db = await openDatabase(dir);
  try {
    const addUser = async (id, role = "operations", workspace = "one", department, permission = "editor") => {
      const user = { id, name: id, workspace, role, department, staff_permission: permission };
      await db.prepare("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)")
        .run(id, id + "@example.test", id, "test-only-hash", workspace, role, "", new Date().toISOString(), "test");
      return user;
    };
    await seedWorkspace(db, "one", "QA One");
    await seedWorkspace(db, "two", "QA Two");
    const owner = await addUser("owner");
    const other = await addUser("other", "operations", "two");
    const sales = await addUser("sales", "staff", "one", "sales");
    const manager = await addUser("manager", "staff", "one", "manager");
    const accounting = await addUser("accounting", "staff", "one", "accounting");
    const viewer = await addUser("viewer", "staff", "one", "sales", "viewer");
    const reviewer = await addUser("reviewer", "reviewer");
    await db.prepare("INSERT INTO tours VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
      "tour", "one", qaTour.title, qaTour.destination, qaTour.departure, qaTour.duration,
      qaTour.price, qaTour.capacity, qaTour.reserved, qaTour.description, qaTour.itinerary, qaTour.theme, 1, 1, new Date().toISOString());
    let detail;
    await t.test("replayed creation is one draft, one history entry and no seat reservation", async () => {
      const input = quoteFields("tour", { request_id: randomUUID(), unit_price: undefined });
      const results = await Promise.all([createQuote(db, sales, input), createQuote(db, sales, input)]);
      assert.equal(results[0].quote.id, results[1].quote.id);
      detail = await getQuote(db, sales, results[0].quote.id);
      assert.equal(detail.quote.total, 2900000);
      assert.equal(detail.history.length, 1);
      assert.equal(detail.quote.payload.tour.title, qaTour.title);
      assert.equal((await db.prepare("SELECT reserved FROM tours WHERE id='tour'").get()).reserved, qaTour.reserved);
      assert.equal((await listQuotes(db, other)).quotes.length, 0);
      await assert.rejects(createQuote(db, sales, { ...input, people: 4 }), rejected(409));
      await assert.rejects(createQuote(db, sales, { ...input, request_id: [] }), rejected(400));
      await assert.rejects(createQuote(db, sales, { ...input, request_id: randomUUID(), tour_id: {} }), rejected(400));
    });
    await t.test("read, edit, export and cross-tenant boundaries are enforced in the backend", async () => {
      const id = detail.quote.id;
      await assert.rejects(getQuote(db, other, id), rejected(404));
      await assert.rejects(updateQuote(db, other, id, quoteFields("tour", { version: 1 })), rejected(404));
      await assert.rejects(listQuotes(db, accounting), rejected(403));
      await assert.rejects(createQuote(db, viewer, quoteFields("tour")), rejected(403));
      await assert.rejects(createQuote(db, reviewer, quoteFields("tour")), rejected(403));
      await assert.rejects(quoteExportData(db, sales, id), rejected(409));
      assert.equal((await getQuote(db, reviewer, id)).capabilities.canEdit, false);
    });
    await t.test("submitting freezes edits and two competing reviews create only one audit entry", async () => {
      const id = detail.quote.id;
      detail = await transitionQuote(db, sales, id, { action: "submit", version: detail.quote.version });
      assert.equal(detail.quote.status, "pending");
      await assert.rejects(updateQuote(db, sales, id, quoteFields("tour", { version: detail.quote.version })), rejected(409));
      await assert.rejects(transitionQuote(db, sales, id, { action: "approve", version: detail.quote.version }), rejected(403));
      const beforeHistory = detail.history.length;
      const reviews = await Promise.allSettled([
        transitionQuote(db, manager, id, { action: "approve", version: detail.quote.version }),
        transitionQuote(db, owner, id, { action: "reject", note: "Kiểm tra lại", version: detail.quote.version }),
      ]);
      assert.equal(reviews.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(reviews.filter((r) => r.status === "rejected" && r.reason.status === 409).length, 1);
      detail = await getQuote(db, owner, id);
      assert.equal(detail.history.length, beforeHistory + 1);
      if (detail.quote.status === "rejected") {
        detail = await transitionQuote(db, sales, id, { action: "submit", version: detail.quote.version });
        detail = await transitionQuote(db, manager, id, { action: "approve", version: detail.quote.version });
      }
    });
    await t.test("approved exports use the saved tour, terms and reviewer rather than live values", async () => {
      await db.prepare("UPDATE tours SET title='Changed later',price=9000000,version=version+1 WHERE id='tour'").run();
      const exported = await quoteExportData(db, sales, detail.quote.id);
      assert.equal(exported.quote.payload.tour.title, qaTour.title);
      assert.equal(exported.quote.payload.unit_price, qaTour.price);
      assert.equal(exported.quote.reviewed_by, manager.id);
      assert.ok(quoteRows(exported.quote).some(([label, value]) => label === "Tổng báo giá (VND)" && value === 2900000));
      assert.equal(exported.capabilities.canExport, true);
      await assert.rejects(updateQuote(db, sales, detail.quote.id, quoteFields("tour", { version: detail.quote.version })), rejected(409));
    });
    await t.test("revising explicitly removes approval and exports remain blocked until reapproved", async () => {
      const id = detail.quote.id;
      const oldVersion = detail.quote.version;
      detail = await transitionQuote(db, sales, id, { action: "revise", version: oldVersion });
      assert.equal(detail.quote.status, "draft");
      assert.equal(detail.quote.reviewed_at, null);
      await assert.rejects(quoteExportData(db, sales, id), rejected(409));
      await assert.rejects(updateQuote(db, sales, id, quoteFields("tour", { version: oldVersion })), rejected(409));
      detail = await updateQuote(db, sales, id, quoteFields("tour", { version: detail.quote.version, people: 4 }));
      assert.equal(detail.quote.total, 3900000);
      assert.equal(detail.quote.payload.tour.title, qaTour.title, "Editing terms does not silently refresh the saved tour");
      const oldAudit = await db.prepare("SELECT payload FROM quote_audit WHERE quote_id=? AND action='approve'").get(id);
      assert.equal(JSON.parse(oldAudit.payload).people, 3);
    });
    await t.test("staff managers cannot approve themselves; owner self approval is recorded explicitly", async () => {
      let own = await createQuote(db, manager, quoteFields("tour"));
      own = await transitionQuote(db, manager, own.quote.id, { action: "submit", version: own.quote.version });
      assert.equal(own.capabilities.canApprove, false);
      await assert.rejects(transitionQuote(db, manager, own.quote.id, { action: "approve", version: own.quote.version }), rejected(403));
      own = await transitionQuote(db, owner, own.quote.id, { action: "approve", version: own.quote.version });
      assert.equal(own.quote.reviewed_by, owner.id);
      let ownerQuote = await createQuote(db, owner, quoteFields("tour"));
      ownerQuote = await transitionQuote(db, owner, ownerQuote.quote.id, { action: "submit", version: ownerQuote.quote.version });
      ownerQuote = await transitionQuote(db, owner, ownerQuote.quote.id, { action: "approve", version: ownerQuote.quote.version });
      assert.equal(ownerQuote.history.at(-1).actor_id, owner.id);
      assert.equal(ownerQuote.history.at(-1).action, "approve");
    });
    await t.test("reject needs a reason, expired terms cannot be submitted and deleted tours retain approved documents", async () => {
      let pending = await createQuote(db, sales, quoteFields("tour"));
      pending = await transitionQuote(db, sales, pending.quote.id, { action: "submit", version: pending.quote.version });
      await assert.rejects(transitionQuote(db, manager, pending.quote.id, { action: "reject", version: pending.quote.version }), rejected(400));
      const expired = await createQuote(db, sales, quoteFields("tour", { valid_until: "2020-01-01" }));
      await assert.rejects(transitionQuote(db, sales, expired.quote.id, { action: "submit", version: expired.quote.version }), rejected(400));
      const approved = (await listQuotes(db, owner)).quotes.find((q) => q.status === "approved");
      await db.prepare("DELETE FROM tours WHERE id='tour'").run();
      const kept = await quoteExportData(db, sales, approved.id);
      assert.equal(kept.quote.tour_id, null);
      assert.ok(kept.quote.payload.tour.title);
      assert.ok(kept.history.length >= 3);
    });
  } finally {
    db.close();
    if (previous === undefined) delete process.env.TURSO_DATABASE_URL;
    else process.env.TURSO_DATABASE_URL = previous;
    const root = resolve(tmpdir());
    assert.ok(resolve(dir).startsWith(root + sep));
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});
