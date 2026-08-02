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
  return { id, name: `Event Integration ${id}`, points: 1, check };
}

console.log("\nJS Event Integration Tests\n");

test("listenerExists + dispatch share one execution environment", async () => {
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
      req("l1", { type: "events", assertion: "listenerExists", selector: "#btn", event: "click" }),
      req("d1", { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { selector: "#out", text: "Clicked" } }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "listenerExists and dispatch should share the same engine");
  } finally {
    removeTempLab(labDir);
  }
});

test("dispatch + DOM assertions share the same DOM", async () => {
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
      req("d1", { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { selector: "#out", text: "Clicked" } }),
      req("d2", { type: "dom", assertion: "textUpdated", selector: "#out", value: "Clicked" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "dispatch updates must be visible to DOM assertions");
  } finally {
    removeTempLab(labDir);
  }
});

test("inputValueChanges + DOM assertions share the same DOM", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <input id="name-input">
        <div id="message"></div>
        <script>
          const input = document.getElementById('name-input');
          input.addEventListener('input', () => {
            document.getElementById('message').textContent = 'Hi ' + input.value;
          });
        </script>
      </body></html>
    `,
    requirements: [
      req("i1", { type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Alice", expect: { selector: "#message", text: "Hi Alice" } }),
      req("d1", { type: "dom", assertion: "textUpdated", selector: "#message", value: "Hi Alice" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "inputValueChanges updates must be visible to DOM assertions");
  } finally {
    removeTempLab(labDir);
  }
});

test("events + console assertions share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <button id="btn">Go</button>
        <div id="out"></div>
        <script>
          document.getElementById('btn').addEventListener('click', () => {
            document.getElementById('out').textContent = 'Clicked';
            console.log('button clicked');
          });
        </script>
      </body></html>
    `,
    requirements: [
      req("d1", { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { selector: "#out", text: "Clicked" } }),
      req("c1", { type: "console", assertion: "logContains", value: "button clicked" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "dispatch output must be visible to console assertions");
  } finally {
    removeTempLab(labDir);
  }
});

test("events + variable assertions share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <button id="btn">Go</button>
        <div id="out"></div>
        <script>
          const label = 'Clicked';
          document.getElementById('btn').addEventListener('click', () => {
            document.getElementById('out').textContent = label;
          });
        </script>
      </body></html>
    `,
    requirements: [
      req("v1", { type: "variable", name: "label", value: "Clicked" }),
      req("d1", { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { selector: "#out", text: "Clicked" } }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "variable and events assertions should share the engine");
  } finally {
    removeTempLab(labDir);
  }
});

test("events + fetch assertions share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <button id="btn">Go</button>
        <div id="out"></div>
        <script>
          document.getElementById('btn').addEventListener('click', () => {
            fetch('/api/clicked');
            document.getElementById('out').textContent = 'Clicked';
          });
        </script>
      </body></html>
    `,
    requirements: [
      req("d1", { type: "events", assertion: "dispatch", selector: "#btn", event: "click", expect: { selector: "#out", text: "Clicked" } }),
      req("f1", { type: "fetch", assertion: "called", endpoint: "/api/clicked" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "fetch calls made during dispatch must be recorded");
  } finally {
    removeTempLab(labDir);
  }
});

test("events + async assertions share one execution environment", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <button id="btn">Go</button>
        <div id="out"></div>
        <script>
          function getLabel() {
            return new Promise(resolve => {
              setTimeout(() => resolve('Clicked'), 10);
            });
          }
          document.getElementById('btn').addEventListener('click', () => {
            document.getElementById('out').textContent = 'Clicked';
          });
        </script>
      </body></html>
    `,
    requirements: [
      req("a1", { type: "function", assertion: "resolves", name: "getLabel", value: "Clicked" }),
      req("d1", { type: "events", assertion: "listenerExists", selector: "#btn", event: "click" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "async and events assertions should share the engine");
  } finally {
    removeTempLab(labDir);
  }
});

test("failing events assertion does not mask other assertions", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <button id="btn">Go</button>
        <div id="out">fine</div>
      </body></html>
    `,
    requirements: [
      req("l1", { type: "events", assertion: "listenerExists", selector: "#btn", event: "click" }),
      req("d1", { type: "dom", assertion: "textUpdated", selector: "#out", value: "fine" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    const summary = results.summary();
    assert(summary.failed === 1, "only the events assertion should fail");
    assert(summary.passed === 1, "the DOM assertion should still pass");
  } finally {
    removeTempLab(labDir);
  }
});

console.log("\n");
