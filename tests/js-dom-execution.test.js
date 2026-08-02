import { createJSEngine, createJSEngineFromHTML } from "../src/core/js-execution-engine.js";
import { createTempLab, removeTempLab, runLab } from "./helpers/lab-fixtures.js";

function test(description, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => console.log(`  ✔ ${description}`))
    .catch(e => console.log(`  ✘ ${description}: ${e.message}`));
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

const DOM_REQ = {
  id: "dom-001",
  name: "Main element exists",
  points: 1,
  check: { type: "dom", assertion: "elementExists", selector: "main" },
};

console.log("\nJS DOM Execution Tests\n");

// ---------------------------------------------------------------------------
// DOM initialization
// ---------------------------------------------------------------------------

test("HTML entry initializes jsdom for DOM assertions", async () => {
  const labDir = createTempLab({
    html: "<!DOCTYPE html><html><body><main></main></body></html>",
    requirements: [DOM_REQ],
  });
  try {
    const results = await runLab(labDir);
    const summary = results.summary();
    assert(summary.passed === 1, `expected 1 pass, got ${summary.passed}`);
  } finally {
    removeTempLab(labDir);
  }
});

test("HTML entry without any JavaScript still initializes jsdom", async () => {
  const labDir = createTempLab({
    html: "<!DOCTYPE html><html><body><header><nav></nav></header></body></html>",
    requirements: [
      {
        id: "dom-001",
        name: "Header exists",
        points: 1,
        check: { type: "dom", assertion: "elementExists", selector: "header" },
      },
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "static HTML DOM assertion should pass");
  } finally {
    removeTempLab(labDir);
  }
});

test("empty HTML document produces a usable jsdom instance", () => {
  const engine = createJSEngineFromHTML({
    html: "",
    htmlFilePath: "/tmp/index.html",
  });
  assert(engine.document, "should expose a document");
  assert(!engine.executionError, "should have no execution error");
  const { element } = (() => {
    try {
      return { element: engine.document.querySelector("body") };
    } catch {
      return { element: null };
    }
  })();
  assert(element, "body should exist in jsdom");
});

test("exposes browser-like globals to student code", () => {
  const engine = createJSEngine({
    code: `
      const hasWindow = typeof window === 'object';
      const hasDocument = typeof document === 'object';
      const hasHTMLElement = typeof HTMLElement === 'function';
      const hasElement = typeof Element === 'function';
      const hasNode = typeof Node === 'function';
      const hasEvent = typeof Event === 'function';
      const hasCustomEvent = typeof CustomEvent === 'function';
      const hasNavigator = typeof navigator === 'object';
      const hasLocalStorage = typeof localStorage === 'object';
      const hasSessionStorage = typeof sessionStorage === 'object';
    `,
    html: "<!DOCTYPE html><html><body></body></html>",
  });

  assert(engine.getValue("hasWindow").value === true, "window missing");
  assert(engine.getValue("hasDocument").value === true, "document missing");
  assert(engine.getValue("hasHTMLElement").value === true, "HTMLElement missing");
  assert(engine.getValue("hasElement").value === true, "Element missing");
  assert(engine.getValue("hasNode").value === true, "Node missing");
  assert(engine.getValue("hasEvent").value === true, "Event missing");
  assert(engine.getValue("hasCustomEvent").value === true, "CustomEvent missing");
  assert(engine.getValue("hasNavigator").value === true, "navigator missing");
  assert(engine.getValue("hasLocalStorage").value === true, "localStorage missing");
  assert(engine.getValue("hasSessionStorage").value === true, "sessionStorage missing");
});

test("localStorage and sessionStorage work like a browser", () => {
  const engine = createJSEngine({
    code: `
      localStorage.setItem('theme', 'dark');
      sessionStorage.setItem('session', 'abc123');
      const storedTheme = localStorage.getItem('theme');
      const storedSession = sessionStorage.getItem('session');
    `,
    html: "<!DOCTYPE html><html><body></body></html>",
  });
  assert(engine.getValue("storedTheme").value === "dark", "localStorage round-trip failed");
  assert(engine.getValue("storedSession").value === "abc123", "sessionStorage round-trip failed");
});

test("multiple <script> tags run in document order", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <script>window.order = ['first'];</script>
        <script>window.order.push('second');</script>
        <script>window.order.push('third');</script>
      </body></html>
    `,
    requirements: [
      {
        id: "js-001",
        name: "Order recorded",
        points: 1,
        check: {
          type: "array",
          name: "window.order",
          length: 3,
        },
      },
    ],
  });
  try {
    const results = await runLab(labDir);
    const result = results.results.find(r => r.id === "js-001");
    assert(result.passed, `scripts should run in document order: ${result.message}`);
  } finally {
    removeTempLab(labDir);
  }
});

test("external scripts are loaded and executed", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <div id="title">static</div>
        <script src="app.js"></script>
      </body></html>
    `,
    files: {
      "app.js": "document.getElementById('title').textContent = 'From External';",
    },
    requirements: [
      {
        id: "dom-001",
        name: "External script ran",
        points: 1,
        check: {
          type: "dom",
          assertion: "textUpdated",
          selector: "#title",
          value: "From External",
        },
      },
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "external script should have run");
  } finally {
    removeTempLab(labDir);
  }
});

// ---------------------------------------------------------------------------
// Runtime behavior
// ---------------------------------------------------------------------------

test("student runtime errors are captured and reported, not crashed", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body><main></main></body></html>
      <script>throw new Error('boom');</script>
    `,
    requirements: [
      {
        id: "dom-001",
        name: "Main exists",
        points: 1,
        check: { type: "dom", assertion: "elementExists", selector: "main" },
      },
    ],
  });
  try {
    const results = await runLab(labDir);
    const result = results.results[0];
    assert(!result.passed, "assertion should fail when student code throws");
    assert(
      result.message.includes("JavaScript error prevented evaluation"),
      `message should mention the execution error, got: ${result.message}`
    );
  } finally {
    removeTempLab(labDir);
  }
});

test("DOM updates made by scripts are visible to DOM assertions", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <div id="status">old</div>
        <script>document.getElementById('status').textContent = 'new';</script>
      </body></html>
    `,
    requirements: [
      {
        id: "dom-001",
        name: "Status updated",
        points: 1,
        check: { type: "dom", assertion: "textUpdated", selector: "#status", value: "new" },
      },
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "DOM update should be visible");
  } finally {
    removeTempLab(labDir);
  }
});

test("scripts execute exactly once", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <script>window.runCount = (window.runCount || 0) + 1;</script>
      </body></html>
    `,
    requirements: [
      {
        id: "js-001",
        name: "Ran once",
        points: 1,
        check: { type: "variable", name: "window.runCount", value: 1 },
      },
      {
        id: "dom-001",
        name: "Second assertion still same engine",
        points: 1,
        check: { type: "variable", name: "window.runCount", value: 1 },
      },
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "script must run exactly once");
  } finally {
    removeTempLab(labDir);
  }
});

test("second script can see what the first script declared", () => {
  const engine = createJSEngineFromHTML({
    html: `
      <!DOCTYPE html><html><body>
        <script>window.shared = 10;</script>
        <script>window.doubled = window.shared * 2;</script>
      </body></html>
    `,
    htmlFilePath: "/tmp/index.html",
  });
  assert(engine.getValue("window.doubled").value === 20, "scripts should share the same global scope");
});

console.log("\n");
