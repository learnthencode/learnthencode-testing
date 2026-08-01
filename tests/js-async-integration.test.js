import { run } from "../src/core/runner.js";
import { executeRequirement } from "../src/core/execute-requirements.js";
import { createJSEngine } from "../src/core/js-execution-engine.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB_ASYNC = path.resolve(__dirname, "..", "test-lab-async");
const LAB_JS = path.resolve(__dirname, "..", "test-lab-js");
const LAB_HTML = path.resolve(__dirname, "..", "test-lab");
const LAB_CSS = path.resolve(__dirname, "..", "test-lab-css");

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
    id: id || "int-001",
    name: "Integration Test",
    points: 5,
    check: check || {},
  };
}

console.log("\nJS Async Integration Tests\n");

test("run: executes all async requirements on the async lab", async () => {
  const results = await run(LAB_ASYNC);
  const summary = results.summary();
  assert(summary.total === 6, `expected 6 requirements, got ${summary.total}`);
  assert(summary.passed === 6, `expected 6 passed, got ${summary.passed}`);
  assert(summary.failed === 0, "expected no failures");
  assert(summary.percentage === 100, "expected 100% score");
});

test("run: existing synchronous JS lab still passes unchanged", async () => {
  const results = await run(LAB_JS);
  const summary = results.summary();
  assert(summary.failed === 0, `expected no failures, got ${summary.failed}`);
  assert(summary.total === 3, `expected 3 requirements, got ${summary.total}`);
});

test("run: existing HTML lab still passes unchanged", async () => {
  const results = await run(LAB_HTML);
  const summary = results.summary();
  assert(summary.failed === 0, `expected no failures, got ${summary.failed}`);
  assert(summary.total === 2, `expected 2 requirements, got ${summary.total}`);
});

test("run: existing CSS lab still passes unchanged", async () => {
  const results = await run(LAB_CSS);
  const summary = results.summary();
  assert(summary.failed === 0, `expected no failures, got ${summary.failed}`);
  assert(summary.total > 0, "expected at least one CSS requirement");
});

test("executeRequirement: sync and async assertions coexist in one engine", async () => {
  const engine = createJSEngine({
    code: `
      const username = 'John';
      function getData() { return Promise.resolve('Hello'); }
    `,
    html: "",
  });

  const syncReq = makeReq("mix-sync", { type: "variable", name: "username", value: "John" });
  const syncResult = executeRequirement(syncReq, "", "", engine);
  assert(syncResult.passed, "synchronous assertion should return a plain result");

  const asyncReq = makeReq("mix-async", {
    type: "function",
    assertion: "resolves",
    name: "getData",
    value: "Hello",
  });
  const asyncResult = await executeRequirement(asyncReq, "", "", engine);
  assert(asyncResult.passed, "asynchronous assertion should pass when awaited");
});

test("executeRequirement: sync assertions still return plain results (no await needed)", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("sync-direct", { type: "variable", name: "x" });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed === true, "result should be a plain object with passed=true");
  assert(typeof result.earned === "number", "result should be a fully-formed result object");
});

test("runner: failure of one async requirement does not stop later requirements", async () => {
  const engine = createJSEngine({
    code: `
      function ok() { return Promise.resolve('Hello'); }
      function bad() { return Promise.reject(new Error('Network Error')); }
    `,
    html: "",
  });

  const passing = await executeRequirement(
    makeReq("seq-001", { type: "function", assertion: "resolves", name: "ok", value: "Hello" }),
    "", "", engine
  );
  const failing = await executeRequirement(
    makeReq("seq-002", { type: "function", assertion: "rejectsWith", name: "bad", value: "Wrong" }),
    "", "", engine
  );
  const passingAgain = await executeRequirement(
    makeReq("seq-003", { type: "function", assertion: "rejects", name: "bad" }),
    "", "", engine
  );

  assert(passing.passed, "first requirement should pass");
  assert(!failing.passed, "second requirement should fail");
  assert(passingAgain.passed, "third requirement should still pass");
});

console.log("\n");
