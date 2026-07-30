import { executeRequirement } from "../src/core/execute-requirements.js";
import { createJSEngine } from "../src/core/js-execution-engine.js";

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
    id: id || "int-001",
    name: "Integration Test",
    points: 5,
    check: check || {},
  };
}

console.log("\nJS Integration Tests\n");

test("executeRequirement dispatches to variable assertion", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("int-var", { type: "variable", name: "x" });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for variable assertion via executeRequirement");
});

test("executeRequirement dispatches to function assertion", () => {
  const engine = createJSEngine({ code: "function greet() { return 'hello'; }", html: "" });
  const req = makeReq("int-fn", { type: "function", name: "greet" });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for function assertion via executeRequirement");
});

test("executeRequirement dispatches to array assertion", () => {
  const engine = createJSEngine({ code: "const arr = [1, 2, 3];", html: "" });
  const req = makeReq("int-arr", { type: "array", name: "arr", length: 3 });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for array assertion via executeRequirement");
});

test("executeRequirement dispatches to object assertion", () => {
  const engine = createJSEngine({ code: "const obj = { key: 'value' };", html: "" });
  const req = makeReq("int-obj", { type: "object", name: "obj", property: "key", value: "value" });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for object assertion via executeRequirement");
});

test("executeRequirement dispatches to dom assertion", () => {
  const engine = createJSEngine({
    code: "",
    html: '<!DOCTYPE html><html><body><main></main></body></html>',
  });
  const req = makeReq("int-dom", { type: "dom", assertion: "elementExists", selector: "main" });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for dom assertion via executeRequirement");
});

test("executeRequirement dispatches to event assertion", () => {
  const engine = createJSEngine({
    code: `
      document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('out').textContent = 'done';
      });
    `,
    html: '<!DOCTYPE html><html><body><button id="btn">Go</button><div id="out"></div></body></html>',
  });
  const req = makeReq("int-evt", {
    type: "event", assertion: "click", selector: "#btn",
    effect: { target: "#out", property: "textContent", equals: "done" },
  });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for event assertion via executeRequirement");
});

test("executeRequirement dispatches to fetch assertion", () => {
  const engine = createJSEngine({ code: "fetch('/api');", html: "" });
  const req = makeReq("int-fetch", { type: "fetch", assertion: "called" });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for fetch assertion via executeRequirement");
});

test("executeRequirement dispatches to json assertion", () => {
  const engine = createJSEngine({ code: "JSON.parse('{}');", html: "" });
  const req = makeReq("int-json", { type: "json", assertion: "parse" });
  const result = executeRequirement(req, "", "", engine);
  assert(result.passed, "should pass for json assertion via executeRequirement");
});

test("throws error for JS assertion without engine", () => {
  let threw = false;
  try {
    const req = makeReq("int-noeng", { type: "variable", name: "x" });
    executeRequirement(req, "", "", null);
  } catch (e) {
    threw = true;
    assert(e.message.includes("JavaScript execution environment"), "should mention execution environment");
  }
  assert(threw, "should throw error when JS engine is null");
});

test("existing HTML assertions work alongside JS engine", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const htmlReq = makeReq("int-html", { type: "element", selector: "h1" });
  const html = "<!DOCTYPE html><html><body><h1>Hello</h1></body></html>";
  const result = executeRequirement(htmlReq, html, "", engine);
  assert(result.passed, "HTML assertion should still pass with JS engine present");
});

console.log("\n");
