import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import {
  createReactLab,
  removeReactLab,
  USERS_APP_JSX,
  ASYNC_APP_JSX,
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
    id: "react-effect-" + subtype,
    name: "React effects test",
    points: 5,
    check: { type: "react", subtype, component: "src/App.jsx", ...extra },
  };
}

async function makeEngine(files) {
  const lab = createReactLab({ files });
  const engine = createReactEngine({ labDirectory: lab });
  return { lab, engine };
}

console.log("\nReact Effects & Fetch Assertion Tests\n");

test("loadsOnMount passes when the fetch data renders", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.loadsOnMount(
      engine,
      makeReq("loadsOnMount", {
        fetch: {
          "/api/users": {
            body: [{ id: 1, name: "Alice" }],
          },
        },
        expect: { text: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("loadsOnMount fails when the expected text is absent", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.loadsOnMount(
      engine,
      makeReq("loadsOnMount", {
        fetch: {
          "/api/users": {
            body: [{ id: 1, name: "Alice" }],
          },
        },
        expect: { text: "Bob" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Bob"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("loadsOnMount fails when the URL is never fetched", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.loadsOnMount(
      engine,
      makeReq("loadsOnMount", {
        fetch: {
          "/api/other": { body: [] },
        },
        expect: { text: "No users found." },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("/api/other"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("loadsOnMount supports the empty scenario", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.loadsOnMount(
      engine,
      makeReq("loadsOnMount", {
        fetch: { "/api/users": { scenario: "empty" } },
        expect: { empty: true },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("loadsOnMount supports the error scenario", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.loadsOnMount(
      engine,
      makeReq("loadsOnMount", {
        fetch: { "/api/users": { scenario: "error" } },
        expect: { error: true },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fetch assertion passes for a mocked route", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.fetch(
      engine,
      makeReq("fetch", {
        fetch: {
          "/api/users": {
            body: [{ id: 1, name: "Alice" }],
          },
        },
        expect: { text: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fetch assertion catches a missing call", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.fetch(
      engine,
      makeReq("fetch", {
        fetch: { "/api/never": { body: [] } },
        expect: { text: "No users found." },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("/api/never"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fetch assertion supports substring URL matching", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.fetch(
      engine,
      makeReq("fetch", {
        fetch: { "/users": { body: [{ id: 1, name: "Alice" }] } },
        expect: { text: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fetch assertion supports a catch-all route", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": USERS_APP_JSX });
  try {
    const res = await reactAssertions.fetch(
      engine,
      makeReq("fetch", {
        fetch: { "*": { body: [{ id: 1, name: "Alice" }] } },
        expect: { text: "Alice" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("async assertion waits for delayed updates", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ASYNC_APP_JSX });
  try {
    const res = await reactAssertions.async(
      engine,
      makeReq("async", { expect: { text: "Ready" } })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("async assertion fails when the delayed update never arrives", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ASYNC_APP_JSX });
  try {
    const res = await reactAssertions.async(
      engine,
      makeReq("async", { expect: { text: "Never appears" } })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Never appears"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

await run();
