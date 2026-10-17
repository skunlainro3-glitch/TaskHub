import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { qaTour } from "./fixtures.mjs";

test("MVP: consent, isolation, seat sync, concurrency, exports, persistence and deletion", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "taskhub-test-"));
  const port = 3300 + Math.floor(Math.random() * 500);
  const base = "http://127.0.0.1:" + port;
  let child;
  const start = async () => {
    child = spawn(process.execPath, ["server/index.mjs"], {
      env: {
        ...process.env,
        NODE_ENV: "test",
        ADMIN_EMAIL: "admin@taskhub.local",
        DATA_DIR: dir,
        TURSO_DATABASE_URL:
          process.env.TEST_DATABASE_DRIVER === "libsql"
            ? "file:" + join(dir, "taskhub.sqlite").replaceAll("\\", "/")
            : "",
        TURSO_AUTH_TOKEN: "",
        REQUIRE_REMOTE_DB: "0",
        PORT: String(port),
        HOST: "127.0.0.1",
        ADMIN_PASSWORD: "Test-admin-secret-2026!",
        REVIEWER_EMAIL: "reviewer@example.test",
        REVIEWER_PASSWORD: "Test-reviewer-secret-2026!",
      },
      stdio: "pipe",
    });
    let startupErrors = "";
    child.stderr.on("data", (chunk) => {
      startupErrors = (startupErrors + chunk.toString()).slice(-2500);
    });
    for (let i = 0; i < 80; i++) {
      if (child.exitCode !== null)
        throw Error("Test server exited: " + startupErrors);
      try {
        if ((await fetch(base + "/api/health")).ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw Error("Test server failed to start: " + startupErrors);
  };
  const stop = async () => {
    if (child.exitCode !== null) return;
    const exited = once(child, "exit");
    child.kill();
    await exited;
  };
  async function request(path, method = "GET", data, cookie) {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-TaskHub": "1",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const body = await r.text();
    return {
      status: r.status,
      body: body.startsWith("{") ? JSON.parse(body) : body,
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  const participant = (name) => ({
    name,
    email: name.toLowerCase() + "@example.test",
    password: "tester-pass-2026",
    role: "operations",
    company_size: "10to30",
    consent: true,
  });
  try {
    await start();
    await t.test(
      "reviewer can inspect but cannot mutate or count as a participant",
      async () => {
        const reviewer = await request("/login", "POST", {
          email: "reviewer@example.test",
          password: "Test-reviewer-secret-2026!",
        });
        assert.equal(reviewer.status, 200);
        assert.equal(reviewer.body.user.role, "reviewer");
        const cookie = reviewer.cookie;
        const workspace = await request("/workspace", "GET", null, cookie);
        assert.equal(workspace.status, 200);
        assert.equal(workspace.body.tours.length, 0);
        const tour = { ...qaTour, id: "nonexistent" };
        for (const [path, method, payload] of [
          ["/tours", "POST", tour],
          ["/tours/" + tour.id, "PUT", tour],
          ["/tours/" + tour.id, "DELETE", { version: 1 }],
          ["/tasks", "POST", {}],
          ["/tasks/nonexistent", "PATCH", { status: "done" }],
          ["/inquiries/fake", "PATCH", { status: "closed" }],
          ["/feedback", "POST", {}],
          ["/account", "DELETE", {}],
          ["/public/agency/inquiries", "POST", {}],
        ])
          assert.equal(
            (await request(path, method, payload, cookie)).status,
            403,
          );
        assert.equal(
          (await request("/research", "GET", null, cookie)).body.participants,
          0,
        );
        assert.equal(
          (
            await request(
              "/events",
              "POST",
              { action: "portal_viewed" },
              cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request("/research", "GET", null, cookie)).body.events,
          0,
        );
        const raw = new DatabaseSync(join(dir, "taskhub.sqlite"));
        raw
          .prepare("UPDATE users SET consent_at=? WHERE role='reviewer'")
          .run("2000-01-01T00:00:00.000Z");
        raw.close();
        await stop();
        await start();
        assert.equal(
          (await request("/workspace", "GET", null, cookie)).status,
          200,
        );
        assert.equal((await request("/public/agency")).status, 200);
      },
    );
    await t.test(
      "requires consent, validates dates and protects APIs",
      async () => {
        assert.equal(
          (
            await request("/register", "POST", {
              ...participant("NoConsent"),
              consent: false,
            })
          ).status,
          400,
        );
        assert.equal((await request("/workspace")).status, 401);
        assert.equal(
          (
            await fetch(base + "/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await fetch(base + "/api/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-TaskHub": "1",
                Origin: "https://other.test",
              },
              body: "{}",
            })
          ).status,
          403,
        );
      },
    );
    const a = await request("/register", "POST", participant("TesterA")),
      b = await request("/register", "POST", participant("TesterB"));
    await t.test(
      "duplicate concurrent signups return a conflict without orphan data",
      async () => {
        const results = await Promise.all([
          request("/register", "POST", participant("Duplicate")),
          request("/register", "POST", participant("Duplicate")),
        ]);
        assert.deepEqual(
          results.map((result) => result.status).sort(),
          [201, 409],
        );
        const registered = results.find((result) => result.status === 201);
        assert.equal(
          (await request("/account", "DELETE", null, registered.cookie)).status,
          200,
        );
      },
    );
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    assert.notEqual(a.body.user.workspace, b.body.user.workspace);
    const ac = a.cookie,
      bc = b.cookie,
      ws = a.body.user.workspace;
    await t.test("new workspaces contain no fabricated tours, staff or public offers", async () => {
      for (const cookie of [ac, bc]) {
        const data = (await request('/workspace','GET',null,cookie)).body;
        assert.deepEqual(data.tours, []);
        assert.deepEqual(data.tasks, []);
      }
      assert.deepEqual((await request('/public/'+ws)).body.tours, []);
      assert.deepEqual((await request('/public/agency')).body.tours, []);
    });
    await t.test('reference catalog is available without creating offers or accepting unconfirmed bookings', async () => {
      const root = (await request('/public/agency')).body;
      assert.equal(root.catalog.tours.length,13);
      assert.equal(root.catalog.tours.find(t=>t.code==='EVG-TQ11').price,null);
      assert.equal((await request('/public/'+ws)).body.catalog,null);
      const own = (await request('/workspace','GET',null,ac)).body;
      assert.equal(own.catalog.tours.length,13);
      assert.deepEqual(own.tours,[]);
      assert.ok(own.activity.every(e => e.action === 'test_started'));
      assert.equal((await request('/public/agency/inquiries','POST',{
        tour_id:root.catalog.tours[0].id,name:'QA',email:'qa@example.test',people:1,consent:true
      })).status,404);
      assert.equal((await request('/tours','POST',{...qaTour,departure:'Hàng tuần',capacity:null},ac)).status,400);
    });
    // All business fields below are explicit QA input; production creates none.
    assert.equal((await request('/tours','POST',qaTour,ac)).status,201);
    assert.equal((await request('/tours','POST',qaTour,bc)).status,201);
    await t.test(
      "20 concurrent workspace reads keep each account isolated",
      async () => {
        const requests = await Promise.all(
          Array.from({ length: 20 }, (_, index) =>
            request("/workspace", "GET", null, index % 2 ? ac : bc),
          ),
        );
        for (const [index, result] of requests.entries()) {
          assert.equal(result.status, 200);
          assert.equal(result.body.tours.length, 1);
          assert.equal(result.body.tasks.length, 0);
          assert.ok(
            result.body.tours.every(
              (tour) =>
                tour.workspace ===
                (index % 2 ? a.body.user.workspace : b.body.user.workspace),
            ),
          );
        }
      },
    );
    let data = (await request("/workspace", "GET", null, ac)).body;
    const initialTour = data.tours[0];
    await t.test(
      "workspace is isolated and public schema has no private contacts",
      async () => {
        const other = (await request("/workspace", "GET", null, bc)).body;
        assert.equal(other.tours.length, 1);
        assert.ok(!other.tours.some((t) => t.id === initialTour.id));
        assert.equal(
          (
            await request(
              "/tours/" + initialTour.id,
              "PUT",
              { ...initialTour, published: true },
              bc,
            )
          ).status,
          409,
        );
        const pub = (await request("/public/" + ws)).body;
        assert.equal(pub.tours.length, 1);
        assert.ok(!("workspace" in pub.tours[0]));
        assert.ok(!("inquiries" in pub));
        assert.equal((await request("/research", "GET", null, ac)).status, 403);
        assert.equal(
          (await request("/export/events", "GET", null, ac)).status,
          403,
        );
      },
    );
    const update = {
      ...initialTour,
      published: true,
      reserved: initialTour.reserved + 1,
    };
    await t.test(
      "rejects over-capacity and stale writes; public portal shares updates",
      async () => {
        assert.equal(
          (
            await request(
              "/tours/" + initialTour.id,
              "PUT",
              { ...update, reserved: initialTour.capacity + 1 },
              ac,
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await request(
              "/tours/" + initialTour.id,
              "PUT",
              { ...update, departure: "2026-02-30" },
              ac,
            )
          ).status,
          400,
        );
        assert.equal(
          (await request("/tours/" + initialTour.id, "PUT", update, ac)).status,
          200,
        );
        assert.equal(
          (await request("/tours/" + initialTour.id, "PUT", update, ac)).status,
          409,
        );
        const changed = (await request("/public/" + ws)).body.tours.find(
          (t) => t.id === initialTour.id,
        );
        assert.equal(changed.reserved, update.reserved);
        assert.equal(changed.version, initialTour.version + 1);
        const concurrent = await Promise.all([
          request(
            "/tours/" + initialTour.id,
            "PUT",
            { ...changed, published: true, reserved: changed.reserved + 1 },
            ac,
          ),
          request(
            "/tours/" + initialTour.id,
            "PUT",
            { ...changed, published: true, reserved: changed.reserved + 2 },
            ac,
          ),
        ]);
        assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 409]);
      },
    );
    let taskId;
    await t.test("task creation and status are tenant-scoped", async () => {
      const created = await request(
        "/tasks",
        "POST",
        {
          title: "Test task",
          assignee: "Test staff",
          due: "2026-10-18",
          priority: "high",
          tour_id: initialTour.id,
        },
        ac,
      );
      assert.equal(created.status, 201);
      taskId = created.body.id;
      assert.equal(
        (await request("/tasks/" + taskId, "PATCH", { status: "done" }, bc))
          .status,
        404,
      );
      assert.equal(
        (await request("/tasks/" + taskId, "PATCH", { status: "invalid" }, ac))
          .status,
        400,
      );
      assert.equal(
        (await request("/tasks/" + taskId, "PATCH", { status: "done" }, ac))
          .status,
        200,
      );
    });
    await t.test(
      "inquiries require consent and are not confirmed bookings",
      async () => {
        const inquiry = {
          tour_id: initialTour.id,
          name: "Test customer",
          email: "contact@example.test",
          people: 1,
          note: "Test only",
          consent: true,
        };
        assert.equal(
          (
            await request("/public/" + ws + "/inquiries", "POST", {
              ...inquiry,
              consent: false,
            })
          ).status,
          400,
        );
        const r = await request(
          "/public/" + ws + "/inquiries",
          "POST",
          inquiry,
        );
        assert.equal(r.status, 201);
        assert.match(r.body.message, /Chưa giữ chỗ/);
        assert.equal(
          (await request("/workspace", "GET", null, ac)).body.inquiries.length,
          1,
        );
        assert.equal(
          (await request("/workspace", "GET", null, bc)).body.inquiries.length,
          0,
        );
      },
    );
    const feedback = {
      portal: 4,
      operations: 5,
      sync: 5,
      ease: 4,
      intent: "maybe",
      price: 0,
      liked: "Shared data",
      disliked: '=HYPERLINK("example.test")',
    };
    const admin = await request("/login", "POST", {
      email: "admin@taskhub.local",
      password: "Test-admin-secret-2026!",
    });
    await t.test(
      "feedback is real, upserted once, CSV protected and formula-safe",
      async () => {
        assert.equal(
          (await request("/feedback", "POST", { ...feedback, ease: 8 }, ac))
            .status,
          400,
        );
        assert.equal(
          (await request("/feedback", "POST", feedback, ac)).status,
          200,
        );
        assert.equal(
          (await request("/feedback", "POST", feedback, ac)).status,
          200,
        );
        const research = (await request("/research", "GET", null, admin.cookie))
          .body;
        assert.equal(research.participants, 2);
        assert.equal(research.feedback.length, 1);
        assert.equal(research.readyToReview, 0);
        assert.equal(research.feedback[0].has_test_flow, 0);
        await request("/events", "POST", { action: "portal_viewed" }, ac);
        // Interaction after feedback must not qualify an earlier response.
        const beforeResubmit = (
          await request("/research", "GET", null, admin.cookie)
        ).body;
        assert.equal(beforeResubmit.readyToReview, 0);
        await request("/feedback", "POST", feedback, ac);
        const afterResubmit = (
          await request("/research", "GET", null, admin.cookie)
        ).body;
        assert.equal(afterResubmit.readyToReview, 1);
        assert.equal(afterResubmit.feedback[0].has_test_flow, 1);
        const csv = await request(
          "/export/feedback",
          "GET",
          null,
          admin.cookie,
        );
        assert.equal(csv.status, 200);
        assert.match(csv.body, /testera@example.test/);
        assert.ok(csv.body.includes("'=HYPERLINK"));
        assert.ok(!csv.body.includes("password"));
        const before = (await request("/research", "GET", null, admin.cookie))
          .body.events;
        await request("/public/" + ws);
        await request("/public/" + ws);
        assert.equal(
          (await request("/research", "GET", null, admin.cookie)).body.events,
          before,
        );
      },
    );
    await t.test(
      "all changes survive restart and logout invalidates session",
      async () => {
        await stop();
        await start();
        const after = (await request("/workspace", "GET", null, ac)).body;
        assert.equal(after.tasks.find((t) => t.id === taskId).status, "done");
        assert.equal(after.feedback.price, 0);
        assert.equal(after.inquiries.length, 1);
        assert.equal((await request("/logout", "POST", {}, bc)).status, 200);
        assert.equal(
          (await request("/workspace", "GET", null, bc)).status,
          401,
        );
      },
    );
    await t.test("tour deletion checks ownership/version and removes dependent data", async () => {
      const latest = (await request('/workspace','GET',null,ac)).body.tours.find(t=>t.id===initialTour.id);
      const other = await request('/login','POST',{email:participant('TesterB').email,password:participant('TesterB').password});
      assert.equal((await request('/tours/'+latest.id,'DELETE',{version:latest.version},other.cookie)).status,409);
      assert.equal((await request('/tours/'+latest.id,'DELETE',{version:latest.version-1},ac)).status,409);
      assert.equal((await request('/tours/'+latest.id,'DELETE',{version:latest.version},ac)).status,200);
      const after=(await request('/workspace','GET',null,ac)).body;
      assert.deepEqual(after.tours,[]); assert.deepEqual(after.tasks,[]); assert.deepEqual(after.inquiries,[]);
      assert.deepEqual((await request('/public/'+ws)).body.tours,[]);
    });
    await t.test(
      "self deletion removes participant data and public sandbox",
      async () => {
        assert.equal(
          (await request("/account", "DELETE", null, ac)).status,
          200,
        );
        assert.equal(
          (await request("/workspace", "GET", null, ac)).status,
          401,
        );
        assert.equal((await request("/public/" + ws)).status, 404);
        const r = (await request("/research", "GET", null, admin.cookie)).body;
        assert.equal(r.feedback.length, 0);
        assert.equal(r.participants, 1);
        assert.equal(r.events, 2); // Tester B's registration and explicit test tour remain.
        const csv = (await request("/export/events", "GET", null, admin.cookie))
          .body;
        assert.ok(!csv.includes("testera@example.test"));
        assert.ok(csv.includes("testerb@example.test"));
      },
    );
    await t.test(
      "180-day retention removes expired workspaces at startup",
      async () => {
        await stop();
        const raw = new DatabaseSync(join(dir, "taskhub.sqlite"));
        raw
          .prepare("UPDATE users SET consent_at=? WHERE id=?")
          .run("2000-01-01T00:00:00.000Z", b.body.user.id);
        raw.close();
        await start();
        assert.equal(
          (await request("/public/" + b.body.user.workspace)).status,
          404,
        );
        const research = (await request("/research", "GET", null, admin.cookie))
          .body;
        assert.equal(research.participants, 0);
        assert.equal(research.events, 0);
      },
    );
  } finally {
    await stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
