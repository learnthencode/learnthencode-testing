import { createReactEngine } from "../src/core/react-engine.js";
import fs from "fs";
import path from "path";
import {
  createReactLab,
  removeReactLab,
  COUNTER_APP_JSX,
  PROPS_APP_JSX,
  CLASS_APP_JSX,
  NO_EXPORT_APP_JSX,
  NOT_FUNCTION_APP_JSX,
  INVALID_JSX_APP_JSX,
  STRING_RETURN_APP_JSX,
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

const PASSING_FILES = {
  "src/App.jsx": COUNTER_APP_JSX,
  "src/Greeting.jsx": PROPS_APP_JSX,
};

console.log("\nReact Static Assertion Tests\n");

// --- projectAssertion -------------------------------------------------------

test("project assertion passes for a React project", async () => {
  const lab = createReactLab({ files: PASSING_FILES });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { projectAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = { name: "project", points: 5, check: { type: "react", subtype: "project" } };
    const res = projectAssertion(engine, req);
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("project assertion fails when package.json is missing", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": COUNTER_APP_JSX } });
  try {
    fsRenamePackageJson(lab, false);
    const engine = createReactEngine({ labDirectory: lab });
    const { projectAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = { name: "project", points: 5, check: { type: "react", subtype: "project" } };
    const res = projectAssertion(engine, req);
    assert(!res.passed, "should fail without package.json");
    assert(res.message.includes("package.json"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("project assertion checks the entry file", async () => {
  const lab = createReactLab({ files: PASSING_FILES });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { projectAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = {
      name: "project",
      points: 5,
      check: { type: "react", subtype: "project", entry: "src/main.jsx" },
    };
    const res = projectAssertion(engine, req);
    assert(!res.passed, "should fail when the declared entry does not exist");
    assert(res.message.includes("src/main.jsx"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("project assertion checks tooling", async () => {
  const lab = createReactLab({
    files: PASSING_FILES,
    packageJson: { devDependencies: {} },
  });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { projectAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = {
      name: "project",
      points: 5,
      check: { type: "react", subtype: "project", tooling: "vite" },
    };
    const res = projectAssertion(engine, req);
    assert(!res.passed, "should fail when tooling does not match");
    assert(res.message.includes("Vite"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- dependencyAssertion ----------------------------------------------------

test("dependency assertion passes when packages are present", async () => {
  const lab = createReactLab({ files: PASSING_FILES });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { dependencyAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = {
      name: "deps",
      points: 5,
      check: { type: "react", subtype: "dependency", dependencies: ["react", "react-dom"] },
    };
    const res = dependencyAssertion(engine, req);
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("dependency assertion reports missing packages", async () => {
  const lab = createReactLab({
    files: PASSING_FILES,
    packageJson: { dependencies: { react: "^19.2.8" } },
  });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { dependencyAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = {
      name: "deps",
      points: 5,
      check: { type: "react", subtype: "dependency", dependencies: ["react-router-dom"] },
    };
    const res = dependencyAssertion(engine, req);
    assert(!res.passed, "should fail when a dependency is missing");
    assert(res.message.includes("react-router-dom"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- componentAssertion -----------------------------------------------------

test("component assertion passes for an existing exported component", async () => {
  const lab = createReactLab({ files: PASSING_FILES });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { componentAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = {
      name: "comp",
      points: 5,
      check: {
        type: "react",
        subtype: "component",
        component: "src/App.jsx",
        exported: true,
        functionComponent: true,
      },
    };
    const res = await componentAssertion(engine, req);
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("component assertion fails when the file is missing", async () => {
  const lab = createReactLab({ files: PASSING_FILES });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { componentAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = {
      name: "comp",
      points: 5,
      check: { type: "react", subtype: "component", component: "src/Missing.jsx" },
    };
    const res = await componentAssertion(engine, req);
    assert(!res.passed, "should fail for a missing file");
    assert(res.message.includes("not found"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("component assertion rejects class components", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": CLASS_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { componentAssertion } = await import(
      "../src/assertions/react/static.js"
    );
    const req = {
      name: "comp",
      points: 5,
      check: {
        type: "react",
        subtype: "component",
        component: "src/App.jsx",
        exported: true,
        functionComponent: true,
      },
    };
    const res = await componentAssertion(engine, req);
    assert(!res.passed, "should reject a class component");
    assert(res.message.includes("class"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

// --- jsxAssertion -----------------------------------------------------------

test("jsx assertion passes for valid JSX", async () => {
  const lab = createReactLab({ files: PASSING_FILES });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { jsxAssertion } = await import("../src/assertions/react/static.js");
    const req = {
      name: "jsx",
      points: 5,
      check: { type: "react", subtype: "jsx", component: "src/App.jsx" },
    };
    const res = await jsxAssertion(engine, req);
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("jsx assertion fails for a plain string return", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": STRING_RETURN_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { jsxAssertion } = await import("../src/assertions/react/static.js");
    const req = {
      name: "jsx",
      points: 5,
      check: { type: "react", subtype: "jsx", component: "src/App.jsx" },
    };
    const res = await jsxAssertion(engine, req);
    assert(!res.passed, "should fail for a plain string return");
    assert(res.message.includes("JSX"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("jsx assertion fails for unparsable JSX", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": INVALID_JSX_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { jsxAssertion } = await import("../src/assertions/react/static.js");
    const req = {
      name: "jsx",
      points: 5,
      check: { type: "react", subtype: "jsx", component: "src/App.jsx" },
    };
    const res = await jsxAssertion(engine, req);
    assert(!res.passed, "should fail for unparsable JSX");
    assert(res.message.includes("could not be parsed"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

function fsRenamePackageJson(lab, restore) {
  const pkg = path.join(lab, "package.json");
  const bak = pkg + ".bak";
  if (restore) {
    if (fs.existsSync(bak)) fs.renameSync(bak, pkg);
  } else if (fs.existsSync(pkg)) {
    fs.renameSync(pkg, bak);
  }
}

await run();
