import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import { validateRequirement } from "../src/core/validate-requirement.js";
import { run } from "../src/core/runner.js";
import {
  createReactLab,
  removeReactLab,
  IMPORTS_APP_JSX,
  EFFECT_APP_JSX,
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

console.log("\nReact Project Structure Assertion Tests (v1.3.1)\n");

// --- fileExists --------------------------------------------------------------

test("fileExists passes for an existing file", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/useCounter.js": "export function useCounter() {}",
  });
  try {
    const res = await reactAssertions.fileExists(
      engine,
      makeReq("fileExists", { path: "src/hooks/useCounter.js" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("fileExists fails for a missing file", async () => {
  const { lab, engine } = await makeEngine({});
  try {
    const res = await reactAssertions.fileExists(
      engine,
      makeReq("fileExists", { path: "src/missing.jsx" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("src/missing.jsx"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- folderExists ------------------------------------------------------------

test("folderExists passes for an existing folder", async () => {
  const { lab, engine } = await makeEngine({
    "src/hooks/useCounter.js": "export function useCounter() {}",
  });
  try {
    const res = await reactAssertions.folderExists(
      engine,
      makeReq("folderExists", { path: "src/hooks" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("folderExists passes for the lab root", async () => {
  const { lab, engine } = await makeEngine({});
  try {
    const res = await reactAssertions.folderExists(
      engine,
      makeReq("folderExists", { path: "." })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("folderExists fails for a missing folder", async () => {
  const { lab, engine } = await makeEngine({});
  try {
    const res = await reactAssertions.folderExists(
      engine,
      makeReq("folderExists", { path: "src/nope" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("src/nope"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("folderExists fails when the path is a file, not a folder", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": EFFECT_APP_JSX,
  });
  try {
    const res = await reactAssertions.folderExists(
      engine,
      makeReq("folderExists", { path: "src/App.jsx" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("folder"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- imports -----------------------------------------------------------------

test("imports passes when every expected module is imported", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": IMPORTS_APP_JSX });
  try {
    const res = await reactAssertions.imports(
      engine,
      makeReq("imports", {
        expect: ["react-router-dom", "./components/Navbar"],
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("imports passes for a single expected module", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": IMPORTS_APP_JSX });
  try {
    const res = await reactAssertions.imports(
      engine,
      makeReq("imports", { expect: ["react"] })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("imports fails when one expected module is missing", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": IMPORTS_APP_JSX });
  try {
    const res = await reactAssertions.imports(
      engine,
      makeReq("imports", { expect: ["lodash"] })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("lodash"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("imports reports every missing module", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": IMPORTS_APP_JSX });
  try {
    const res = await reactAssertions.imports(
      engine,
      makeReq("imports", { expect: ["lodash", "axios"] })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("lodash"), res.message);
    assert(res.message.includes("axios"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("imports fails when the component file is missing", async () => {
  const { lab, engine } = await makeEngine({});
  try {
    const res = await reactAssertions.imports(
      engine,
      makeReq("imports", { expect: ["react"] })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("not found"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- validation -------------------------------------------------------------

test("accepts valid fileExists, folderExists, and imports requirements", () => {
  validateRequirement(
    validReq({ type: "react", subtype: "fileExists", path: "src/hooks/useCounter.js" })
  );
  validateRequirement(
    validReq({ type: "react", subtype: "folderExists", path: "src/hooks" })
  );
  validateRequirement(
    validReq({
      type: "react",
      subtype: "imports",
      component: "src/App.jsx",
      expect: ["react-router-dom", "./components/Navbar"],
    })
  );
});

test("requires path for fileExists and folderExists", () => {
  expectThrows(
    { type: "react", subtype: "fileExists" },
    "path",
    "fileExists without path should throw"
  );
  expectThrows(
    { type: "react", subtype: "folderExists" },
    "path",
    "folderExists without path should throw"
  );
});

test("requires a non-empty string array for imports expect", () => {
  expectThrows(
    { type: "react", subtype: "imports", component: "src/App.jsx" },
    "expect",
    "imports without expect should throw"
  );
  expectThrows(
    { type: "react", subtype: "imports", component: "src/App.jsx", expect: [] },
    "expect",
    "imports with empty expect should throw"
  );
  expectThrows(
    {
      type: "react",
      subtype: "imports",
      component: "src/App.jsx",
      expect: [42],
    },
    "expect",
    "imports with non-string expect should throw"
  );
});

// --- integration ------------------------------------------------------------

test("full lab run passes structure requirements", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: {
      "src/App.jsx": IMPORTS_APP_JSX,
      "src/components/Navbar.jsx": "export default function Navbar() { return <nav>Nav</nav>; }",
      "src/hooks/useCounter.js": "export function useCounter() { return [0, () => {}]; }",
    },
    requirements: [
      makeReq("fileExists", { path: "src/hooks/useCounter.js" }),
      makeReq("folderExists", { path: "src/components" }),
      makeReq("imports", { expect: ["react-router-dom", "./components/Navbar"] }),
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

test("full lab run fails structure requirements for a sparse project", async () => {
  const lab = createReactLab({
    entry: "src/App.jsx",
    files: { "src/App.jsx": IMPORTS_APP_JSX },
    requirements: [
      makeReq("fileExists", { path: "src/hooks/useCounter.js" }),
      makeReq("folderExists", { path: "src/components" }),
      makeReq("imports", { expect: ["react-router-dom", "axios"] }),
    ],
  });
  try {
    const results = await run(lab);
    const summary = results.summary();
    assert(summary.total === 3, `expected 3 results, got ${summary.total}`);
    assert(summary.passed === 0, `expected 0 passed, got ${summary.passed}`);
    const failed = results.results.filter((result) => !result.passed);
    assert(failed.length === 3, "all three requirements should fail");
  } finally {
    removeReactLab(lab);
  }
});

await runTests();