import { createJSEngine } from "../src/core/js-execution-engine.js";
import { asyncFunctionAssertion } from "../src/assertions/javascript/async.js";
import { functionAssertion } from "../src/assertions/javascript/functions.js";
import { withTimeout, AsyncTimeoutError } from "../src/utils/async.js";
import { deepEqual } from "../src/utils/deep-equal.js";
import { ASYNC_TIMEOUT_MS } from "../src/constants/async.js";

async function test(description, fn) {
  try {
    await fn();
    console.log(`  ✔ ${description}`);
  } catch (e) {
    console.log(`  ✘ ${description}: ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function makeReq(id, check) {
  return {
    id: id || "async-test-001",
    name: "Async Test",
    points: 5,
    check: check || {},
  };
}

console.log("\nJS Async Assertion Tests\n");

test("returnsPromise: passes when function returns a Promise", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve('ok'); }",
    html: "",
  });
  const req = makeReq("rp-001", {
    type: "function",
    assertion: "returnsPromise",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when function returns a Promise");
});

test("returnsPromise: passes for an async function", async () => {
  const engine = createJSEngine({
    code: "async function getData() { return 'ok'; }",
    html: "",
  });
  const req = makeReq("rp-002", {
    type: "function",
    assertion: "returnsPromise",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass for async functions");
});

test("returnsPromise: fails when function returns a plain value", async () => {
  const engine = createJSEngine({
    code: "function getData() { return 42; }",
    html: "",
  });
  const req = makeReq("rp-003", {
    type: "function",
    assertion: "returnsPromise",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when function returns a plain value");
  assert(result.message.includes("must return a Promise"), "message should explain Promise requirement");
});

test("returnsPromise: fails when function is missing", async () => {
  const engine = createJSEngine({ code: "", html: "" });
  const req = makeReq("rp-004", {
    type: "function",
    assertion: "returnsPromise",
    name: "missing",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when function missing");
  assert(result.message.includes("was not found"), "message should say function not found");
});

test("returnsPromise: fails when function throws synchronously", async () => {
  const engine = createJSEngine({
    code: "function getData() { throw new Error('boom'); }",
    html: "",
  });
  const req = makeReq("rp-005", {
    type: "function",
    assertion: "returnsPromise",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when function throws");
  assert(result.message.includes("threw an error"), "message should mention the thrown error");
});

test("resolves: passes when promise resolves with matching primitive", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve('Hello'); }",
    html: "",
  });
  const req = makeReq("rs-001", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when resolved value matches");
});

test("resolves: passes when promise resolves with a number", async () => {
  const engine = createJSEngine({
    code: "function getCount() { return Promise.resolve(3); }",
    html: "",
  });
  const req = makeReq("rs-002", {
    type: "function",
    assertion: "resolves",
    name: "getCount",
    value: 3,
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when resolved number matches");
});

test("resolves: passes when promise resolves with a boolean", async () => {
  const engine = createJSEngine({
    code: "function isReady() { return Promise.resolve(true); }",
    html: "",
  });
  const req = makeReq("rs-003", {
    type: "function",
    assertion: "resolves",
    name: "isReady",
    value: true,
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when resolved boolean matches");
});

test("resolves: passes for an async function resolving a value", async () => {
  const engine = createJSEngine({
    code: "async function getData() { return 'Hello'; }",
    html: "",
  });
  const req = makeReq("rs-004", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass for async/await functions");
});

test("resolves: passes when promise resolves via setTimeout", async () => {
  const engine = createJSEngine({
    code: `
      function getData() {
        return new Promise((resolve) => setTimeout(() => resolve('Hello'), 10));
      }
    `,
    html: "",
  });
  const req = makeReq("rs-005", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when promise resolves after a delay");
});

test("resolves: passes with deep equality for objects", async () => {
  const engine = createJSEngine({
    code: `
      function getData() {
        return Promise.resolve({ id: 1, name: 'John', nested: { active: true } });
      }
    `,
    html: "",
  });
  const req = makeReq("rs-006", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: { id: 1, name: "John", nested: { active: true } },
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when nested object matches");
});

test("resolves: passes with deep equality for arrays", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve([1, 2, 3]); }",
    html: "",
  });
  const req = makeReq("rs-007", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: [1, 2, 3],
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when array matches");
});

test("resolves: passes for arrays of objects", async () => {
  const engine = createJSEngine({
    code: `
      function getUsers() {
        return Promise.resolve([{ id: 1 }, { id: 2 }]);
      }
    `,
    html: "",
  });
  const req = makeReq("rs-008", {
    type: "function",
    assertion: "resolves",
    name: "getUsers",
    value: [{ id: 1 }, { id: 2 }],
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when array of objects matches");
});

test("resolves: passes with arguments passed to the function", async () => {
  const engine = createJSEngine({
    code: "function getData(n) { return Promise.resolve(n * 2); }",
    html: "",
  });
  const req = makeReq("rs-009", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    args: [21],
    value: 42,
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when args are forwarded");
});

test("resolves: fails when resolved value is incorrect", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve('Wrong'); }",
    html: "",
  });
  const req = makeReq("rs-010", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when resolved value mismatches");
  assert(result.message.includes('to resolve to "Hello"'), "message should show expected value");
  assert(result.message.includes('resolved to "Wrong"'), "message should show actual value");
});

test("resolves: fails when object shape differs", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve({ id: 1, name: 'Jane' }); }",
    html: "",
  });
  const req = makeReq("rs-011", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: { id: 1, name: "John" },
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when object differs");
});

test("resolves: fails when array differs", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve([1, 2]); }",
    html: "",
  });
  const req = makeReq("rs-012", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: [1, 2, 3],
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when array differs");
});

test("resolves: fails when the promise rejects", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.reject(new Error('Network Error')); }",
    html: "",
  });
  const req = makeReq("rs-013", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when promise rejects");
  assert(result.message.includes("rejected with: Network Error"), "message should show rejection reason");
});

test("resolves: fails when function returns a plain value", async () => {
  const engine = createJSEngine({
    code: "function getData() { return 'Hello'; }",
    html: "",
  });
  const req = makeReq("rs-014", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when no promise is returned");
  assert(result.message.includes("must return a Promise"), "message should mention Promise requirement");
});

test("resolves: fails when function throws synchronously", async () => {
  const engine = createJSEngine({
    code: "function getData() { throw new Error('boom'); }",
    html: "",
  });
  const req = makeReq("rs-015", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when function throws synchronously");
  assert(result.message.includes("threw an error"), "message should mention the thrown error");
});

test("resolves: times out when the promise never settles", async () => {
  const engine = createJSEngine({
    code: "function getData() { return new Promise(() => {}); }",
    html: "",
  });
  const req = makeReq("rs-tm", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await asyncFunctionAssertion(engine, req, { timeoutMs: 100 });
  assert(!result.passed, "should fail on timeout");
  assert(result.message.includes("did not settle within 100ms"), "message should mention the timeout duration");
});

test("rejects: passes when the promise rejects", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.reject(new Error('Network Error')); }",
    html: "",
  });
  const req = makeReq("rj-001", {
    type: "function",
    assertion: "rejects",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when promise rejects");
});

test("rejects: passes when an async function throws", async () => {
  const engine = createJSEngine({
    code: "async function getData() { throw new Error('boom'); }",
    html: "",
  });
  const req = makeReq("rj-002", {
    type: "function",
    assertion: "rejects",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when async function throws (async error)");
});

test("rejects: passes when rejection happens after a delay", async () => {
  const engine = createJSEngine({
    code: `
      function getData() {
        return new Promise((_, reject) => setTimeout(() => reject(new Error('late')), 10));
      }
    `,
    html: "",
  });
  const req = makeReq("rj-003", {
    type: "function",
    assertion: "rejects",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when rejection is delayed");
});

test("rejects: fails when the promise resolves", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve('ok'); }",
    html: "",
  });
  const req = makeReq("rj-004", {
    type: "function",
    assertion: "rejects",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when promise resolves");
  assert(result.message.includes("Expected function \"getData\" to reject, but it resolved"), "message should explain it resolved");
});

test("rejects: fails when function throws synchronously", async () => {
  const engine = createJSEngine({
    code: "function getData() { throw new Error('boom'); }",
    html: "",
  });
  const req = makeReq("rj-005", {
    type: "function",
    assertion: "rejects",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when function throws synchronously (not a promise rejection)");
  assert(result.message.includes("threw an error"), "message should mention the thrown error");
});

test("rejects: fails when function returns a plain value", async () => {
  const engine = createJSEngine({
    code: "function getData() { return 'value'; }",
    html: "",
  });
  const req = makeReq("rj-006", {
    type: "function",
    assertion: "rejects",
    name: "getData",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when no promise is returned");
});

test("rejects: times out when the promise never settles", async () => {
  const engine = createJSEngine({
    code: "function getData() { return new Promise(() => {}); }",
    html: "",
  });
  const req = makeReq("rj-tm", {
    type: "function",
    assertion: "rejects",
    name: "getData",
  });
  const result = await asyncFunctionAssertion(engine, req, { timeoutMs: 100 });
  assert(!result.passed, "should fail on timeout");
});

test("rejectsWith: passes when rejection message matches", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.reject(new Error('Network Error')); }",
    html: "",
  });
  const req = makeReq("rw-001", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when rejection message matches");
});

test("rejectsWith: passes when async function throws matching error", async () => {
  const engine = createJSEngine({
    code: "async function getData() { throw new Error('Network Error'); }",
    html: "",
  });
  const req = makeReq("rw-002", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass for async function errors");
});

test("rejectsWith: fails when rejection message differs", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.reject(new Error('Server Error')); }",
    html: "",
  });
  const req = makeReq("rw-003", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when message differs");
  assert(result.message.includes('to reject with "Network Error"'), "message should show expected message");
  assert(result.message.includes("Server Error"), "message should show actual message");
});

test("rejectsWith: fails when the promise resolves", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve('ok'); }",
    html: "",
  });
  const req = makeReq("rw-004", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when promise resolves");
});

test("rejectsWith: times out when the promise never settles", async () => {
  const engine = createJSEngine({
    code: "function getData() { return new Promise(() => {}); }",
    html: "",
  });
  const req = makeReq("rw-tm", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await asyncFunctionAssertion(engine, req, { timeoutMs: 100 });
  assert(!result.passed, "should fail on timeout");
  assert(result.message.includes("did not settle within 100ms"), "message should mention the timeout duration");
});

test("async assertions: fail when engine has an execution error", async () => {
  const engine = createJSEngine({ code: "const x = ;", html: "" });
  const req = makeReq("err-001", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when engine execution failed");
  assert(result.message.includes("JavaScript error prevented evaluation"), "message should explain the execution error");
});

test("async assertions: award points on pass and zero on fail", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.resolve('Hello'); }",
    html: "",
  });
  const req = makeReq("pts-001", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const pass = await functionAssertion(engine, req);
  assert(pass.passed, "should pass");
  assert(pass.earned === 5, `earned should be 5, got ${pass.earned}`);

  const badEngine = createJSEngine({
    code: "function getData() { return Promise.resolve('Wrong'); }",
    html: "",
  });
  const fail = await functionAssertion(badEngine, req);
  assert(!fail.passed, "should fail");
  assert(fail.earned === 0, "earned should be 0");
});

test("rejectsWith: passes when rejecting with a plain string reason", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.reject('Network Error'); }",
    html: "",
  });
  const req = makeReq("rw-005", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass when rejection reason is a string");
});

test("rejectsWith: passes when async function throws a cross-realm error", async () => {
  const engine = createJSEngine({
    code: `
      function makeError() {
        throw new Error('Network Error');
      }
      async function getData() {
        try {
          makeError();
        } catch (e) {
          throw new Error('Network Error');
        }
      }
    `,
    html: "",
  });
  const req = makeReq("rw-006", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await functionAssertion(engine, req);
  assert(result.passed, "should pass for errors created inside the sandbox");
});

test("rejectsWith: fails when rejecting with a plain string that differs", async () => {
  const engine = createJSEngine({
    code: "function getData() { return Promise.reject('Server Error'); }",
    html: "",
  });
  const req = makeReq("rw-007", {
    type: "function",
    assertion: "rejectsWith",
    name: "getData",
    value: "Network Error",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when string reason differs");
});

test("resolves: fails when function is not a function", async () => {
  const engine = createJSEngine({
    code: "const getData = 42;",
    html: "",
  });
  const req = makeReq("rs-016", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const result = await functionAssertion(engine, req);
  assert(!result.passed, "should fail when value is not a function");
  assert(result.message.includes("not a function"), "message should say it is not a function");
});

test("sync function assertions with an assertion field still work", async () => {
  const engine = createJSEngine({
    code: "function greet() { return 'hello'; }",
    html: "",
  });
  const existsReq = makeReq("sync-001", {
    type: "function",
    assertion: "exists",
    name: "greet",
  });
  const existsResult = await functionAssertion(engine, existsReq);
  assert(existsResult.passed, "assertion \"exists\" should pass when function exists");

  const returnsReq = makeReq("sync-002", {
    type: "function",
    assertion: "exists",
    name: "add",
    args: [2, 3],
    returns: 5,
  });
  const missingEngine = createJSEngine({
    code: "function add(a, b) { return a + b; }",
    html: "",
  });
  const returnsResult = await functionAssertion(missingEngine, returnsReq);
  assert(returnsResult.passed, "sync return-value check should still work alongside assertion field");
});

test("multiple async assertions: several functions evaluated in one engine", async () => {
  const engine = createJSEngine({
    code: `
      function getData() { return Promise.resolve('Hello'); }
      function getCount() { return Promise.resolve([1, 2, 3]); }
      function fail() { return Promise.reject(new Error('Network Error')); }
    `,
    html: "",
  });

  const resolveReq = makeReq("multi-001", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const arrayReq = makeReq("multi-002", {
    type: "function",
    assertion: "resolves",
    name: "getCount",
    value: [1, 2, 3],
  });
  const rejectReq = makeReq("multi-003", {
    type: "function",
    assertion: "rejectsWith",
    name: "fail",
    value: "Network Error",
  });

  const r1 = await functionAssertion(engine, resolveReq);
  const r2 = await functionAssertion(engine, arrayReq);
  const r3 = await functionAssertion(engine, rejectReq);

  assert(r1.passed, "first async assertion should pass");
  assert(r2.passed, "second async assertion should pass");
  assert(r3.passed, "third async assertion should pass");
});

test("withTimeout: resolves with the awaited value", async () => {
  const value = await withTimeout(Promise.resolve(42), 100);
  assert(value === 42, "should resolve with the value");
});

test("withTimeout: rejects with AsyncTimeoutError on timeout", async () => {
  let timedOut = false;
  try {
    await withTimeout(new Promise(() => {}), 50);
  } catch (e) {
    timedOut = e instanceof AsyncTimeoutError;
  }
  assert(timedOut, "should reject with AsyncTimeoutError");
});

test("withTimeout: propagates the original rejection", async () => {
  let message = "";
  try {
    await withTimeout(Promise.reject(new Error("boom")), 100);
  } catch (e) {
    message = e.message;
  }
  assert(message === "boom", "should propagate the original error");
});

test("withTimeout: late rejection after timeout does not crash the process", async () => {
  let timedOut = false;
  let surfaced = false;

  const onUnhandled = () => {
    surfaced = true;
  };
  process.on("unhandledRejection", onUnhandled);

  try {
    const late = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("late")), 80)
    );
    await withTimeout(late, 20);
  } catch (e) {
    timedOut = e instanceof AsyncTimeoutError;
  }

  await new Promise((resolve) => setTimeout(resolve, 120));
  process.removeListener("unhandledRejection", onUnhandled);

  assert(timedOut, "should time out first");
  assert(!surfaced, "late rejection should not surface as unhandled");
});

test("deepEqual: handles primitives, objects, and arrays", () => {
  assert(deepEqual(1, 1), "numbers equal");
  assert(deepEqual("a", "a"), "strings equal");
  assert(deepEqual(null, null), "nulls equal");
  assert(deepEqual({ a: 1, b: { c: [1, 2] } }, { a: 1, b: { c: [1, 2] } }), "nested objects equal");
  assert(deepEqual([1, [2, 3]], [1, [2, 3]]), "nested arrays equal");
  assert(!deepEqual({ a: 1 }, { a: 2 }), "different values not equal");
  assert(!deepEqual({ a: 1 }, { a: 1, b: 2 }), "different key counts not equal");
  assert(!deepEqual([1, 2], [2, 1]), "different order not equal");
  assert(!deepEqual({ a: 1 }, [1]), "object vs array not equal");
});

test("default timeout constant is 3000ms", () => {
  assert(ASYNC_TIMEOUT_MS === 3000, `expected 3000, got ${ASYNC_TIMEOUT_MS}`);
});

console.log("\n");
