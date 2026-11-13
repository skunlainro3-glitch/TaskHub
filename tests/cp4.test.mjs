import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { workspaceAccess, validDepartment } from "../shared/access.mjs";
import { syncState } from "../src/sync-state.mjs";
import { qaTour } from "./fixtures.mjs";

test("department permissions separate customer contacts, seat confirmation and receipts", () => {
  for (const department of [
    "operations",
    "sales",
    "accounting",
    "manager",
    "general",
  ]) {
    const read = workspaceAccess({
      role: "staff",
      department,
      staff_permission: "viewer",
    });
    assert.ok(
      Object.entries(read)
        .filter(
          ([k]) =>
            k.startsWith("canEdit") ||
            k === "canApproveQuotes" ||
            k === "canManageDeals" ||
            k === "canRecordReceipts",
        )
        .every(([, v]) => !v),
    );
  }
  const ops = workspaceAccess({
    role: "staff",
    department: "operations",
    staff_permission: "editor",
  });
  assert.ok(
    ops.canEditTours &&
      ops.canManageDeals &&
      !ops.canRecordReceipts &&
      !ops.canEditInquiries,
  );
  const sales = workspaceAccess({
    role: "staff",
    department: "sales",
    staff_permission: "editor",
  });
  assert.ok(
    sales.canEditInquiries &&
      sales.canEditTasks &&
      !sales.canReadPooling &&
      !sales.canEditTours,
  );
  const accounting = workspaceAccess({
    role: "staff",
    department: "accounting",
    staff_permission: "editor",
  });
  assert.ok(
    accounting.canRecordReceipts &&
      !accounting.canManageDeals &&
      !accounting.canReadInquiries &&
      !accounting.canEditTasks,
  );
  assert.equal(
    workspaceAccess({
      role: "staff",
      department: "unknown",
      staff_permission: "editor",
    }).canEditTours,
    false,
  );
  assert.equal(workspaceAccess({ role: "reviewer" }).canApproveQuotes, false);
  assert.equal(workspaceAccess({ role: "operations" }).canApproveQuotes, true);
  for (const department of ["operations", "sales", "accounting", "general"])
    assert.equal(
      workspaceAccess({ role: "staff", department, staff_permission: "editor" }).canApproveQuotes,
      false,
    );
  assert.equal(
    workspaceAccess({ role: "staff", department: "manager", staff_permission: "editor" }).canApproveQuotes,
    true,
  );
  assert.throws(
    () => validDepartment(["operations"]),
    (e) => e.status === 400,
  );
});

test("freshness becomes stale after 15 seconds even without a fetch error", () => {
  assert.equal(syncState({ lastSuccess: 1000, now: 16000 }), "fresh");
  assert.equal(syncState({ lastSuccess: 1000, now: 16001 }), "stale");
  assert.equal(
    syncState({ lastSuccess: 1000, now: 2000, error: "timeout" }),
    "stale",
  );
  assert.equal(syncState({ online: false, lastSuccess: 1000 }), "offline");
  assert.equal(syncState({ lastSuccess: null }), "loading");
});

test("role API blocks direct writes/exports and refreshes permission changes", async () => {
  const dir = mkdtempSync(join(tmpdir(), "taskhub-cp4-"));
  const base = "http://127.0.0.1:" + (5700 + Math.floor(Math.random() * 200));
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: new URL(base).port,
      HOST: "127.0.0.1",
      DATA_DIR: dir,
      ADMIN_EMAIL: "admin@taskhub.local",
      ADMIN_PASSWORD: "CP4-only-automated-qa!",
      REQUIRE_REMOTE_DB: "0",
      TURSO_DATABASE_URL:
        process.env.TEST_DATABASE_DRIVER === "libsql"
          ? "file:" + join(dir, "taskhub.sqlite").replaceAll("\\", "/")
          : "",
      TURSO_AUTH_TOKEN: "",
    },
    stdio: "pipe",
  });
  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d;
  });
  async function request(path, method = "GET", data, cookie) {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-TaskHub": "1",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(data && method !== "GET" ? { body: JSON.stringify(data) } : {}),
    });
    const text = await r.text();
    return {
      status: r.status,
      body: text.startsWith("{") ? JSON.parse(text) : text,
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw Error(stderr);
      try {
        if ((await fetch(base + "/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(ready, stderr);
    const signup = (name) =>
      request("/register", "POST", {
        name,
        email: name + "@example.test",
        password: "CP4-only-automated-qa!",
        role: "operations",
        company_size: "10to30",
        consent: true,
      });
    const owner = await signup("cp4-owner"),
      other = await signup("cp4-other");
    assert.equal(owner.status, 201);
    assert.equal(other.status, 201);
    const actors = {};
    for (const department of [
      "operations",
      "sales",
      "accounting",
      "manager",
      "general",
    ]) {
      const invite = await request(
        "/team/invites",
        "POST",
        {
          email: department + "@example.test",
          permission: "editor",
          department,
        },
        owner.cookie,
      );
      assert.equal(invite.status, 201);
      const accepted = await request("/team/invites/accept", "POST", {
        token: new URL(invite.body.url).searchParams.get("invite"),
        name: department,
        email: department + "@example.test",
        password: "CP4-only-automated-qa!",
        consent: true,
      });
      assert.equal(accepted.status, 201);
      assert.equal(accepted.body.user.department, department);
      actors[department] = accepted;
    }
    const tour = await request(
      "/tours",
      "POST",
      { ...qaTour, reserved: 0 },
      owner.cookie,
    );
    assert.equal(tour.status, 201);
    const id = tour.body.id;
    assert.equal(
      (
        await request(
          "/public/" + owner.body.user.workspace + "/inquiries",
          "POST",
          {
            tour_id: id,
            name: "QA contact",
            email: "private-qa@example.test",
            people: 1,
            note: "Automated QA only",
            consent: true,
          },
        )
      ).status,
      201,
    );
    const pool = await request(
      "/pooling",
      "POST",
      {
        tour_id: id,
        partner: "QA partner",
        seats: 2,
        unit_price: 100,
        note: "QA only",
      },
      actors.operations.cookie,
    );
    assert.equal(pool.status, 201);
    const state = async (actor = owner) =>
      (await request("/workspace", "GET", null, actor.cookie)).body;
    let d = await state(),
      p = d.pooling[0];
    const lead = d.inquiries[0];
    const denied = async (actor, path, method = "PATCH", input = {}) =>
      assert.equal(
        (await request(path, method, input, actor.cookie)).status,
        403,
        actor.body.user.department + " " + path,
      );
    await denied(actors.sales, "/tours", "POST", qaTour);
    await denied(actors.sales, "/pooling", "POST", { tour_id: id });
    await denied(actors.sales, "/pooling/export", "GET");
    await denied(actors.sales, "/pooling/export.xlsx", "GET");
    await denied(actors.sales, "/pooling/history/export", "GET");
    await denied(actors.accounting, "/tasks", "POST", {});
    await denied(actors.accounting, "/tours/" + id, "PATCH", {});
    await denied(actors.accounting, "/inquiries/" + lead.id, "PATCH", {
      status: "closed",
    });
    await denied(actors.accounting, "/pooling/" + p.id, "PATCH", {
      action: "confirm",
      version: p.version,
      tour_version: d.tours[0].version,
    });
    await denied(actors.operations, "/inquiries/" + lead.id, "PATCH", {
      status: "closed",
    });
    assert.deepEqual((await state(actors.sales)).pooling, []);
    assert.deepEqual((await state(actors.sales)).poolingHistory, []);
    assert.deepEqual((await state(actors.accounting)).inquiries, []);
    for (const actor of [actors.sales,actors.accounting])
      assert.equal((await request('/catalog','GET',null,actor.cookie)).status,403);
    assert.equal((await request('/catalog','GET',null,actors.operations.cookie)).status,200);
    assert.equal((await request('/analytics','GET')).status,401);
    const salesReport=await request('/analytics?from=2026-01-01&to=2026-12-31','GET',null,actors.sales.cookie);
    assert.equal(salesReport.status,200);assert.equal(salesReport.body.pooling,null);assert.equal(salesReport.body.ledger,null);
    assert.ok(!JSON.stringify(salesReport.body).includes('QA partner'));
    const accountantReport=await request('/analytics','GET',null,actors.accounting.cookie);
    assert.equal(accountantReport.body.inquiries,null);
    assert.equal((await request('/analytics?from=2026-02-30','GET',null,owner.cookie)).status,400);
    assert.equal((await request('/analytics?from=2026-01-01&to=2026-12-31','GET',null,other.cookie)).body.tours.total,0);
    const excel=await fetch(base+'/api/pooling/export.xlsx',{headers:{Cookie:actors.accounting.cookie}});
    assert.equal(excel.status,200);assert.match(excel.headers.get('content-type'),/spreadsheetml/);assert.equal(new Uint8Array(await excel.arrayBuffer())[0],80);
    assert.equal(
      (
        await request(
          "/inquiries/" + lead.id,
          "PATCH",
          { status: "contacted", version: lead.version },
          actors.sales.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/pooling/" + p.id,
          "PATCH",
          {
            action: "confirm",
            version: p.version,
            tour_version: d.tours[0].version,
          },
          actors.operations.cookie,
        )
      ).status,
      200,
    );
    d = await state();
    p = d.pooling[0];
    await denied(actors.operations, "/pooling/" + p.id, "PATCH", {
      action: "payment",
      version: p.version,
      paid: 100,
    });
    assert.equal(
      (
        await request(
          "/pooling/" + p.id,
          "PATCH",
          { action: "payment", version: p.version, paid: 100 },
          actors.accounting.cookie,
        )
      ).status,
      200,
    );
    const task = await request(
      "/tasks",
      "POST",
      {
        tour_id: id,
        title: "QA task",
        assignee: "QA",
        due: "2026-12-01",
        priority: "normal",
      },
      actors.sales.cookie,
    );
    assert.equal(task.status, 201);
    await denied(actors.accounting, "/tasks/" + task.body.id, "PATCH", {
      status: "done",
      version: 1,
    });
    for (const method of ["GET", "PUT"])
      assert.equal(
        (await request("/planning", method, {}, owner.cookie)).status,
        404,
      );
    assert.equal(
      (
        await request(
          "/team/members/" + actors.sales.body.user.id,
          "PATCH",
          { department: "accounting" },
          actors.manager.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          "/team/members/" + actors.sales.body.user.id,
          "PATCH",
          { department: "accounting" },
          owner.cookie,
        )
      ).status,
      200,
    );
    assert.equal((await state(actors.sales)).access.canReadInquiries, false);
    assert.equal((await state(actors.sales)).access.canRecordReceipts, true);
    assert.equal(
      (
        await request(
          "/team/members/" + actors.sales.body.user.id,
          "PATCH",
          { permission: "viewer" },
          owner.cookie,
        )
      ).status,
      200,
    );
    await denied(actors.sales, "/pooling/" + p.id, "PATCH", {
      action: "payment",
      version: 2,
      paid: 200,
    });
    assert.equal(
      (await request("/account", "DELETE", {}, owner.cookie)).status,
      200,
    );
    assert.equal(
      (await request("/workspace", "GET", null, actors.manager.cookie)).status,
      401,
    );
  } finally {
    child.kill();
    if (child.exitCode === null) await once(child, "exit");
    assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + sep));
    rmSync(dir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  }
});
