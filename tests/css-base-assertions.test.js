import { renderCSS } from "../src/providers/css-renderer.js";
import { toHaveCSS, toHaveStyles } from "../src/assertions/css/base.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB_DIR = path.resolve(__dirname, "..", "test-lab-css");
const HTML_PATH = path.join(LAB_DIR, "starter", "index.html");

const BASE_HTML = `<!DOCTYPE html>
<html><head>
  <style>
    h1 { color: red; font-size: 32px; text-align: center; }
    .container { display: flex; justify-content: center; align-items: center; }
  </style>
</head><body>
  <h1>Hello</h1>
  <div class="container">Content</div>
</body></html>`;

function makeReq(id, check) {
  return {
    id: id || "test-001",
    name: "Test requirement",
    points: 5,
    check: check || {},
  };
}

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

console.log("\nCSS Base Assertions Tests\n");

let window;

// toHaveCSS tests
window = renderCSS(BASE_HTML, HTML_PATH);

test("toHaveCSS: passes when property matches", () => {
  const req = makeReq("css-001", { selector: "h1", property: "color", value: "red" });
  const result = toHaveCSS(window, req);
  assert(result.passed, `should pass, got: ${result.message}`);
});

test("toHaveCSS: passes with hex value", () => {
  const req = makeReq("css-002", { selector: "h1", property: "color", value: "#ff0000" });
  const result = toHaveCSS(window, req);
  assert(result.passed, `should pass, got: ${result.message}`);
});

test("toHaveCSS: passes with rgb value", () => {
  const req = makeReq("css-003", { selector: "h1", property: "color", value: "rgb(255, 0, 0)" });
  const result = toHaveCSS(window, req);
  assert(result.passed, `should pass, got: ${result.message}`);
});

test("toHaveCSS: fails when property does not match", () => {
  const req = makeReq("css-004", { selector: "h1", property: "color", value: "blue" });
  const result = toHaveCSS(window, req);
  assert(!result.passed, "should fail");
});

test("toHaveCSS: passes for font-size", () => {
  const req = makeReq("css-005", { selector: "h1", property: "font-size", value: "32px" });
  const result = toHaveCSS(window, req);
  assert(result.passed, `should pass, got: ${result.message}`);
});

test("toHaveCSS: handles camelCase property names", () => {
  const req = makeReq("css-006", { selector: "h1", property: "textAlign", value: "center" });
  const result = toHaveCSS(window, req);
  assert(result.passed, `should pass camelCase, got: ${result.message}`);
});

test("toHaveCSS: fails for missing element", () => {
  const req = makeReq("css-007", { selector: ".nonexistent", property: "display", value: "block" });
  const result = toHaveCSS(window, req);
  assert(!result.passed, "should fail");
  assert(result.message.includes("Could not find"), "error message should mention missing element");
});

test("toHaveCSS: returns earned=points on pass", () => {
  const req = makeReq("css-008", { selector: "h1", property: "color", value: "red" });
  const result = toHaveCSS(window, req);
  assert(result.passed, "should pass");
  assert(result.earned === 5, `earned should be 5, got ${result.earned}`);
});

test("toHaveCSS: returns earned=0 on fail", () => {
  const req = makeReq("css-009", { selector: "h1", property: "color", value: "blue" });
  const result = toHaveCSS(window, req);
  assert(!result.passed, "should fail");
  assert(result.earned === 0, "earned should be 0");
});

// toHaveStyles tests
test("toHaveStyles: passes when all styles match", () => {
  const req = makeReq("css-010", {
    selector: ".container",
    styles: { display: "flex", justifyContent: "center", alignItems: "center" }
  });
  const result = toHaveStyles(window, req);
  assert(result.passed, `should pass, got: ${result.message}`);
});

test("toHaveStyles: fails when one style mismatches", () => {
  const req = makeReq("css-011", {
    selector: ".container",
    styles: { display: "flex", justifyContent: "left" }
  });
  const result = toHaveStyles(window, req);
  assert(!result.passed, "should fail");
  assert(result.message.includes("justify-content"), "message should mention the failing property");
});

test("toHaveStyles: fails for missing element", () => {
  const req = makeReq("css-012", {
    selector: ".missing",
    styles: { display: "flex" }
  });
  const result = toHaveStyles(window, req);
  assert(!result.passed, "should fail");
  assert(result.message.includes("Could not find"), "should mention missing element");
});

console.log("\n");
