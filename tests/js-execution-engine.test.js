import { createJSEngine, extractScriptCode } from "../src/core/js-execution-engine.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB_DIR = path.resolve(__dirname, "..", "test-lab-js");
const HTML_PATH = path.join(LAB_DIR, "starter", "index.html");

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

console.log("\nJS Execution Engine Tests\n");

test("creates engine with minimal HTML", () => {
  const engine = createJSEngine({ code: "const x = 42;", html: "" });
  assert(engine.window, "should have window");
  assert(engine.document, "should have document");
  assert(engine.sandbox, "should have sandbox");
  assert(!engine.executionError, "should have no execution error");
});

test("executes code and captures variables", () => {
  const engine = createJSEngine({ code: "const x = 42; let y = 'hello'; var z = true;", html: "" });
  const x = engine.getValue("x");
  assert(x.exists, "x should exist");
  assert(x.value === 42, "x should be 42");

  const y = engine.getValue("y");
  assert(y.exists, "y should exist");
  assert(y.value === "hello", 'y should be "hello"');

  const z = engine.getValue("z");
  assert(z.exists, "z should exist");
  assert(z.value === true, "z should be true");
});

test("returns execution error for invalid code", () => {
  const engine = createJSEngine({ code: "const x = ", html: "" });
  assert(engine.executionError, "should have execution error");
});

test("captures console output", () => {
  const engine = createJSEngine({ code: "console.log('hello'); console.log(42);", html: "" });
  assert(engine.consoleOutput.length === 2, "should capture 2 console outputs");
  assert(engine.consoleOutput[0] === "hello", 'first output should be "hello"');
  assert(engine.consoleOutput[1] === "42", 'second output should be "42"');
});

test("mocks fetch and records calls", async () => {
  const engine = createJSEngine({
    code: `
      const p1 = fetch('/api/data');
      const p2 = fetch('/api/users', { method: 'POST', body: '{}' });
    `,
    html: "",
  });
  assert(engine.fetchCalls.length === 2, "should record 2 fetch calls");
  assert(engine.fetchCalls[0].url === "/api/data", "first call should be to /api/data");
  assert(engine.fetchCalls[0].method === "GET", "first call should be GET");
  assert(engine.fetchCalls[1].url === "/api/users", "second call should be to /api/users");
  assert(engine.fetchCalls[1].method === "POST", "second call should be POST");
});

test("evaluate runs expression in sandbox context", () => {
  const engine = createJSEngine({ code: "const arr = [1, 2, 3];", html: "" });
  const result = engine.evaluate("arr.length");
  assert(result === 3, "should evaluate array length");
});

test("getValue returns exists=false for undefined variable", () => {
  const engine = createJSEngine({ code: "", html: "" });
  const result = engine.getValue("nonexistent");
  assert(!result.exists, "should not exist");
});

test("extractScriptCode extracts inline and external scripts", () => {
  const html = `<!DOCTYPE html><html><head></head><body>
    <script>const a = 1;</script>
    <script>const b = 2;</script>
  </body></html>`;
  const code = extractScriptCode(html, HTML_PATH);
  assert(code.includes("const a = 1;"), "should include first script");
  assert(code.includes("const b = 2;"), "should include second script");
});

console.log("\n");
