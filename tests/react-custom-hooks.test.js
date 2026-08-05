import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import { validateRequirement } from "../src/core/validate-requirement.js";
import { run } from "../src/core/runner.js";
import {
  createReactLab,
  removeReactLab,
  CUSTOM_HOOK_JSX,
  CUSTOM_HOOK_DEFAULT_JSX,
  CUSTOM_HOOK_NOT_EXPORTED_JSX,
  CUSTOM_HOOK_BAD_NAME_JSX,
  CUSTOM_HOOK_NO_HOOKS_JSX,
  INVALID_JSX_APP_JSX,
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

function makeReq(extra = {}) {
  return {
    id: "react-custom-hook",
    name: "React custom hook test",
    points: 5,
    check: {
      type: "react",
      subtype: "customHook",
      component: "src/hooks/useCounter.js",
      ...extra,
    },
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

console.log("\nReact Custom Hook Assertion Tests (v1.3.1)\n");

test("customHook passes for an exported use* function with hooks", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/useCounter.js": CUSTOM_HOOK_JSX,
  });
  try {
    const res = await reactAssertions.customHook(engine, makeReq());
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("customHook passes for a default-exported use* function", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/usePrevious.js": CUSTOM_HOOK_DEFAULT_JSX,
  });
  try {
    const res = await reactAssertions.customHook(
      engine,
      makeReq({ component: "src/hooks/usePrevious.js" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("customHook fails when the hook is not exported", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/useCounter.js": CUSTOM_HOOK_NOT_EXPORTED_JSX,
  });
  try {
    const res = await reactAssertions.customHook(engine, makeReq());
    assert(!res.passed, "should fail");
    assert(res.message.includes("export"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("customHook fails when the function name does not start with use", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/useCounter.js": CUSTOM_HOOK_BAD_NAME_JSX,
  });
  try {
    const res = await reactAssertions.customHook(engine, makeReq());
    assert(!res.passed, "should fail");
    assert(res.message.includes('"use"'), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("customHook fails when the hook calls no React hooks", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/useCounter.js": CUSTOM_HOOK_NO_HOOKS_JSX,
  });
  try {
    const res = await reactAssertions.customHook(engine, makeReq());
    assert(!res.passed, "should fail");
    assert(res.message.includes("useState"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("customHook fails when the hook file is missing", async () => {
  const { lab, engine } = await makeEngine({});
  try {
    const res = await reactAssertions.customHook(engine, makeReq());
    assert(!res.passed, "should fail");
    assert(res.message.includes("not found"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("customHook fails for an unparsable file", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/useCounter.js": INVALID_JSX_APP_JSX,
  });
  try {
    const res = await reactAssertions.customHook(engine, makeReq());
    assert(!res.passed, "should fail");
    assert(res.message.includes("could not be parsed"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("accepts a valid customHook requirement", () => {
  validateRequirement(
    validReq({
      type: "react",
      subtype: "customHook",
      component: "src/hooks/useCounter.js",
    })
  );
});

test("requires component for customHook", () => {
  expectThrows(
    { type: "react", subtype: "customHook" },
    "component",
    "customHook without component should throw"
  );
});

test("full lab run verifies hooks and folder structure together", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: {
      "src/App.jsx": CUSTOM_HOOK_JSX,
      "src/hooks/useCounter.js": CUSTOM_HOOK_JSX,
    },
    requirements: [
      {
        id: "h1",
        name: "Custom hook exists",
        points: 5,
        check: {
          type: "react",
          subtype: "customHook",
          component: "src/hooks/useCounter.js",
        },
      },
      {
        id: "h2",
        name: "Hook file exists",
        points: 5,
        check: { type: "react", subtype: "fileExists", path: "src/hooks/useCounter.js" },
      },
      {
        id: "h3",
        name: "Hooks folder exists",
        points: 5,
        check: { type: "react", subtype: "folderExists", path: "src/hooks" },
      },
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 3, `expected 3 results, got ${summary.total}`);
    assert(summary.passed === 3, `expected 3 passed, got ${summary.passed}`);
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

await runTests();