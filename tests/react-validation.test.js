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
  return { name: "React validation test", points: 5, check };
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

console.log("\nReact Validation Tests\n");

test("accepts a valid renders requirement", () => {
  validateRequirement(
    req({ type: "react", subtype: "renders", component: "src/App.jsx" })
  );
});

test("accepts a valid click requirement", () => {
  validateRequirement(
    req({
      type: "react",
      subtype: "click",
      component: "src/App.jsx",
      selector: "button",
      expect: { text: "Count: 1" },
    })
  );
});

test("requires subtype", () => {
  expectThrows(
    { type: "react" },
    "subtype",
    "react assertion without subtype should throw"
  );
});

test("rejects unknown subtype", () => {
  expectThrows(
    { type: "react", subtype: "nope", component: "src/App.jsx" },
    "one of",
    "unknown subtype should throw"
  );
});

test("requires component for render subtypes", () => {
  expectThrows(
    { type: "react", subtype: "renders" },
    "component",
    "renders without component should throw"
  );
  expectThrows(
    { type: "react", subtype: "click" },
    "component",
    "click without component should throw"
  );
});

test("requires dependencies array for dependency subtype", () => {
  expectThrows(
    { type: "react", subtype: "dependency" },
    "dependencies",
    "dependency without dependencies should throw"
  );
  expectThrows(
    { type: "react", subtype: "dependency", dependencies: [] },
    "dependencies",
    "dependency with empty array should throw"
  );
});

test("requires selector and expect for interactions", () => {
  expectThrows(
    { type: "react", subtype: "click", component: "src/App.jsx" },
    "selector",
    "click without selector should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "type",
      component: "src/App.jsx",
      selector: "input",
    },
    "expect",
    "type without expect should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "submit",
      component: "src/App.jsx",
      expect: { value: 1 },
    },
    "text",
    "submit with invalid expect should throw"
  );
});

test("requires count to include equals/minimum/maximum", () => {
  expectThrows(
    { type: "react", subtype: "count", component: "src/App.jsx", selector: "li" },
    "equals",
    "count without bound should throw"
  );
});

test("requires fetch routes for fetch subtype", () => {
  expectThrows(
    { type: "react", subtype: "fetch", component: "src/App.jsx" },
    "fetch",
    "fetch without routes should throw"
  );
  expectThrows(
    { type: "react", subtype: "fetch", component: "src/App.jsx", fetch: {} },
    "fetch",
    "fetch with empty routes should throw"
  );
});

test("accepts a valid fetch requirement", () => {
  validateRequirement(
    req({
      type: "react",
      subtype: "fetch",
      component: "src/Users.jsx",
      fetch: { "/api/users": { body: [] } },
      expect: { text: "No users found." },
    })
  );
});

test("accepts a valid router requirement", () => {
  validateRequirement(
    req({
      type: "react",
      subtype: "router",
      component: "src/App.jsx",
      router: { path: "/" },
      expect: { text: "Home" },
    })
  );
});

test("rejects non-object router option", () => {
  expectThrows(
    {
      type: "react",
      subtype: "router",
      component: "src/App.jsx",
      router: "/",
    },
    "object",
    "router string should throw"
  );
});

await run();
