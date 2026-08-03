import { createReactEngine } from "../src/core/react-engine.js";
import {
  createReactLab,
  removeReactLab,
  COUNTER_APP_JSX,
  USERS_APP_JSX,
  NO_EXPORT_APP_JSX,
  NOT_FUNCTION_APP_JSX,
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

console.log("\nReact Engine Tests\n");

test("auto-detects the entry file", () => {
  const lab = createReactLab({
    files: { "src/App.jsx": COUNTER_APP_JSX },
  });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    assert(engine.entryFile === "src/App.jsx", `got ${engine.entryFile}`);
  } finally {
    removeReactLab(lab);
  }
});

test("prefers the configured entry when it exists", () => {
  const lab = createReactLab({
    entry: "src/main.jsx",
    files: { "src/main.jsx": COUNTER_APP_JSX },
  });
  try {
    const engine = createReactEngine({ labDirectory: lab, entry: "src/main.jsx" });
    assert(engine.entryFile === "src/main.jsx", `got ${engine.entryFile}`);
  } finally {
    removeReactLab(lab);
  }
});

test("detectEntryFile probes common candidates", () => {
  const lab = createReactLab({
    files: { "src/main.jsx": COUNTER_APP_JSX },
  });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    assert(engine.detectEntryFile() === "src/main.jsx", "should detect src/main.jsx");
  } finally {
    removeReactLab(lab);
  }
});

test("packageJsonPresent, hasDependency, getProjectTooling", () => {
  const lab = createReactLab({ files: { "src/App.jsx": COUNTER_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    assert(engine.packageJsonPresent, "package.json should be present");
    assert(engine.hasDependency("react"), "react dependency present");
    assert(!engine.hasDependency("redux"), "redux not present");
    assert(engine.getProjectTooling() === "vite", "tooling is vite");
  } finally {
    removeReactLab(lab);
  }
});

test("getComponent returns an error for a missing file", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": COUNTER_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { component, error } = await engine.getComponent({
      file: "src/Missing.jsx",
    });
    assert(component === null, "component should be null");
    assert(error && error.includes("not found"), error);
  } finally {
    removeReactLab(lab);
  }
});

test("getComponent returns an error for a file without exports", async () => {
  const lab = createReactLab({ files: { "src/Hidden.jsx": NO_EXPORT_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { component, error } = await engine.getComponent({
      file: "src/Hidden.jsx",
    });
    assert(component === null, "component should be null");
    assert(error && error.includes("does not export"), error);
  } finally {
    removeReactLab(lab);
  }
});

test("getComponent returns an error for a non-function export", async () => {
  const lab = createReactLab({ files: { "src/Data.jsx": NOT_FUNCTION_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { component, error } = await engine.getComponent({
      file: "src/Data.jsx",
    });
    assert(component === null, "component should be null");
    assert(error && error.includes("not a component"), error);
  } finally {
    removeReactLab(lab);
  }
});

test("getComponent resolves the default export", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": COUNTER_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { component, error } = await engine.getComponent({
      file: "src/App.jsx",
    });
    assert(!error, error);
    assert(typeof component === "function", "component should be a function");
  } finally {
    removeReactLab(lab);
  }
});

test("renderComponent renders and exposes the container", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": COUNTER_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { container, errors, error } = await engine.renderComponent({
      file: "src/App.jsx",
    });
    assert(!error, error);
    assert(errors.length === 0, "no render errors");
    assert(container.textContent.includes("Count: 0"), container.textContent);
  } finally {
    removeReactLab(lab);
  }
});

test("renderComponent reports execution errors from the vm", async () => {
  const lab = createReactLab({
    files: {
      "src/Broken.jsx": `
export default function Broken() {
  return notDefined.here;
}
`,
    },
  });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { container, error } = await engine.renderComponent({
      file: "src/Broken.jsx",
    });
    assert(container === null, "container should be null");
    assert(error && error.includes("notDefined"), error);
  } finally {
    removeReactLab(lab);
  }
});

test("fetch mocking records calls and serves bodies", async () => {
  const lab = createReactLab({ files: { "src/Users.jsx": USERS_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    engine.setFetchMocks({
      "/api/users": {
        status: 200,
        body: [{ id: 1, name: "Alice" }],
      },
    });
    const { container, errors } = await engine.renderComponent({
      file: "src/Users.jsx",
    });
    assert(errors.length === 0, "no render errors");
    assert(container.textContent.includes("Alice"), container.textContent);
    assert(
      engine.fetchCalls.some((call) => call.url === "/api/users"),
      "fetch call recorded"
    );
  } finally {
    removeReactLab(lab);
  }
});

test("console output is captured from bundled code", async () => {
  const lab = createReactLab({
    files: {
      "src/App.jsx": `
export default function App() {
  console.log("hi from component");
  return <p>ok</p>;
}
`,
    },
  });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    await engine.renderComponent({ file: "src/App.jsx" });
    assert(
      engine.consoleOutput.some((line) => line.includes("hi from component")),
      `got: ${engine.consoleOutput.join("|")}`
    );
  } finally {
    removeReactLab(lab);
  }
});

test("bundling is cached", async () => {
  const lab = createReactLab({ files: { "src/App.jsx": COUNTER_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const first = await engine.bundle(engine.resolve("src/App.jsx"));
    const second = await engine.bundle(engine.resolve("src/App.jsx"));
    assert(first === second, "same promise should be returned from cache");
  } finally {
    removeReactLab(lab);
  }
});

test("a component returning a plain string renders as text", async () => {
  const lab = createReactLab({ files: { "src/Plain.jsx": STRING_RETURN_APP_JSX } });
  try {
    const engine = createReactEngine({ labDirectory: lab });
    const { container, errors } = await engine.renderComponent({
      file: "src/Plain.jsx",
    });
    assert(errors.length === 0, "plain strings are valid React children");
    assert(container.textContent === "hello", container.textContent);
  } finally {
    removeReactLab(lab);
  }
});

await run();
