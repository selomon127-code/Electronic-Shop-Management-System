const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");
const User = require("../models/User");
const { restrictTo } = require("../middleware/adminAuth");

const originalFindById = User.findById;

test("user schema permits only the requested roles and defaults to customer", () => {
  assert.deepEqual(User.schema.path("role").enumValues, [
    "customer",
    "business_owner",
    "system_admin",
  ]);
  assert.equal(new User().role, "customer");
});

afterEach(() => {
  User.findById = originalFindById;
});

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("restrictTo authorizes from the current database role, not the token claim", async () => {
  User.findById = () => ({ select: async () => ({ role: "business_owner" }) });
  const req = { userId: "user-1", user: { role: "system_admin" } };
  const res = responseRecorder();
  let nextCalled = false;

  await restrictTo("business_owner")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.role, "business_owner");
});

test("restrictTo denies an authenticated user whose current role is not allowed", async () => {
  User.findById = () => ({ select: async () => ({ role: "customer" }) });
  const req = { userId: "user-1" };
  const res = responseRecorder();
  let nextCalled = false;

  await restrictTo("business_owner")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("restrictTo rejects missing identity and invalid role configuration", async () => {
  const res = responseRecorder();
  await restrictTo("system_admin")({}, res, () => assert.fail("next should not be called"));

  assert.equal(res.statusCode, 401);
  assert.throws(() => restrictTo("admin"), /valid user roles/);
});
