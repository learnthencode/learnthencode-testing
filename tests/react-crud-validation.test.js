import { validateRequirement } from "../src/core/validate-requirement.js";

const tests = [];

function test(description, fn) {
  tests.push({ description, fn });
}

async function run() {
  let failed = 0;
  for (const { description, fn } of tests) {
    try {
      await fn();
      console.log(`  ✔ ${description}`);
    } catch (e) {
      failed++;
      console.log(`  ✘ ${description}: ${e.message}`);
    }
  }
  if (failed > 0) {
    process.exitCode = 1;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function req(check) {
  return { name: "React CRUD validation test", points: 5, check };
}

function expectThrows(check, pattern, label) {
  let threw = false;
  try {
    validateRequirement(req(check));
  } catch (e) {
    threw = true;
    if (pattern && !e.message.includes(pattern)) {
      throw new Error(
        `Expected message containing "${pattern}", got: ${e.message}`
      );
    }
  }
  if (!threw) throw new Error(label);
}

console.log("\nReact CRUD Validation Tests (v1.3.2)\n");

test("accepts hasNoText, hasItem, and missingItem with text", () => {
  validateRequirement(
    req({ type: "react", subtype: "hasNoText", component: "src/App.jsx", text: "Alice" })
  );
  validateRequirement(
    req({ type: "react", subtype: "hasItem", component: "src/App.jsx", text: "Bob" })
  );
  validateRequirement(
    req({ type: "react", subtype: "missingItem", component: "src/App.jsx", text: "Alice" })
  );
});

test("rejects list content checks without text", () => {
  expectThrows(
    { type: "react", subtype: "hasItem", component: "src/App.jsx" },
    "text",
    "hasItem without text should throw"
  );
  expectThrows(
    { type: "react", subtype: "hasNoText", component: "src/App.jsx" },
    "text",
    "hasNoText without text should throw"
  );
  expectThrows(
    { type: "react", subtype: "missingItem", component: "src/App.jsx" },
    "text",
    "missingItem without text should throw"
  );
});

test("rejects list content checks without component", () => {
  expectThrows(
    { type: "react", subtype: "hasItem", text: "Bob" },
    "component",
    "hasItem without component should throw"
  );
});

test("accepts method assertions for all supported methods", () => {
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    validateRequirement(
      req({
        type: "react",
        subtype: "method",
        component: "src/App.jsx",
        expect: { method, url: "/users" },
      })
    );
  }
});

test("accepts lowercase method values", () => {
  validateRequirement(
    req({
      type: "react",
      subtype: "method",
      component: "src/App.jsx",
      expect: { method: "post", url: "/users" },
    })
  );
});

test("rejects unsupported methods", () => {
  expectThrows(
    {
      type: "react",
      subtype: "method",
      component: "src/App.jsx",
      expect: { method: "HEAD", url: "/users" },
    },
    "GET, POST, PUT, PATCH, DELETE",
    "HEAD should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "method",
      component: "src/App.jsx",
      expect: { method: "head", url: "/users" },
    },
    "GET, POST, PUT, PATCH, DELETE",
    "lowercase HEAD should throw"
  );
});

test("rejects method assertions without method or url", () => {
  expectThrows(
    { type: "react", subtype: "method", component: "src/App.jsx", expect: {} },
    "method",
    "method expect without method should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "method",
      component: "src/App.jsx",
      expect: { method: "POST" },
    },
    "url",
    "method expect without url should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "method",
      component: "src/App.jsx",
      expect: { method: "POST", url: "" },
    },
    "url",
    "empty url should throw"
  );
});

test("rejects method assertions without an expect object", () => {
  expectThrows(
    { type: "react", subtype: "method", component: "src/App.jsx" },
    "expect",
    "method without expect should throw"
  );
});

test("accepts requestBody with a JSON body expectation", () => {
  validateRequirement(
    req({
      type: "react",
      subtype: "requestBody",
      component: "src/App.jsx",
      expect: { name: "Bob" },
    })
  );
});

test("rejects requestBody without or with an empty expect", () => {
  expectThrows(
    { type: "react", subtype: "requestBody", component: "src/App.jsx" },
    "expect",
    "requestBody without expect should throw"
  );
  expectThrows(
    { type: "react", subtype: "requestBody", component: "src/App.jsx", expect: {} },
    "expect",
    "requestBody with empty expect should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "requestBody",
      component: "src/App.jsx",
      expect: ["name"],
    },
    "expect",
    "requestBody with array expect should throw"
  );
});

test("accepts multiple expectations in one interaction", () => {
  validateRequirement(
    req({
      type: "react",
      subtype: "submit",
      component: "src/App.jsx",
      expect: { text: "Bob", selector: "#name", value: "", hasNoText: "Alice" },
    })
  );
  validateRequirement(
    req({
      type: "react",
      subtype: "click",
      component: "src/App.jsx",
      selector: "[data-action='delete']",
      expect: { hasItem: "Bob", missingItem: "Alice" },
    })
  );
  validateRequirement(
    req({
      type: "react",
      subtype: "click",
      component: "src/App.jsx",
      selector: "button",
      expect: { hasNoText: "Alice", text: "Bob" },
    })
  );
});

test("rejects interaction expects with no usable rules", () => {
  expectThrows(
    {
      type: "react",
      subtype: "click",
      component: "src/App.jsx",
      selector: "button",
      expect: { other: true },
    },
    "expect",
    "expect with no rules should throw"
  );
});

test("accepts method-prefixed fetch mock routes", () => {
  validateRequirement(
    req({
      type: "react",
      subtype: "fetch",
      component: "src/App.jsx",
      fetch: {
        "/api/users": { body: [] },
        "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
        "PUT /api/users/1": { status: 200 },
        "PATCH /api/users/1": { status: 200 },
        "DELETE /api/users/1": { status: 204 },
      },
      expect: { text: "Bob" },
    })
  );
});

test("rejects fetch routes with unsupported methods", () => {
  expectThrows(
    {
      type: "react",
      subtype: "fetch",
      component: "src/App.jsx",
      fetch: { "HEAD /api/users": { body: [] } },
      expect: { text: "x" },
    },
    "unsupported HTTP method",
    "HEAD route should throw"
  );
});

test("rejects fetch mocks with invalid status and scenario", () => {
  expectThrows(
    {
      type: "react",
      subtype: "fetch",
      component: "src/App.jsx",
      fetch: { "/api/users": { status: "200" } },
      expect: { text: "x" },
    },
    "status",
    "string status should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "fetch",
      component: "src/App.jsx",
      fetch: { "/api/users": { scenario: "nope" } },
      expect: { text: "x" },
    },
    "scenario",
    "unknown scenario should throw"
  );
});

test("rejects fetch mocks that are not objects", () => {
  expectThrows(
    {
      type: "react",
      subtype: "fetch",
      component: "src/App.jsx",
      fetch: { "/api/users": 42 },
      expect: { text: "x" },
    },
    "object",
    "non-object mock should throw"
  );
});

test("validates fetch routes on interaction subtypes", () => {
  expectThrows(
    {
      type: "react",
      subtype: "submit",
      component: "src/App.jsx",
      expect: { text: "Bob" },
      fetch: { "HEAD /api/users": { body: [] } },
    },
    "unsupported HTTP method",
    "submit with bad fetch route should throw"
  );
  validateRequirement(
    req({
      type: "react",
      subtype: "submit",
      component: "src/App.jsx",
      expect: { text: "Bob" },
      fetch: {
        "/api/users": { body: [] },
        "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
      },
    })
  );
});

await run();
