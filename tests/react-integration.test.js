import { run } from "../src/core/runner.js";
import {
  createReactLab,
  removeReactLab,
  COUNTER_APP_JSX,
  USERS_APP_JSX,
  ROUTED_APP_JSX,
} from "./helpers/react-lab-fixtures.js";

const tests = [];

function test(description, fn) {
  tests.push({ description, fn });
}

async function runTests() {
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

function req(id, subtype, extra = {}) {
  return {
    id,
    name: `Requirement ${id}`,
    points: 5,
    check: { type: "react", subtype, component: "src/App.jsx", ...extra },
  };
}

console.log("\nReact Integration Tests (full runner)\n");

test("runs a full React lab and passes correct requirements", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": COUNTER_APP_JSX },
    requirements: [
      req("r1", "project", { tooling: "vite" }),
      req("r2", "dependency", { dependencies: ["react", "react-dom"] }),
      req("r3", "component", { exported: true, functionComponent: true }),
      req("r4", "jsx"),
      req("r5", "renders"),
      req("r6", "state", { value: "Count: 0" }),
      req("r7", "hasText", { text: "Hello, World!" }),
      req("r8", "hasButton", { name: "Add" }),
      req("r9", "hasHeading", { level: 1, text: "Hello, World!" }),
      req("r10", "click", {
        selector: "button",
        expect: { text: "Count: 1" },
      }),
      req("r11", "count", { selector: "button", equals: 1 }),
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 11, `expected 11 results, got ${summary.total}`);
    assert(summary.passed === 11, `expected 11 passed, got ${summary.passed}`);

    const failed = results.results.filter((result) => !result.passed);
    if (failed.length > 0) {
      throw new Error(
        `Unexpected failures: ${failed
          .map((result) => `${result.id}: ${result.message}`)
          .join(" | ")}`
      );
    }
  } finally {
    removeReactLab(lab);
  }
});

test("runs a full React lab and fails broken requirements", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": COUNTER_APP_JSX },
    requirements: [
      req("f1", "renders"),
      req("f2", "state", { value: "Count: 99" }),
      req("f3", "hasButton", { name: "Missing button" }),
      req("f4", "click", {
        selector: "button",
        expect: { text: "Count: 42" },
      }),
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 4, `expected 4 results, got ${summary.total}`);
    assert(summary.passed === 1, `expected 1 passed, got ${summary.passed}`);

    const failed = results.results.filter((result) => !result.passed);
    assert(failed.length === 3, `expected 3 failures, got ${failed.length}`);
    const failedMessages = failed.map((result) => result.message).join("|");
    assert(failedMessages.includes("Count: 99"), failedMessages);
    assert(failedMessages.includes("Missing button"), failedMessages);
    assert(failedMessages.includes("Count: 42"), failedMessages);
  } finally {
    removeReactLab(lab);
  }
});

test("mixed React lab with fetch, effects, and router requirements", async () => {
  const lab = createReactLab({
    entry: "src/Users.jsx",
    files: {
      "src/Users.jsx": USERS_APP_JSX,
      "src/RoutedApp.jsx": ROUTED_APP_JSX,
    },
    requirements: [
      {
        id: "m1",
        name: "Fetch data",
        points: 5,
        check: {
          type: "react",
          subtype: "fetch",
          component: "src/Users.jsx",
          fetch: { "/api/users": { body: [{ id: 1, name: "Alice" }] } },
          expect: { text: "Alice" },
        },
      },
      {
        id: "m2",
        name: "Empty state",
        points: 5,
        check: {
          type: "react",
          subtype: "loadsOnMount",
          component: "src/Users.jsx",
          fetch: { "/api/users": { scenario: "empty" } },
          expect: { empty: true },
        },
      },
      {
        id: "m3",
        name: "Router renders deep path",
        points: 5,
        check: {
          type: "react",
          subtype: "router",
          component: "src/RoutedApp.jsx",
          router: { path: "/users/7" },
          expect: { text: "User 7" },
        },
      },
      {
        id: "m4",
        name: "Router navigation",
        points: 5,
        check: {
          type: "react",
          subtype: "router",
          component: "src/RoutedApp.jsx",
          router: { path: "/" },
          navigateTo: "/about",
          expect: { text: "About" },
        },
      },
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 4, `expected 4 results, got ${summary.total}`);
    assert(summary.passed === 4, `expected 4 passed, got ${summary.passed}`);
    const failed = results.results.filter((result) => !result.passed);
    if (failed.length > 0) {
      throw new Error(
        failed.map((result) => `${result.id}: ${result.message}`).join(" | ")
      );
    }
  } finally {
    removeReactLab(lab);
  }
});

test("runner works when the lab entry is the component file itself", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": COUNTER_APP_JSX },
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.passed === summary.total, "all should pass");
  } finally {
    removeReactLab(lab);
  }
});

await runTests();
