import { run } from "../src/core/runner.js";
import {
  createReactLab,
  removeReactLab,
  CRUD_USERS_APP_JSX,
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

console.log("\nReact CRUD Integration Tests (full runner, v1.3.2)\n");

const TWO_USERS_FETCH = {
  "/api/users": {
    body: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  },
};

test("runs a full CRUD lab with all requirements passing", async () => {
  const lab = createReactLab({
    entry: "src/Users.jsx",
    files: { "src/Users.jsx": CRUD_USERS_APP_JSX },
    requirements: [
      {
        id: "crud-01",
        name: "Users load on mount",
        points: 5,
        check: {
          type: "react",
          subtype: "loadsOnMount",
          component: "src/Users.jsx",
          fetch: { "/api/users": { body: [{ id: 1, name: "Alice" }] } },
          expect: { text: "Alice" },
        },
      },
      {
        id: "crud-02",
        name: "List contains Bob",
        points: 5,
        check: {
          type: "react",
          subtype: "hasItem",
          component: "src/Users.jsx",
          fetch: TWO_USERS_FETCH,
          text: "Bob",
        },
      },
      {
        id: "crud-03",
        name: "Creating a user sends a POST with the right body",
        points: 10,
        check: {
          type: "react",
          subtype: "requestBody",
          component: "src/Users.jsx",
          fetch: {
            "/api/users": { body: [{ id: 1, name: "Alice" }] },
            "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
          },
          values: { "#name": "Bob" },
          expect: { name: "Bob" },
        },
      },
      {
        id: "crud-04",
        name: "Creating a user uses the POST method",
        points: 10,
        check: {
          type: "react",
          subtype: "method",
          component: "src/Users.jsx",
          fetch: {
            "/api/users": { body: [{ id: 1, name: "Alice" }] },
            "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
          },
          values: { "#name": "Bob" },
          expect: { method: "POST", url: "/api/users" },
        },
      },
      {
        id: "crud-05",
        name: "Creating a user updates the UI",
        points: 10,
        check: {
          type: "react",
          subtype: "submit",
          component: "src/Users.jsx",
          fetch: {
            "/api/users": { body: [{ id: 1, name: "Alice" }] },
            "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
          },
          values: { "#name": "Bob" },
          expect: { text: "Bob", selector: "#name", value: "" },
        },
      },
      {
        id: "crud-06",
        name: "Updating a user sends a PUT request",
        points: 10,
        check: {
          type: "react",
          subtype: "method",
          component: "src/Users.jsx",
          fetch: {
            "/api/users": { body: [{ id: 1, name: "Alice" }] },
            "PUT /api/users/1": {
              status: 200,
              body: { id: 1, name: "Alicia" },
            },
          },
          selector: "[data-action='edit']",
          values: { "#edit-name": "Alicia" },
          expect: { method: "PUT", url: "/api/users/1" },
        },
      },
      {
        id: "crud-07",
        name: "Updating a user replaces the name in the UI",
        points: 10,
        check: {
          type: "react",
          subtype: "click",
          component: "src/Users.jsx",
          fetch: {
            "/api/users": { body: [{ id: 1, name: "Alice" }] },
            "PUT /api/users/1": {
              status: 200,
              body: { id: 1, name: "Alicia" },
            },
          },
          selector: "[data-action='edit']",
          values: { "#edit-name": "Alicia" },
          expect: { hasNoText: "Alice", hasItem: "Alicia" },
        },
      },
      {
        id: "crud-08",
        name: "Deleting a user sends a DELETE request",
        points: 10,
        check: {
          type: "react",
          subtype: "method",
          component: "src/Users.jsx",
          fetch: {
            "/api/users": { body: [{ id: 1, name: "Alice" }] },
            "DELETE /api/users/1": { status: 200, body: {} },
          },
          selector: "[data-action='delete']",
          expect: { method: "DELETE", url: "/api/users/1" },
        },
      },
      {
        id: "crud-09",
        name: "Deleting a user removes the item",
        points: 10,
        check: {
          type: "react",
          subtype: "missingItem",
          component: "src/Users.jsx",
          fetch: { "/api/users": { body: [{ id: 2, name: "Bob" }] } },
          text: "Alice",
        },
      },
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 9, `expected 9 results, got ${summary.total}`);
    assert(summary.passed === 9, `expected 9 passed, got ${summary.passed}`);

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

test("runs a broken CRUD lab and reports failures", async () => {
  const lab = createReactLab({
    entry: "src/Users.jsx",
    files: { "src/Users.jsx": CRUD_USERS_APP_JSX },
    requirements: [
      {
        id: "crud-f1",
        name: "POST method is required",
        points: 5,
        check: {
          type: "react",
          subtype: "method",
          component: "src/Users.jsx",
          fetch: { "/api/users": { body: [{ id: 1, name: "Alice" }] } },
          expect: { method: "PATCH", url: "/api/users" },
        },
      },
      {
        id: "crud-f2",
        name: "Request body must match",
        points: 5,
        check: {
          type: "react",
          subtype: "requestBody",
          component: "src/Users.jsx",
          fetch: {
            "/api/users": { body: [{ id: 1, name: "Alice" }] },
            "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
          },
          values: { "#name": "Bob" },
          expect: { name: "Carol" },
        },
      },
      {
        id: "crud-f3",
        name: "Removed item is absent",
        points: 5,
        check: {
          type: "react",
          subtype: "missingItem",
          component: "src/Users.jsx",
          fetch: TWO_USERS_FETCH,
          text: "Alice",
        },
      },
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 3, `expected 3 results, got ${summary.total}`);
    assert(summary.passed === 0, `expected 0 passed, got ${summary.passed}`);

    const failedMessages = results.results
      .map((result) => result.message)
      .join("|");
    assert(failedMessages.includes("PATCH"), failedMessages);
    assert(failedMessages.includes("/api/users"), failedMessages);
    assert(failedMessages.includes('"name":"Carol"'), failedMessages);
    assert(failedMessages.includes("still rendered"), failedMessages);
  } finally {
    removeReactLab(lab);
  }
});

await runTests();
