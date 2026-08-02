import { validateRequirement } from "../src/core/validate-requirement.js";
import { JS_ASSERTION_TYPES } from "../src/constants/assertion-types.js";

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

console.log("\nJS Events Validation Tests\n");

test("assertion-types registry includes events", () => {
  assert(JS_ASSERTION_TYPES.has("events"), "JS_ASSERTION_TYPES should include \"events\"");
});

test("validates events assertion requires assertion", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", selector: "#btn" } }),
    "must include \"assertion\""
  );
});

test("validates events assertion rejects unknown assertion", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "clicked", selector: "#btn" } }),
    "must be \"listenerExists\", \"dispatch\", or \"inputValueChanges\""
  );
});

test("validates events assertion requires selector", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "listenerExists", event: "click" } }),
    "must include \"selector\""
  );
});

test("validates listenerExists requires event", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "listenerExists", selector: "#btn" } }),
    "must include \"event\""
  );
});

test("validates listenerExists with selector and event passes", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "listenerExists", selector: "#btn", event: "click" } });
});

test("validates dispatch requires event", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "dispatch", selector: "#btn" } }),
    "must include \"event\""
  );
});

test("validates dispatch requires expect object", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "dispatch", selector: "#btn", event: "click" } }),
    "must include an \"expect\" object"
  );
});

test("validates dispatch expect requires selector", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { text: "Sent" } } }),
    "must include \"selector\""
  );
});

test("validates dispatch expect requires text", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { selector: "#message" } } }),
    "must include \"text\""
  );
});

test("validates dispatch with event and expect passes", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { selector: "#message", text: "Sent" } } });
});

test("validates dispatch supports keyboard event key", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "dispatch", selector: "#field", event: "keydown", key: "Enter", expect: { selector: "#message", text: "Hi" } } });
});

test("validates inputValueChanges requires value", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "inputValueChanges", selector: "#name-input" } }),
    "must include \"value\""
  );
});

test("validates inputValueChanges requires expect object", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Alice" } }),
    "must include an \"expect\" object"
  );
});

test("validates inputValueChanges expect requires selector", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Alice", expect: { text: "Hi Alice" } } }),
    "must include \"selector\""
  );
});

test("validates inputValueChanges expect requires text", () => {
  assertThrows(
    () => validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Alice", expect: { selector: "#message" } } }),
    "must include \"text\""
  );
});

test("validates inputValueChanges with value and expect passes", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Alice", expect: { selector: "#message", text: "Hi Alice" } } });
});

test("legacy event assertion validation still works", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "event", selector: "#btn", assertion: "click" } });
});

test("existing dom assertion validation still works", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "dom", assertion: "textUpdated", selector: "#message" } });
});

test("existing console assertion validation still works", () => {
  validateRequirement({ name: "test", points: 1, check: { type: "console", assertion: "logContains", value: "hello" } });
});

console.log("\n");
