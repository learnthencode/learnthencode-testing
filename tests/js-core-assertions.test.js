import { createJSEngine } from "../src/core/js-execution-engine.js";
import { variableAssertion } from "../src/assertions/javascript/variables.js";
import { functionAssertion } from "../src/assertions/javascript/functions.js";
import { arrayAssertion } from "../src/assertions/javascript/arrays.js";
import { objectAssertion } from "../src/assertions/javascript/objects.js";
import { domAssertion } from "../src/assertions/javascript/dom.js";
import { eventAssertion } from "../src/assertions/javascript/events.js";
import { fetchAssertion } from "../src/assertions/javascript/fetch.js";
import { jsonAssertion } from "../src/assertions/javascript/json.js";

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
    id: id || "js-test-001",
    name: "JS Test",
    points: 5,
    check: check || {},
  };
}

console.log("\nJS Core Assertions Tests\n");

// Variable Assertions
test("variableAssertion: passes when variable exists", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("var-001", { type: "variable", name: "x" });
  const result = variableAssertion(engine, req);
  assert(result.passed, "should pass when variable exists");
});

test("variableAssertion: fails when variable missing", () => {
  const engine = createJSEngine({ code: "", html: "" });
  const req = makeReq("var-002", { type: "variable", name: "missing" });
  const result = variableAssertion(engine, req);
  assert(!result.passed, "should fail when variable missing");
});

test("variableAssertion: passes with correct value", () => {
  const engine = createJSEngine({ code: "const name = 'John';", html: "" });
  const req = makeReq("var-003", { type: "variable", name: "name", value: "John" });
  const result = variableAssertion(engine, req);
  assert(result.passed, "should pass when value matches");
});

test("variableAssertion: fails with wrong value", () => {
  const engine = createJSEngine({ code: "const age = 25;", html: "" });
  const req = makeReq("var-004", { type: "variable", name: "age", value: 30 });
  const result = variableAssertion(engine, req);
  assert(!result.passed, "should fail when value mismatches");
});

test("variableAssertion: works with let declaration", () => {
  const engine = createJSEngine({ code: "let score = 100;", html: "" });
  const req = makeReq("var-005", { type: "variable", name: "score" });
  const result = variableAssertion(engine, req);
  assert(result.passed, "should work with let");
});

// Function Assertions
test("functionAssertion: passes when function exists", () => {
  const engine = createJSEngine({ code: "function greet() { return 'hello'; }", html: "" });
  const req = makeReq("fn-001", { type: "function", name: "greet" });
  const result = functionAssertion(engine, req);
  assert(result.passed, "should pass when function exists");
});

test("functionAssertion: passes for arrow function", () => {
  const engine = createJSEngine({ code: "const add = (a, b) => a + b;", html: "" });
  const req = makeReq("fn-002", { type: "function", name: "add" });
  const result = functionAssertion(engine, req);
  assert(result.passed, "should detect arrow function as function");
});

test("functionAssertion: fails when function missing", () => {
  const engine = createJSEngine({ code: "", html: "" });
  const req = makeReq("fn-003", { type: "function", name: "missing" });
  const result = functionAssertion(engine, req);
  assert(!result.passed, "should fail when function missing");
});

test("functionAssertion: passes with correct return value", () => {
  const engine = createJSEngine({
    code: "function double(n) { return n * 2; }",
    html: "",
  });
  const req = makeReq("fn-004", { type: "function", name: "double", args: [5], returns: 10 });
  const result = functionAssertion(engine, req);
  assert(result.passed, "should pass when return value matches");
});

test("functionAssertion: fails with wrong return value", () => {
  const engine = createJSEngine({
    code: "function double(n) { return n * 3; }",
    html: "",
  });
  const req = makeReq("fn-005", { type: "function", name: "double", args: [5], returns: 10 });
  const result = functionAssertion(engine, req);
  assert(!result.passed, "should fail when return value mismatches");
});

// Array Assertions
test("arrayAssertion: passes when array exists", () => {
  const engine = createJSEngine({ code: "const fruits = ['apple', 'banana'];", html: "" });
  const req = makeReq("arr-001", { type: "array", name: "fruits" });
  const result = arrayAssertion(engine, req);
  assert(result.passed, "should pass when array exists");
});

test("arrayAssertion: fails when variable is not array", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("arr-002", { type: "array", name: "x" });
  const result = arrayAssertion(engine, req);
  assert(!result.passed, "should fail when not array");
});

test("arrayAssertion: passes with correct length", () => {
  const engine = createJSEngine({ code: "const items = [1, 2, 3];", html: "" });
  const req = makeReq("arr-003", { type: "array", name: "items", length: 3 });
  const result = arrayAssertion(engine, req);
  assert(result.passed, "should pass when length matches");
});

test("arrayAssertion: fails with wrong length", () => {
  const engine = createJSEngine({ code: "const items = [1, 2];", html: "" });
  const req = makeReq("arr-004", { type: "array", name: "items", length: 3 });
  const result = arrayAssertion(engine, req);
  assert(!result.passed, "should fail when length mismatches");
});

test("arrayAssertion: passes when contains value", () => {
  const engine = createJSEngine({ code: "const colors = ['red', 'green', 'blue'];", html: "" });
  const req = makeReq("arr-005", { type: "array", name: "colors", contains: ["red", "blue"] });
  const result = arrayAssertion(engine, req);
  assert(result.passed, "should pass when contains expected items");
});

test("arrayAssertion: fails when missing value", () => {
  const engine = createJSEngine({ code: "const colors = ['red', 'green'];", html: "" });
  const req = makeReq("arr-006", { type: "array", name: "colors", contains: ["red", "yellow"] });
  const result = arrayAssertion(engine, req);
  assert(!result.passed, "should fail when missing expected item");
});

// Object Assertions
test("objectAssertion: passes when object exists", () => {
  const engine = createJSEngine({ code: "const person = { name: 'John' };", html: "" });
  const req = makeReq("obj-001", { type: "object", name: "person" });
  const result = objectAssertion(engine, req);
  assert(result.passed, "should pass when object exists");
});

test("objectAssertion: fails when variable not object", () => {
  const engine = createJSEngine({ code: "const x = 'hello';", html: "" });
  const req = makeReq("obj-002", { type: "object", name: "x" });
  const result = objectAssertion(engine, req);
  assert(!result.passed, "should fail when not object");
});

test("objectAssertion: passes with correct property", () => {
  const engine = createJSEngine({ code: "const car = { make: 'Toyota', year: 2020 };", html: "" });
  const req = makeReq("obj-003", { type: "object", name: "car", property: "make" });
  const result = objectAssertion(engine, req);
  assert(result.passed, "should pass when property exists");
});

test("objectAssertion: fails with missing property", () => {
  const engine = createJSEngine({ code: "const car = { make: 'Toyota' };", html: "" });
  const req = makeReq("obj-004", { type: "object", name: "car", property: "model" });
  const result = objectAssertion(engine, req);
  assert(!result.passed, "should fail when property missing");
});

test("objectAssertion: passes with correct property value", () => {
  const engine = createJSEngine({ code: "const user = { name: 'Alice', age: 30 };", html: "" });
  const req = makeReq("obj-005", { type: "object", name: "user", property: "age", value: 30 });
  const result = objectAssertion(engine, req);
  assert(result.passed, "should pass when property value matches");
});

// DOM Assertions
test("domAssertion: elementExists passes when found", () => {
  const engine = createJSEngine({
    code: "",
    html: '<!DOCTYPE html><html><body><div id="app"></div></body></html>',
  });
  const req = makeReq("dom-001", { type: "dom", assertion: "elementExists", selector: "#app" });
  const result = domAssertion(engine, req);
  assert(result.passed, "should pass when element exists");
});

test("domAssertion: elementExists fails when missing", () => {
  const engine = createJSEngine({
    code: "",
    html: "<!DOCTYPE html><html><body></body></html>",
  });
  const req = makeReq("dom-002", { type: "dom", assertion: "elementExists", selector: "#missing" });
  const result = domAssertion(engine, req);
  assert(!result.passed, "should fail when element missing");
});

test("domAssertion: textUpdated passes when text matches", () => {
  const engine = createJSEngine({
    code: "document.getElementById('output').textContent = 'Success';",
    html: '<!DOCTYPE html><html><body><div id="output">Original</div></body></html>',
  });
  const req = makeReq("dom-003", { type: "dom", assertion: "textUpdated", selector: "#output", value: "Success" });
  const result = domAssertion(engine, req);
  assert(result.passed, "should pass when text matches");
});

test("domAssertion: classAdded passes when class present", () => {
  const engine = createJSEngine({
    code: "document.getElementById('box').classList.add('active');",
    html: '<!DOCTYPE html><html><body><div id="box"></div></body></html>',
  });
  const req = makeReq("dom-004", { type: "dom", assertion: "classAdded", selector: "#box", className: "active" });
  const result = domAssertion(engine, req);
  assert(result.passed, "should pass when class added");
});

test("domAssertion: classRemoved passes when class removed", () => {
  const engine = createJSEngine({
    code: "document.getElementById('box').classList.remove('hidden');",
    html: '<!DOCTYPE html><html><body><div id="box" class="hidden"></div></body></html>',
  });
  const req = makeReq("dom-005", { type: "dom", assertion: "classRemoved", selector: "#box", className: "hidden" });
  const result = domAssertion(engine, req);
  assert(result.passed, "should pass when class removed");
});

// Event Assertions
test("eventAssertion: dispatches click event", () => {
  const engine = createJSEngine({
    code: `
      document.getElementById('btn').addEventListener('click', () => {
        document.getElementById('output').textContent = 'clicked';
      });
    `,
    html: '<!DOCTYPE html><html><body><button id="btn">Click</button><div id="output"></div></body></html>',
  });
  const req = makeReq("evt-001", {
    type: "event",
    assertion: "click",
    selector: "#btn",
    effect: { target: "#output", property: "textContent", equals: "clicked" },
  });
  const result = eventAssertion(engine, req);
  assert(result.passed, "should pass when click handler updates output");
});

test("eventAssertion: dispatches submit event", () => {
  const engine = createJSEngine({
    code: `
      document.getElementById('form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('status').textContent = 'submitted';
      });
    `,
    html: '<!DOCTYPE html><html><body><form id="form"></form><div id="status"></div></body></html>',
  });
  const req = makeReq("evt-002", {
    type: "event",
    assertion: "submit",
    selector: "#form",
    effect: { target: "#status", property: "textContent", equals: "submitted" },
  });
  const result = eventAssertion(engine, req);
  assert(result.passed, "should pass when submit handler updates status");
});

// Fetch Assertions
test("fetchAssertion: passes when fetch called", () => {
  const engine = createJSEngine({ code: "fetch('/api/data');", html: "" });
  const req = makeReq("fetch-001", { type: "fetch", assertion: "called" });
  const result = fetchAssertion(engine, req);
  assert(result.passed, "should pass when fetch was called");
});

test("fetchAssertion: fails when fetch not called", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("fetch-002", { type: "fetch", assertion: "called" });
  const result = fetchAssertion(engine, req);
  assert(!result.passed, "should fail when fetch not called");
});

test("fetchAssertion: passes with correct endpoint", () => {
  const engine = createJSEngine({ code: "fetch('/api/users');", html: "" });
  const req = makeReq("fetch-003", { type: "fetch", endpoint: "/api/users" });
  const result = fetchAssertion(engine, req);
  assert(result.passed, "should pass when endpoint matches");
});

test("fetchAssertion: passes with correct method", () => {
  const engine = createJSEngine({ code: "fetch('/api/data', { method: 'POST' });", html: "" });
  const req = makeReq("fetch-004", { type: "fetch", endpoint: "/api/data", method: "POST" });
  const result = fetchAssertion(engine, req);
  assert(result.passed, "should pass when method matches");
});

// JSON Assertions
test("jsonAssertion: passes when JSON.parse called", () => {
  const engine = createJSEngine({ code: "const data = JSON.parse('{}');", html: "" });
  const req = makeReq("json-001", { type: "json", assertion: "parse" });
  const result = jsonAssertion(engine, req);
  assert(result.passed, "should pass when JSON.parse called");
});

test("jsonAssertion: passes when JSON.stringify called", () => {
  const engine = createJSEngine({ code: "const str = JSON.stringify({a: 1});", html: "" });
  const req = makeReq("json-002", { type: "json", assertion: "stringify" });
  const result = jsonAssertion(engine, req);
  assert(result.passed, "should pass when JSON.stringify called");
});

test("jsonAssertion: fails when JSON methods not called", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("json-003", { type: "json", assertion: "parse" });
  const result = jsonAssertion(engine, req);
  assert(!result.passed, "should fail when JSON.parse not called");
});

// Points and earned tests
test("variableAssertion: returns earned=points on pass", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  const req = makeReq("pts-001", { type: "variable", name: "x" });
  const result = variableAssertion(engine, req);
  assert(result.passed, "should pass");
  assert(result.earned === 5, `earned should be 5, got ${result.earned}`);
});

test("variableAssertion: returns earned=0 on fail", () => {
  const engine = createJSEngine({ code: "", html: "" });
  const req = makeReq("pts-002", { type: "variable", name: "missing" });
  const result = variableAssertion(engine, req);
  assert(!result.passed, "should fail");
  assert(result.earned === 0, "earned should be 0");
});

console.log("\n");
