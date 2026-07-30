import { validateRequirement } from "../src/core/validate-requirement.js";

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

function assertThrows(fn, expectedMsg) {
  try {
    fn();
    throw new Error("Expected an error but none was thrown");
  } catch (e) {
    if (expectedMsg && !e.message.includes(expectedMsg)) {
      throw new Error(
        `Expected error to contain "${expectedMsg}", but got "${e.message}"`
      );
    }
  }
}

console.log("\nJS Validation Tests\n");

test("validates variable assertion requires name", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "variable" } }),
    "must include \"name\""
  );
});

test("validates variable assertion with name passes", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "variable", name: "x" } });
});

test("validates function assertion requires name", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "function" } }),
    "must include \"name\""
  );
});

test("validates function assertion with name passes", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "function", name: "greet" } });
});

test("validates array assertion requires name", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "array" } }),
    "must include \"name\""
  );
});

test("validates array assertion with name passes", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "array", name: "arr" } });
});

test("validates object assertion requires name", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "object" } }),
    "must include \"name\""
  );
});

test("validates dom assertion requires assertion", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "dom", selector: "#x" } }),
    "must include \"assertion\""
  );
});

test("validates dom assertion requires selector", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "dom", assertion: "textUpdated" } }),
    "must include \"selector\""
  );
});

test("validates event assertion requires assertion", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "event", selector: "#btn" } }),
    "must include \"assertion\""
  );
});

test("validates event assertion requires selector", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "event", assertion: "click" } }),
    "must include \"selector\""
  );
});

test("validates json assertion requires assertion", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "json" } }),
    "must include \"assertion\""
  );
});

test("validates json assertion with valid values", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "json", assertion: "parse" } });
  validateRequirement({ name: "test", points: 1, check: { type: "json", assertion: "stringify" } });
});

test("validates json assertion rejects unknown assertion", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "json", assertion: "invalid" } }),
    "must be \"parse\" or \"stringify\""
  );
});

test("existing CSS validation still works", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "css", selector: "h1", property: "color", value: "red" } });
});

test("existing HTML validation still works", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "element", selector: "h1" } });
  validateRequirement({ name: "test", points: 1, check: { type: "text", selector: "h1", contains: "hello" } });
});

console.log("\n");
