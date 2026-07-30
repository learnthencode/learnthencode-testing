import { createJSEngine } from "../src/core/js-execution-engine.js";
import { consoleAssertion } from "../src/assertions/javascript/console.js";

function test(description, fn) {
  try {
    fn();
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
    id: id || "console-test-001",
    name: "Console Test",
    points: 5,
    check: check || {},
  };
}

console.log("\nJS Console Assertion Tests\n");

// logContains
test("consoleAssertion logContains: passes when output contains text", () => {
  const engine = createJSEngine({ code: "console.log('Hello, World!');", html: "" });
  const req = makeReq("con-001", { type: "console", assertion: "logContains", value: "World" });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when log contains text");
});

test("consoleAssertion logContains: fails when output does not contain text", () => {
  const engine = createJSEngine({ code: "console.log('Goodbye');", html: "" });
  const req = makeReq("con-002", { type: "console", assertion: "logContains", value: "Hello" });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail when log does not contain text");
});

test("consoleAssertion logContains: passes when any log call contains text", () => {
  const engine = createJSEngine({ code: "console.log('first'); console.log('second'); console.log('third');", html: "" });
  const req = makeReq("con-003", { type: "console", assertion: "logContains", value: "second" });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when any log call contains text");
});

test("consoleAssertion logContains: fails when no console.log calls exist", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("con-004", { type: "console", assertion: "logContains", value: "anything" });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail when no console.log calls");
});

// logEquals
test("consoleAssertion logEquals: passes when output exactly matches", () => {
  const engine = createJSEngine({ code: "console.log('Hello, World!');", html: "" });
  const req = makeReq("con-005", { type: "console", assertion: "logEquals", value: "Hello, World!" });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when log exactly matches");
});

test("consoleAssertion logEquals: fails when output does not exactly match", () => {
  const engine = createJSEngine({ code: "console.log('Hello');", html: "" });
  const req = makeReq("con-006", { type: "console", assertion: "logEquals", value: "Hello, World!" });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail when log does not match");
});

test("consoleAssertion logEquals: matches against any log call", () => {
  const engine = createJSEngine({ code: "console.log('first'); console.log('target'); console.log('last');", html: "" });
  const req = makeReq("con-007", { type: "console", assertion: "logEquals", value: "target" });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when any log equals target");
});

// logCount
test("consoleAssertion logCount: passes when count matches", () => {
  const engine = createJSEngine({ code: "console.log('a'); console.log('b'); console.log('c');", html: "" });
  const req = makeReq("con-008", { type: "console", assertion: "logCount", value: 3 });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when count matches");
});

test("consoleAssertion logCount: fails when count mismatches", () => {
  const engine = createJSEngine({ code: "console.log('a'); console.log('b');", html: "" });
  const req = makeReq("con-009", { type: "console", assertion: "logCount", value: 5 });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail when count mismatches");
});

test("consoleAssertion logCount: passes with zero calls", () => {
  const engine = createJSEngine({ code: "const x = 1;", html: "" });
  const req = makeReq("con-010", { type: "console", assertion: "logCount", value: 0 });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when zero calls and count is 0");
});

// logOrder
test("consoleAssertion logOrder: passes when ordered output contains sequence", () => {
  const engine = createJSEngine({ code: "console.log('first'); console.log('second'); console.log('third');", html: "" });
  const req = makeReq("con-011", { type: "console", assertion: "logOrder", value: "first\nsecond" });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when ordered output contains sequence");
});

test("consoleAssertion logOrder: passes with single line match", () => {
  const engine = createJSEngine({ code: "console.log('Hello World');", html: "" });
  const req = makeReq("con-012", { type: "console", assertion: "logOrder", value: "Hello World" });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass when single line matches");
});

test("consoleAssertion logOrder: fails when sequence not in order", () => {
  const engine = createJSEngine({ code: "console.log('second'); console.log('first');", html: "" });
  const req = makeReq("con-013", { type: "console", assertion: "logOrder", value: "first\nsecond" });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail when sequence not in correct order");
});

// Points and earned tests
test("consoleAssertion: returns earned=points on pass", () => {
  const engine = createJSEngine({ code: "console.log('Hello');", html: "" });
  const req = makeReq("con-pts-001", { type: "console", assertion: "logContains", value: "Hello" });
  const result = consoleAssertion(engine, req);
  assert(result.passed, "should pass");
  assert(result.earned === 5, `earned should be 5, got ${result.earned}`);
});

test("consoleAssertion: returns earned=0 on fail", () => {
  const engine = createJSEngine({ code: "console.log('Bye');", html: "" });
  const req = makeReq("con-pts-002", { type: "console", assertion: "logContains", value: "Hello" });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail");
  assert(result.earned === 0, "earned should be 0");
});

test("consoleAssertion: execution error returns failure", () => {
  const engine = createJSEngine({ code: "throw new Error('bad');", html: "" });
  const req = makeReq("con-err-001", { type: "console", assertion: "logContains", value: "anything" });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail on execution error");
  assert(result.message.includes("JavaScript error"), "message should mention execution error");
});

test("consoleAssertion: unknown assertion returns failure", () => {
  const engine = createJSEngine({ code: "console.log('test');", html: "" });
  const req = makeReq("con-unk-001", { type: "console", assertion: "invalid", value: "test" });
  const result = consoleAssertion(engine, req);
  assert(!result.passed, "should fail for unknown assertion");
});

console.log("\n");
