import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import {
  createReactLab,
  removeReactLab,
  CRUD_USERS_APP_JSX,
  USERS_APP_JSX,
} from "./helpers/react-lab-fixtures.js";

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

function makeReq(subtype, extra = {}) {
  return {
    id: "react-crud-" + subtype,
    name: "React CRUD test",
    points: 5,
    check: { type: "react", subtype, component: "src/App.jsx", ...extra },
  };
}

async function makeEngine(files) {
  const lab = createReactLab({ files });
  const engine = createReactEngine({ labDirectory: lab });
  return { lab, engine };
}

const TWO_USERS_FETCH = {
  "/api/users": {
    body: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  },
};

console.log("\nReact CRUD Assertion Tests (v1.3.2)\n");

test("hasItem passes when the item is rendered", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.hasItem(
      engine,
      makeReq("hasItem", { text: "Bob", fetch: TWO_USERS_FETCH })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasItem fails with a learner-friendly message", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.hasItem(
      engine,
      makeReq("hasItem", {
        text: "Carol",
        fetch: TWO_USERS_FETCH,
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Carol"), res.message);
    assert(res.message.includes("item"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("missingItem passes when the item is gone", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.missingItem(
      engine,
      makeReq("missingItem", {
        text: "Alice",
        fetch: {
          "/api/users": { body: [{ id: 2, name: "Bob" }] },
        },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("missingItem fails when the item is still rendered", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.missingItem(
      engine,
      makeReq("missingItem", { text: "Alice", fetch: TWO_USERS_FETCH })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Alice"), res.message);
    assert(res.message.includes("still rendered"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasNoText passes when the text is absent", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.hasNoText(
      engine,
      makeReq("hasNoText", {
        text: "Alice",
        fetch: { "/api/users": { body: [{ id: 2, name: "Bob" }] } },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasNoText fails when the text is still rendered", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.hasNoText(
      engine,
      makeReq("hasNoText", { text: "Alice", fetch: TWO_USERS_FETCH })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Alice"), res.message);
    assert(res.message.includes("no longer be rendered"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("method passes for a POST created through the form", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.method(
      engine,
      makeReq("method", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
        },
        values: { "#name": "Bob" },
        expect: { method: "POST", url: "/api/users" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("method passes for a PUT sent through the edit flow", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.method(
      engine,
      makeReq("method", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "PUT /api/users/1": { status: 200, body: { id: 1, name: "Alicia" } },
        },
        selector: "[data-action='edit']",
        values: { "#edit-name": "Alicia" },
        expect: { method: "PUT", url: "/api/users/1" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("method passes for a DELETE sent through the delete button", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.method(
      engine,
      makeReq("method", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "DELETE /api/users/1": { status: 200, body: {} },
        },
        selector: "[data-action='delete']",
        expect: { method: "DELETE", url: "/api/users/1" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("method fails with expected/actual details", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.method(
      engine,
      makeReq("method", {
        fetch: { "/api/users": { body: [{ id: 1, name: "Alice" }] } },
        expect: { method: "POST", url: "/api/users" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("POST"), res.message);
    assert(res.message.includes("/api/users"), res.message);
    assert(res.message.includes("GET"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("method fails when the URL does not match", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.method(
      engine,
      makeReq("method", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
        },
        values: { "#name": "Bob" },
        expect: { method: "POST", url: "/api/other" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("/api/other"), res.message);
    assert(res.message.includes("POST"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("method passes with no interaction when the component sends the request", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.method(
      engine,
      makeReq("method", {
        fetch: { "/api/users": { body: [{ id: 1, name: "Alice" }] } },
        expect: { method: "GET", url: "/api/users" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("requestBody passes for a POST payload", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.requestBody(
      engine,
      makeReq("requestBody", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
        },
        values: { "#name": "Bob" },
        expect: { name: "Bob" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("requestBody passes for a PUT payload", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.requestBody(
      engine,
      makeReq("requestBody", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "PUT /api/users/1": { status: 200, body: { id: 1, name: "Alicia" } },
        },
        selector: "[data-action='edit']",
        values: { "#edit-name": "Alicia" },
        expect: { name: "Alicia" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("requestBody fails with a diff message", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.requestBody(
      engine,
      makeReq("requestBody", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
        },
        values: { "#name": "Bob" },
        expect: { name: "Carol" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes('"name":"Carol"'), res.message);
    assert(res.message.includes('"name":"Bob"'), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("click passes with multiple expectations (item removed)", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        fetch: {
          "/api/users": {
            body: [
              { id: 1, name: "Alice" },
              { id: 2, name: "Bob" },
            ],
          },
          "DELETE /api/users/1": { status: 200, body: {} },
        },
        selector: "[data-action='delete']",
        expect: { hasItem: "Bob", missingItem: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("submit passes with multiple expectations", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.submit(
      engine,
      makeReq("submit", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
        },
        values: { "#name": "Bob" },
        expect: {
          text: "Bob",
          selector: "#name",
          value: "",
          hasNoText: "Carol",
        },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("submit fails when any expectation is unmet", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.submit(
      engine,
      makeReq("submit", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
        },
        values: { "#name": "Bob" },
        expect: {
          text: "Bob",
          selector: "#name",
          value: "still-filled",
        },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("still-filled"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("click with hasNoText verifies a removed item", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        fetch: {
          "/api/users": { body: [{ id: 1, name: "Alice" }] },
          "DELETE /api/users/1": { status: 200, body: {} },
        },
        selector: "[data-action='delete']",
        expect: { hasNoText: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("click fails when a removed item is still present", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        fetch: {
          "/api/users": {
            body: [
              { id: 1, name: "Alice" },
              { id: 2, name: "Bob" },
            ],
          },
        },
        selector: "[data-action='edit']",
        expect: { missingItem: "Bob" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("still rendered"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("click into edit mode verifies the prefilled value", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CRUD_USERS_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        fetch: { "/api/users": { body: [{ id: 1, name: "Alice" }] } },
        selector: "[data-action='edit']",
        expect: { selector: "#edit-name", value: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

await run();
