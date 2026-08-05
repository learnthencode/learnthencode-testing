import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import { validateRequirement } from "../src/core/validate-requirement.js";
import { run } from "../src/core/runner.js";
import {
  createReactLab,
  removeReactLab,
  EFFECT_APP_JSX,
  EFFECT_NO_IMPORT_JSX,
  EFFECT_IMPORT_NO_CALL_JSX,
  EFFECT_NO_DEP_ARRAY_JSX,
  EFFECT_NO_CLEANUP_JSX,
  EFFECT_IMPLICIT_CLEANUP_JSX,
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

console.log("\nReact Effects Assertion Tests (v1.3.1)\n");

// --- effect -----------------------------------------------------------------

test("effect passes when useEffect is imported and called", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": EFFECT_APP_JSX });
  try {
    const res = await reactAssertions.effect(engine, makeReq("effect"));
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("effect fails when useEffect is not imported", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": EFFECT_NO_IMPORT_JSX });
  try {
    const res = await reactAssertions.effect(engine, makeReq("effect"));
    assert(!res.passed, "should fail");
    assert(res.message.includes("useEffect"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("effect fails when useEffect is imported but never called", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": EFFECT_IMPORT_NO_CALL_JSX,
  });
  try {
    const res = await reactAssertions.effect(engine, makeReq("effect"));
    assert(!res.passed, "should fail");
    assert(res.message.includes("never calls"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("effect fails when the component file is missing", async () => {
  const { lab, engine } = await makeEngine({});
  try {
    const res = await reactAssertions.effect(engine, makeReq("effect"));
    assert(!res.passed, "should fail");
    assert(res.message.includes("not found"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- dependencyArray ----------------------------------------------------------

test("dependencyArray passes for an empty dependency array", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": EFFECT_APP_JSX });
  try {
    const res = await reactAssertions.dependencyArray(
      engine,
      makeReq("dependencyArray")
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("dependencyArray passes when one effect depends on state", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": EFFECT_APP_JSX });
  try {
    const res = await reactAssertions.dependencyArray(
      engine,
      makeReq("dependencyArray")
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("dependencyArray fails when no dependency array is passed", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": EFFECT_NO_DEP_ARRAY_JSX,
  });
  try {
    const res = await reactAssertions.dependencyArray(
      engine,
      makeReq("dependencyArray")
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("dependency array"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("dependencyArray fails when no useEffect exists at all", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": EFFECT_NO_IMPORT_JSX,
  });
  try {
    const res = await reactAssertions.dependencyArray(
      engine,
      makeReq("dependencyArray")
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("No useEffect"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- cleanup ----------------------------------------------------------------

test("cleanup passes for an explicit return of a cleanup function", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": EFFECT_APP_JSX });
  try {
    const res = await reactAssertions.cleanup(engine, makeReq("cleanup"));
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("cleanup passes for an implicit arrow cleanup", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": EFFECT_IMPLICIT_CLEANUP_JSX,
  });
  try {
    const res = await reactAssertions.cleanup(engine, makeReq("cleanup"));
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("cleanup fails when no effect returns a cleanup function", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": EFFECT_NO_CLEANUP_JSX,
  });
  try {
    const res = await reactAssertions.cleanup(engine, makeReq("cleanup"));
    assert(!res.passed, "should fail");
    assert(res.message.includes("cleanup"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("cleanup fails when no useEffect exists at all", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": EFFECT_NO_IMPORT_JSX,
  });
  try {
    const res = await reactAssertions.cleanup(engine, makeReq("cleanup"));
    assert(!res.passed, "should fail");
    assert(res.message.includes("No useEffect"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- validation -------------------------------------------------------------

test("accepts valid effect, dependencyArray, and cleanup requirements", () => {
  validateRequirement(validReq({ type: "react", subtype: "effect", component: "src/App.jsx" }));
  validateRequirement(validReq({ type: "react", subtype: "dependencyArray", component: "src/App.jsx" }));
  validateRequirement(validReq({ type: "react", subtype: "cleanup", component: "src/App.jsx" }));
});

test("requires component for effect subtypes", () => {
  expectThrows(
    { type: "react", subtype: "effect" },
    "component",
    "effect without component should throw"
  );
  expectThrows(
    { type: "react", subtype: "dependencyArray" },
    "component",
    "dependencyArray without component should throw"
  );
  expectThrows(
    { type: "react", subtype: "cleanup" },
    "component",
    "cleanup without component should throw"
  );
});

// --- integration ------------------------------------------------------------

test("full lab run passes effect requirements for a good component", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": EFFECT_APP_JSX },
    requirements: [
      makeReq("effect"),
      makeReq("dependencyArray"),
      makeReq("cleanup"),
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 3, `expected 3 results, got ${summary.total}`);
    assert(summary.passed === 3, `expected 3 passed, got ${summary.passed}`);
  } finally {
    removeReactLab(lab);
  }
});

test("full lab run fails effect requirements for a broken component", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": EFFECT_NO_CLEANUP_JSX },
    requirements: [
      makeReq("effect"),
      makeReq("dependencyArray"),
      makeReq("cleanup"),
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 3, `expected 3 results, got ${summary.total}`);
    assert(summary.passed === 2, `expected 2 passed, got ${summary.passed}`);
    const failed = results.results.filter((result) => !result.passed);
    assert(failed.length === 1, "exactly one requirement should fail");
    assert(failed[0].id === "react-cleanup", "cleanup should fail");
  } finally {
    removeReactLab(lab);
  }
});

await runTests();