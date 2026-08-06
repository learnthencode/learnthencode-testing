import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import {
  resolveFetchMock,
  fetchCallMatches,
  parseMethodRouteKey,
} from "../src/assertions/react/fetch.js";
import { parseRequestBody } from "../src/assertions/react/fetch-assertions.js";
import {
  createReactLab,
  removeReactLab,
  CRUD_USERS_APP_JSX,
} from "./helpers/react-lab-fixtures.js";

const tests = [];

function test(description, fn) {
  tests.push({ description, fn });
}

async function run() {
  let failed = 0;
  for (const { description, fn } of tests) {
    try {
      await fn();
      console.log(`  ✔ ${description}`);
    } catch (e) {
      failed++;
      console.log(`  ✘ ${description}: ${e.message}`);
    }
  }
  if (failed > 0) {
    process.exitCode = 1;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function makeReq(subtype, extra = {}) {
  return {
    id: "react-fetch-method-" + subtype,
    name: "React fetch method test",
    points: 5,
    check: { type: "react", subtype, component: "src/App.jsx", ...extra },
  };
}

async function makeEngine(files) {
  const lab = createReactLab({ files });
  const engine = createReactEngine({ labDirectory: lab });
  return { lab, engine };
}

console.log("\nReact CRUD Fetch Method Tests (v1.3.2)\n");

test("parseMethodRouteKey parses method-prefixed keys", () => {
  assert(
    JSON.stringify(parseMethodRouteKey("POST /users")) ===
      JSON.stringify({ method: "POST", url: "/users" }),
    "POST key should parse"
  );
  assert(
    JSON.stringify(parseMethodRouteKey("delete /api/users/1")) ===
      JSON.stringify({ method: "DELETE", url: "/api/users/1" }),
    "lowercase delete key should parse"
  );
  assert(parseMethodRouteKey("/users") === null, "plain URL key should not parse");
});

test("resolveFetchMock routes by method and URL", () => {
  const mocks = {
    "POST /users": { status: 201, body: { id: 2, name: "Bob" } },
    "PUT /users/1": { status: 200, body: { id: 1, name: "Alicia" } },
    "DELETE /users/1": { status: 200, body: {} },
    "/users": { body: [{ id: 1, name: "Alice" }] },
  };

  const post = resolveFetchMock(mocks, "/users", "POST");
  assert(post && post.status === 201, "POST /users should hit the POST route");

  const get = resolveFetchMock(mocks, "/users", "GET");
  assert(get && Array.isArray(get.body), "GET /users should hit the plain route");

  const put = resolveFetchMock(mocks, "/users/1", "PUT");
  assert(put && put.body.id === 1, "PUT /users/1 should hit the PUT route");

  const del = resolveFetchMock(mocks, "/users/1", "DELETE");
  assert(del && del.body.id === undefined, "DELETE /users/1 should hit the DELETE route");
});

test("resolveFetchMock never crosses methods", () => {
  const mocks = { "POST /users": { body: { created: true } } };
  const get = resolveFetchMock(mocks, "/users", "GET");
  assert(get === null, "GET must not match a POST-only route");
  const post = resolveFetchMock(mocks, "/users", "POST");
  assert(post !== null, "POST should match its own route");
});

test("resolveFetchMock keeps exact, substring, and catch-all behavior", () => {
  const mocks = {
    "/api/users": { body: "exact" },
    "*": { body: "fallback" },
  };
  assert(
    resolveFetchMock(mocks, "/api/users").body === "exact",
    "exact plain key wins"
  );
  assert(
    resolveFetchMock(mocks, "/other").body === "fallback",
    "unmatched URL falls back to catch-all"
  );
  assert(
    resolveFetchMock({ "POST /users": { body: "x" } }, "/users/1", "POST").body === "x",
    "method-prefixed substring URL matches"
  );
});

test("method-prefixed routes win over plain URL keys", () => {
  const mocks = {
    "/users": { body: "plain" },
    "POST /users": { body: "post" },
  };
  assert(
    resolveFetchMock(mocks, "/users", "POST").body === "post",
    "POST /users must hit the method-prefixed route"
  );
  assert(
    resolveFetchMock(mocks, "/users", "GET").body === "plain",
    "GET /users must hit the plain route"
  );
});

test("fetchCallMatches requires method for prefixed keys", () => {
  const call = { url: "/users", method: "POST" };
  assert(fetchCallMatches(call, "POST /users"), "POST call matches POST key");
  assert(!fetchCallMatches(call, "GET /users"), "POST call must not match GET key");
  assert(fetchCallMatches(call, "/users"), "plain key matches any method");
  assert(
    fetchCallMatches({ url: "/users/1", method: "DELETE" }, "DELETE /users/1"),
    "DELETE call matches DELETE /users/1"
  );
});

test("parseRequestBody decodes JSON strings", () => {
  assert(
    JSON.stringify(parseRequestBody('{"name":"Bob"}')) === '{"name":"Bob"}',
    "JSON string should parse"
  );
  assert(parseRequestBody("name=Bob") === "name=Bob", "non-JSON stays raw");
  assert(
    JSON.stringify(parseRequestBody({ name: "Bob" })) === '{"name":"Bob"}',
    "objects pass through"
  );
});

test("engine records method and body for every fetch call", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    engine.setFetchMocks({
      "/api/users": { body: [{ id: 1, name: "Alice" }] },
      "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
    });
    await engine.renderComponent({ file: "src/App.jsx" });
    const submit = reactAssertions.submit;
    await submit(engine, makeReq("submit", {
      values: { "#name": "Bob" },
      fetch: {
        "/api/users": { body: [{ id: 1, name: "Alice" }] },
        "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
      },
      expect: { text: "Bob" },
    }));

    const postCall = engine.fetchCalls.find(
      (call) => call.method === "POST"
    );
    assert(postCall, "a POST call should have been recorded");
    assert(postCall.url === "/api/users", `expected /api/users, got ${postCall.url}`);
    assert(postCall.body === '{"name":"Bob"}', `unexpected body: ${postCall.body}`);
    const getCall = engine.fetchCalls.find((call) => call.method === "GET");
    assert(getCall, "the mount GET should have been recorded");
  } finally {
    removeReactLab(lab);
  }
});

test("loadsOnMount accepts method-prefixed GET routes", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.loadsOnMount(
      engine,
      makeReq("loadsOnMount", {
        fetch: { "GET /api/users": { body: [{ id: 1, name: "Alice" }] } },
        expect: { text: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("loadsOnMount fails when a method-prefixed route was never called", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.loadsOnMount(
      engine,
      makeReq("loadsOnMount", {
        fetch: { "POST /api/users": { body: [] } },
        expect: { text: "No users found." },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("POST /api/users"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fetch assertion accepts method-prefixed routes", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.fetch(
      engine,
      makeReq("fetch", {
        fetch: { "GET /api/users": { body: [{ id: 1, name: "Alice" }] } },
        expect: { text: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

await run();
