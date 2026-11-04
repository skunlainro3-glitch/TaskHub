import test from "node:test";
import assert from "node:assert/strict";
import readXlsxFile from "read-excel-file/node";
import { tableXlsx } from "../shared/xlsx.mjs";
import {
  analyticsRange,
  buildAnalytics,
  analyticsRows,
  vietnamDay,
} from "../shared/analytics.mjs";

const input = { from: "2026-10-01", to: "2026-11-30" },
  today = "2026-10-28";
const data = {
  tours: [
    {
      id: "a",
      title: "QA Oct",
      departure: "2026-10-29",
      capacity: 10,
      reserved: 5,
      published: 1,
    },
    {
      id: "b",
      title: "QA Nov",
      departure: "2026-11-06",
      capacity: 90,
      reserved: 9,
      published: 0,
    },
  ],
  tasks: [
    { due: "2026-10-27", status: "todo" },
    { due: "2026-10-28", status: "doing" },
    { due: "2026-11-01", status: "done" },
    { due: "2026-09-01", status: "done" },
  ],
  inquiries: [
    {
      created: "2026-09-30T18:00:00Z",
      status: "new",
      email: "never-export@example.test",
    },
    { created: "2026-11-30T18:00:00Z", status: "closed" },
  ],
  pooling: [
    {
      tour_id: "a",
      tour_title: "QA Oct",
      departure: "2026-10-29",
      partner: "QA confirmed",
      status: "confirmed",
      seats: 3,
      unit_price: 100,
      paid: 100,
    },
    {
      tour_id: "b",
      tour_title: "QA Nov",
      departure: "2026-11-06",
      partner: "QA pending",
      status: "pending",
      seats: 20,
      unit_price: 1000,
      paid: 0,
    },
    {
      tour_id: "a",
      tour_title: "QA Oct",
      departure: "2026-10-29",
      partner: "QA canceled",
      status: "cancelled",
      seats: 4,
      unit_price: 1000,
      paid: 0,
    },
  ],
};
const owner = { role: "operations", workspace: "qa" };
test("analytics uses weighted occupancy, due-date completion and Vietnam date boundaries", () => {
  const r = buildAnalytics(data, owner, input, today);
  assert.equal(r.tours.occupancy, 0.14);
  assert.equal(r.tours.total, 2);
  assert.equal(r.tasks.completion, 1 / 3);
  assert.equal(r.tasks.overdue, 1);
  assert.equal(r.inquiries.total, 1);
  assert.equal(vietnamDay("2026-09-30T18:00:00Z"), "2026-10-01");
  assert.deepEqual(
    r.months.map((m) => [m.tours, m.reserved]),
    [
      [1, 5],
      [1, 9],
    ],
  );
});
test("only confirmed pooling contributes monetary totals; no inquiry contacts leak into exports", () => {
  const r = buildAnalytics(data, owner, input, today);
  assert.deepEqual(r.pooling, {
    confirmed: 1,
    pending: 1,
    cancelled: 1,
    agreed: 300,
    paid: 100,
    balance: 200,
  });
  assert.equal(r.months[1].agreed, 0);
  assert.equal(r.ledger[1].balance, null);
  assert.ok(!JSON.stringify(r).includes("never-export"));
  assert.ok(!JSON.stringify(analyticsRows(r)).includes("never-export"));
});
test("analytics remains role-scoped, and empty ratios are unavailable instead of zero", () => {
  const sales = buildAnalytics(
    data,
    { role: "staff", department: "sales", staff_permission: "editor" },
    input,
    today,
  );
  assert.equal(sales.pooling, null);
  assert.equal(sales.ledger, null);
  assert.ok(!Object.hasOwn(sales.months[0], "agreed"));
  const accountant = buildAnalytics(
    data,
    { role: "staff", department: "accounting", staff_permission: "editor" },
    input,
    today,
  );
  assert.equal(accountant.inquiries, null);
  const empty = buildAnalytics(
    { tours: [], tasks: [], inquiries: [], pooling: [] },
    owner,
    input,
    today,
  );
  assert.equal(empty.tours.occupancy, null);
  assert.equal(empty.tasks.completion, null);
  assert.equal(
    buildAnalytics(data, { ...owner, workspace: "agency" }, input, today)
      .simulated,
    true,
  );
});
test("analytics range rejects invalid, reversed and overly broad dates", () => {
  assert.deepEqual(analyticsRange({}, today).months, [
    "2026-10",
    "2026-11",
    "2026-12",
    "2027-01",
    "2027-02",
    "2027-03",
  ]);
  for (const i of [
    { from: "2026-02-30" },
    { from: "2026-11-01", to: "2026-10-01" },
    { from: "2024-01-01", to: "2026-12-31" },
    { from: "bad" },
  ])
    assert.throws(
      () => analyticsRange(i, today),
      (e) => e.status === 400,
    );
});
test("XLSX exports reopen with numeric cells, UTF-8 and inert formula-like text", async () => {
  const bytes = tableXlsx({
    name: "Cong no",
    headers: ["Đối tác", "Số tiền", "Tỷ lệ", "Ghi chú"],
    rows: [
      ["=1+1", 2000000, 0.375, '<xml>& "test"'],
      ["001", 0, null, "Tiếng Việt"],
    ],
  });
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  const parsed = await readXlsxFile(Buffer.from(bytes)),
    rows = parsed[0].data;
  assert.deepEqual(rows, [
    ["Đối tác", "Số tiền", "Tỷ lệ", "Ghi chú"],
    ["=1+1", 2000000, 0.375, '<xml>& "test"'],
    ["001", 0, null, "Tiếng Việt"],
  ]);
  assert.throws(() => tableXlsx({ headers: [], rows: [] }));
  assert.throws(()=>tableXlsx({headers:['QA'],rows:Array(5001).fill([''])}),e=>e.status===413);
});
