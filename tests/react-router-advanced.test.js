import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import { validateRequirement } from "../src/core/validate-requirement.js";
import { run } from "../src/core/runner.js";
import {
  createReactLab,
  removeReactLab,
  ROUTED_APP_JSX,
  ROUTED_NAVLINK_APP_JSX,
  NO_ROUTES_APP_JSX,
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

function makeReq(subtype, extra = {}) {
  return {
    id: `react-${subtype}`,
    name: `React ${subtype} test`,
    points: 5,
    check: { type: "react", subtype, component: "src/App.jsx", ...extra },
  };
}

function validReq(check) {
  return { name: "validation", points: 5, check };
}

function expectThrows(check, pattern, label) {
  let threw = false;
  try {
    validateRequirement(validReq(check));
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

async function makeEngine(files) {
  const lab = createReactLab({ files });
  const engine = createReactEngine({ labDirectory: lab });
  return { lab, engine };
}

console.log("\nReact Router Advanced Assertion Tests (v1.3.1)\n");

// --- route ------------------------------------------------------------------

test("route passes when the exact path exists", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ROUTED_APP_JSX });
  try {
    const res = await reactAssertions.route(
      engine,
      makeReq("route", { path: "/about" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("route passes for the root path", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ROUTED_APP_JSX });
  try {
    const res = await reactAssertions.route(
      engine,
      makeReq("route", { path: "/" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("route fails when the path is missing", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ROUTED_APP_JSX });
  try {
    const res = await reactAssertions.route(
      engine,
      makeReq("route", { path: "/missing" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("/missing"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("route fails when the file has no routes at all", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": NO_ROUTES_APP_JSX });
  try {
    const res = await reactAssertions.route(
      engine,
      makeReq("route", { path: "/about" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("none"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- routeParam --------------------------------------------------------------

test("routeParam passes for a dynamic parameter route", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ROUTED_APP_JSX });
  try {
    const res = await reactAssertions.routeParam(
      engine,
      makeReq("routeParam", { path: "/users/:id" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("routeParam fails when the parameterized route is missing", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ROUTED_APP_JSX });
  try {
    const res = await reactAssertions.routeParam(
      engine,
      makeReq("routeParam", { path: "/posts/:slug" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("/posts/:slug"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("routeParam fails when no routes exist", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": NO_ROUTES_APP_JSX });
  try {
    const res = await reactAssertions.routeParam(
      engine,
      makeReq("routeParam", { path: "/users/:id" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("none"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- navLink ---------------------------------------------------------------

test("navLink passes for a <Link> target", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ROUTED_APP_JSX });
  try {
    const res = await reactAssertions.navLink(
      engine,
      makeReq("navLink", { expect: "/about" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("navLink passes for a <NavLink> target", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": ROUTED_NAVLINK_APP_JSX,
  });
  try {
    const res = await reactAssertions.navLink(
      engine,
      makeReq("navLink", { expect: "/about" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("navLink fails when no link targets the expected path", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": ROUTED_APP_JSX });
  try {
    const res = await reactAssertions.navLink(
      engine,
      makeReq("navLink", { expect: "/contact" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("/contact"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("navLink fails when no links exist at all", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": NO_ROUTES_APP_JSX });
  try {
    const res = await reactAssertions.navLink(
      engine,
      makeReq("navLink", { expect: "/about" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("none"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- validation -------------------------------------------------------------

test("accepts valid route, routeParam, and navLink requirements", () => {
  validateRequirement(
    validReq({ type: "react", subtype: "route", component: "src/App.jsx", path: "/about" })
  );
  validateRequirement(
    validReq({ type: "react", subtype: "routeParam", component: "src/App.jsx", path: "/users/:id" })
  );
  validateRequirement(
    validReq({ type: "react", subtype: "navLink", component: "src/App.jsx", expect: "/about" })
  );
});

test("requires path for route and routeParam", () => {
  expectThrows(
    { type: "react", subtype: "route", component: "src/App.jsx" },
    "path",
    "route without path should throw"
  );
  expectThrows(
    { type: "react", subtype: "routeParam", component: "src/App.jsx" },
    "path",
    "routeParam without path should throw"
  );
});

test("requires expect for navLink", () => {
  expectThrows(
    { type: "react", subtype: "navLink", component: "src/App.jsx" },
    "expect",
    "navLink without expect should throw"
  );
});

// --- integration ------------------------------------------------------------

test("full lab run passes advanced router requirements", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": ROUTED_APP_JSX },
    requirements: [
      makeReq("route", { path: "/about" }),
      makeReq("route", { path: "/" }),
      makeReq("routeParam", { path: "/users/:id" }),
      makeReq("navLink", { expect: "/about" }),
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

test("full lab run fails broken router requirements", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": NO_ROUTES_APP_JSX },
    requirements: [
      makeReq("route", { path: "/about" }),
      makeReq("navLink", { expect: "/about" }),
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 2, `expected 2 results, got ${summary.total}`);
    assert(summary.passed === 0, `expected 0 passed, got ${summary.passed}`);
    const failed = results.results.filter((result) => !result.passed);
    assert(failed.length === 2, "both requirements should fail");
  } finally {
    removeReactLab(lab);
  }
});

await runTests();