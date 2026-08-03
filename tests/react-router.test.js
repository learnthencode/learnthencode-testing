import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import {
  createReactLab,
  removeReactLab,
  ROUTED_APP_JSX,
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

function makeReq(extra = {}) {
  return {
    id: "react-router",
    name: "React router test",
    points: 5,
    check: { type: "react", subtype: "router", component: "src/App.jsx", ...extra },
  };
}

async function makeEngine() {
  const lab = createReactLab({ files: { "src/App.jsx": ROUTED_APP_JSX } });
  const engine = createReactEngine({ labDirectory: lab });
  return { lab, engine };
}

console.log("\nReact Router Assertion Tests\n");

test("renders the initial route", async () => {
  const { lab, engine } = await makeEngine();
  try {
    const res = await reactAssertions.router(
      engine,
      makeReq({ router: { path: "/" }, expect: { text: "Home" } })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("renders a deep path", async () => {
  const { lab, engine } = await makeEngine();
  try {
    const res = await reactAssertions.router(
      engine,
      makeReq({ router: { path: "/about" }, expect: { text: "About" } })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("renders a useParams route", async () => {
  const { lab, engine } = await makeEngine();
  try {
    const res = await reactAssertions.router(
      engine,
      makeReq({ router: { path: "/users/42" }, expect: { text: "User 42" } })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("navigates through a Link", async () => {
  const { lab, engine } = await makeEngine();
  try {
    const res = await reactAssertions.router(
      engine,
      makeReq({
        router: { path: "/" },
        navigateTo: "/about",
        expect: { text: "About" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fails when the route content is missing", async () => {
  const { lab, engine } = await makeEngine();
  try {
    const res = await reactAssertions.router(
      engine,
      makeReq({ router: { path: "/" }, expect: { text: "Not here" } })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Not here"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fails when the navigation link is missing", async () => {
  const { lab, engine } = await makeEngine();
  try {
    const res = await reactAssertions.router(
      engine,
      makeReq({ router: { path: "/" }, navigateTo: "/missing", expect: { text: "Home" } })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("/missing"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

await run();
