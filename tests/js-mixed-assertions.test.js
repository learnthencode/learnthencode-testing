import { createTempLab, removeTempLab, runLab } from "./helpers/lab-fixtures.js";

function test(description, fn) {
  try {
    fn();
    console.log(`  ✔ ${description}`);
  } catch (e) {
    console.log(`  ✘ ${description}: ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function req(id, check) {
  return { id, name: `Mixed ${id}`, points: 1, check };
}

console.log("\nJS Mixed Assertion Tests\n");

test("DOM + variable assertions share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <div id="title">original</div>
        <script>
          const username = 'John';
          document.getElementById('title').textContent = 'Welcome, ' + username;
        </script>
      </body></html>
    `,
    requirements: [
      req("v1", { type: "variable", name: "username", value: "John" }),
      req("d1", { type: "dom", assertion: "textUpdated", selector: "#title", value: "Welcome, John" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "both assertions should pass in the same engine");
  } finally {
    removeTempLab(labDir);
  }
});

test("DOM + function assertions share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <script>
          function greet(name) { return 'Hello ' + name; }
          document.body.dataset.greeted = 'yes';
        </script>
      </body></html>
    `,
    requirements: [
      req("f1", { type: "function", name: "greet", args: ["World"], returns: "Hello World" }),
      req("d1", { type: "dom", assertion: "elementExists", selector: "body[data-greeted='yes']" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "function and DOM assertions should pass");
  } finally {
    removeTempLab(labDir);
  }
});

test("DOM + events share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <button id="btn">Go</button>
        <div id="out"></div>
        <script>
          document.getElementById('btn').addEventListener('click', () => {
            document.getElementById('out').textContent = 'Clicked';
          });
        </script>
      </body></html>
    `,
    requirements: [
      req("e1", {
        type: "event",
        assertion: "click",
        selector: "#btn",
        effect: { target: "#out", property: "textContent", equals: "Clicked" },
      }),
      req("d1", { type: "dom", assertion: "textUpdated", selector: "#out", value: "Clicked" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "event and DOM assertions should share the same DOM");
  } finally {
    removeTempLab(labDir);
  }
});

test("DOM + fetch share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <div id="log">idle</div>
        <script>
          fetch('/api/users');
          document.getElementById('log').textContent = 'fetched';
        </script>
      </body></html>
    `,
    requirements: [
      req("f1", { type: "fetch", assertion: "called", endpoint: "/api/users" }),
      req("d1", { type: "dom", assertion: "textUpdated", selector: "#log", value: "fetched" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "fetch and DOM assertions should pass");
  } finally {
    removeTempLab(labDir);
  }
});

test("DOM + console share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <script>
          console.log('ready');
          document.body.classList.add('logged');
        </script>
      </body></html>
    `,
    requirements: [
      req("c1", { type: "console", assertion: "logContains", value: "ready" }),
      req("d1", { type: "dom", assertion: "classAdded", selector: "body", className: "logged" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "console and DOM assertions should pass");
  } finally {
    removeTempLab(labDir);
  }
});

test("DOM + async assertions share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <div id="out">idle</div>
        <script>
          function getData() {
            return new Promise(resolve => {
              setTimeout(() => {
                document.getElementById('out').textContent = 'resolved';
                resolve('payload');
              }, 10);
            });
          }
        </script>
      </body></html>
    `,
    requirements: [
      req("a1", {
        type: "function",
        assertion: "resolves",
        name: "getData",
        value: "payload",
      }),
      req("d1", { type: "dom", assertion: "textUpdated", selector: "#out", value: "resolved" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "async and DOM assertions should share the engine");
  } finally {
    removeTempLab(labDir);
  }
});

test("every JS assertion type triggers engine initialization", async () => {
  const jsTypes = [
    ["variable", { type: "variable", name: "username", value: "John" }],
    ["function", { type: "function", name: "greet", args: ["x"], returns: "Hello x" }],
    ["array", { type: "array", name: "fruits", length: 3 }],
    ["object", { type: "object", name: "person", property: "name", value: "John" }],
    ["dom", { type: "dom", assertion: "elementExists", selector: "main" }],
    ["event", { type: "event", assertion: "click", selector: "#btn", effect: { target: "#out", property: "textContent", equals: "Clicked" } }],
    ["fetch", { type: "fetch", assertion: "called" }],
    ["json", { type: "json", assertion: "parse" }],
    ["console", { type: "console", assertion: "logContains", value: "hello" }],
  ];

  const html = `
    <!DOCTYPE html><html><body>
      <main></main>
      <button id="btn">Go</button>
      <div id="out"></div>
      <script>
        const username = 'John';
        const fruits = ['apple', 'banana', 'cherry'];
        const person = { name: 'John', age: 30 };
        function greet(name) { return 'Hello ' + name; }
        document.getElementById('btn').addEventListener('click', () => {
          document.getElementById('out').textContent = 'Clicked';
        });
        fetch('/api/data');
        JSON.parse('{}');
        console.log('hello world');
      </script>
    </body></html>
  `;

  for (const [label, check] of jsTypes) {
    const labDir = createTempLab({ html, requirements: [req(`type-${label}`, check)] });
    try {
      const results = await runLab(labDir);
      const summary = results.summary();
      assert(summary.failed === 0, `type "${label}" should initialize the engine and pass`);
    } finally {
      removeTempLab(labDir);
    }
  }
});

test("HTML lab without JS requirements is untouched by the engine", async () => {
  const labDir = createTempLab({
    html: "<!DOCTYPE html><html><body><h1>Hello</h1></body></html>",
    requirements: [
      req("h1", { type: "element", selector: "h1" }),
      req("t1", { type: "text", selector: "h1", contains: "Hello" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "pure HTML assertions should still pass");
  } finally {
    removeTempLab(labDir);
  }
});

console.log("\n");
