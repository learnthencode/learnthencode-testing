import { run } from "../src/core/runner.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_LAB_DIR = path.resolve(__dirname, "..", "test-lab-css");
const HTML_LAB_DIR = path.resolve(__dirname, "..", "test-lab");

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

console.log("\nEnd-to-End Tests\n");

test("run() works with CSS lab", () => {
  const results = run(CSS_LAB_DIR);
  const summary = results.summary();
  assert(typeof summary.total === "number", "should have total");
  assert(typeof summary.passed === "number", "should have passed count");
  assert(typeof summary.failed === "number", "should have failed count");
  assert(typeof summary.earned === "number", "should have earned points");
  assert(typeof summary.percentage === "number", "should have percentage");
  assert(results.results.length > 0, "should have results");
});

test("run() returns result objects with correct shape for CSS lab", () => {
  const results = run(CSS_LAB_DIR);
  for (const r of results.results) {
    assert(typeof r.id === "string", `result ${r.id} should have id`);
    assert(typeof r.name === "string", `result ${r.id} should have name`);
    assert(typeof r.passed === "boolean", `result ${r.id} should have passed boolean`);
    assert(typeof r.points === "number", `result ${r.id} should have points number`);
    assert(typeof r.earned === "number", `result ${r.id} should have earned number`);
    assert(typeof r.message === "string", `result ${r.id} should have message string`);
  }
});

test("run() CSS lab passes all assertions", () => {
  const results = run(CSS_LAB_DIR);
  for (const r of results.results) {
    assert(r.passed, `Requirement "${r.name}" (${r.id}) should pass. Message: ${r.message}`);
  }
});

test("run() CSS lab earns full points when all pass", () => {
  const results = run(CSS_LAB_DIR);
  const summary = results.summary();
  assert(summary.passed === summary.total, "all should pass");
  assert(summary.earned === summary.points, "all points earned");
  assert(summary.percentage === 100, "100%");
});

// Backward compatibility tests
test("run() still works with existing HTML lab", () => {
  const results = run(HTML_LAB_DIR);
  const summary = results.summary();
  assert(typeof summary.total === "number", "should have total");
  assert(typeof summary.passed === "number", "should have passed count");
});

test("HTML lab results have correct result shape", () => {
  const results = run(HTML_LAB_DIR);
  for (const r of results.results) {
    assert(typeof r.id === "string", "result should have id");
    assert(typeof r.passed === "boolean", "result should have passed");
    assert(typeof r.earned === "number", "result should have earned");
  }
});

console.log("\n");
