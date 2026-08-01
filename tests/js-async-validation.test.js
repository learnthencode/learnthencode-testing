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

function makeReq(check) {
  return {
    name: "test",
    points: 1,
    check,
  };
}

console.log("\nJS Async Validation Tests\n");

test("validates returnsPromise assertion", () => {
  validateRequirement(makeReq({ type: "function", assertion: "returnsPromise", name: "getData" }));
});

test("validates resolves assertion", () => {
  validateRequirement(makeReq({ type: "function", assertion: "resolves", name: "getData", value: "Hello" }));
});

test("validates rejects assertion", () => {
  validateRequirement(makeReq({ type: "function", assertion: "rejects", name: "getData" }));
});

test("validates rejectsWith assertion", () => {
  validateRequirement(makeReq({ type: "function", assertion: "rejectsWith", name: "getData", value: "Network Error" }));
});

test("validates resolves with object value", () => {
  validateRequirement(makeReq({ type: "function", assertion: "resolves", name: "getData", value: { id: 1, name: "John" } }));
});

test("validates resolves with array value", () => {
  validateRequirement(makeReq({ type: "function", assertion: "resolves", name: "getData", value: [1, 2, 3] }));
});

test("validates async assertions with args", () => {
  validateRequirement(makeReq({ type: "function", assertion: "resolves", name: "getData", args: [1], value: 2 }));
});

test("rejects unknown async assertions", () => {
  assertThrows(
    () => validateRequirement(makeReq({ type: "function", assertion: "notAsync", name: "getData" })),
    "must be one of \"returnsPromise\", \"resolves\", \"rejects\", or \"rejectsWith\""
  );
});

test("rejects empty-string assertion", () => {
  assertThrows(
    () => validateRequirement(makeReq({ type: "function", assertion: "", name: "getData" })),
    "must be one of"
  );
});

test("rejects resolves assertion without name", () => {
  assertThrows(
    () => validateRequirement(makeReq({ type: "function", assertion: "resolves", value: "Hello" })),
    "must include \"name\""
  );
});

test("rejects resolves assertion without value", () => {
  assertThrows(
    () => validateRequirement(makeReq({ type: "function", assertion: "resolves", name: "getData" })),
    "must include \"value\""
  );
});

test("rejects rejectsWith assertion without value", () => {
  assertThrows(
    () => validateRequirement(makeReq({ type: "function", assertion: "rejectsWith", name: "getData" })),
    "must include \"value\""
  );
});

test("allows returnsPromise and rejects without value", () => {
  validateRequirement(makeReq({ type: "function", assertion: "returnsPromise", name: "getData" }));
  validateRequirement(makeReq({ type: "function", assertion: "rejects", name: "getData" }));
});

test("plain function assertions remain valid without assertion field", () => {
  validateRequirement(makeReq({ type: "function", name: "greet" }));
  validateRequirement(makeReq({ type: "function", name: "add", args: [2, 3], returns: 5 }));
  validateRequirement(makeReq({ type: "function", name: "greet", hasParams: true }));
});

test("existing non-function assertions still validate", () => {
  validateRequirement(makeReq({ type: "variable", name: "x" }));
  validateRequirement(makeReq({ type: "array", name: "arr", length: 3 }));
  validateRequirement(makeReq({ type: "object", name: "obj", property: "p", value: 1 }));
  validateRequirement(makeReq({ type: "dom", assertion: "elementExists", selector: "#app" }));
  validateRequirement(makeReq({ type: "event", assertion: "click", selector: "#btn" }));
  validateRequirement(makeReq({ type: "fetch", assertion: "called" }));
  validateRequirement(makeReq({ type: "json", assertion: "parse" }));
  validateRequirement(makeReq({ type: "console", assertion: "logContains", value: "Hello" }));
  validateRequirement(makeReq({ type: "css", selector: "h1", property: "color", value: "red" }));
  validateRequirement(makeReq({ type: "element", selector: "h1" }));
  assert(true, "all existing assertion validations still pass");
});

console.log("\n");
