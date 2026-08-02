import { createJSEngine } from "../src/core/js-execution-engine.js";
import { executeRequirement } from "../src/core/execute-requirements.js";

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

function makeReq(id, check) {
  return {
    id,
    name: `Events ${id}`,
    points: 1,
    check,
  };
}

function runEvents(engine, check) {
  return executeRequirement(makeReq("evt", check), "", "", engine);
}

function makeEngine(code, html) {
  return createJSEngine({ code, html });
}

const BASE_HTML = `<!DOCTYPE html><html><body>
  <button id="click-button">Go</button>
  <form id="form"><input id="name-input"><button type="submit">Send</button></form>
  <div id="message"></div>
  <div id="output"></div>
</body></html>`;

console.log("\nJS Event Assertion Tests\n");

// ---------------------------------------------------------------------------
// Listener tracking
// ---------------------------------------------------------------------------

test("listenerExists: passes when a click listener is registered", () => {
  const engine = makeEngine(
    "document.getElementById('click-button').addEventListener('click', () => {});",
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "#click-button", event: "click",
  });
  assert(result.passed, "should pass");
});

test("listenerExists: fails when no matching listener exists", () => {
  const engine = makeEngine(
    "document.getElementById('click-button').addEventListener('click', () => {});",
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "#click-button", event: "submit",
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("submit"), "message should mention the missing event type");
});

test("listenerExists: passes when multiple listeners are registered", () => {
  const engine = makeEngine(
    `
      const btn = document.getElementById('click-button');
      btn.addEventListener('click', () => {});
      btn.addEventListener('click', () => {});
      btn.addEventListener('mouseover', () => {});
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "#click-button", event: "click",
  });
  assert(result.passed, "should pass with multiple listeners");
  assert(engine.listenerRegistry.length === 3, "registry should track all three listeners");
});

test("listenerExists: fails when the listener was removed", () => {
  const engine = makeEngine(
    `
      const btn = document.getElementById('click-button');
      const handler = () => {};
      btn.addEventListener('click', handler);
      btn.removeEventListener('click', handler);
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "#click-button", event: "click",
  });
  assert(!result.passed, "should fail after removeEventListener");
  assert(engine.listenerRegistry.length === 0, "registry should be empty after removal");
});

test("listenerExists: removing one listener keeps the others tracked", () => {
  const engine = makeEngine(
    `
      const btn = document.getElementById('click-button');
      const handler = () => {};
      btn.addEventListener('click', handler);
      btn.addEventListener('click', () => {});
      btn.removeEventListener('click', handler);
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "#click-button", event: "click",
  });
  assert(result.passed, "second listener should still be tracked");
});

test("listenerExists: fails when element is missing", () => {
  const engine = makeEngine("", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "#nope", event: "click",
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("not found"), "message should say element not found");
});

test("listenerExists: invalid selector fails gracefully", () => {
  const engine = makeEngine("", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "###", event: "click",
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("Invalid selector"), "message should mention invalid selector");
});

test("listenerExists: window-level listeners are tracked", () => {
  const engine = makeEngine(
    "window.addEventListener('resize', () => {});",
    BASE_HTML
  );
  const listeners = engine.getListeners(engine.window, "resize");
  assert(listeners.length === 1, "window listener should be tracked");
});

test("listenerExists: document-level listeners are tracked", () => {
  const engine = makeEngine(
    "document.addEventListener('DOMContentLoaded', () => {});",
    BASE_HTML
  );
  const listeners = engine.getListeners(engine.document, "DOMContentLoaded");
  assert(listeners.length === 1, "document listener should be tracked");
});

test("listenerExists: execution error returns failure", () => {
  const engine = makeEngine("throw new Error('boom');", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "listenerExists", selector: "#click-button", event: "click",
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("JavaScript error prevented evaluation"), "message should mention execution error");
});

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

test("dispatch: click event updates the DOM", () => {
  const engine = makeEngine(
    `
      document.getElementById('click-button').addEventListener('click', () => {
        document.getElementById('message').textContent = 'Button clicked!';
      });
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#click-button", event: "click",
    expect: { selector: "#message", text: "Button clicked!" },
  });
  assert(result.passed, "should pass");
});

test("dispatch: submit event works", () => {
  const engine = makeEngine(
    `
      document.getElementById('form').addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('message').textContent = 'Submitted';
      });
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#form", event: "submit",
    expect: { selector: "#message", text: "Submitted" },
  });
  assert(result.passed, "should pass");
});

test("dispatch: change event works", () => {
  const engine = makeEngine(
    `
      document.getElementById('name-input').addEventListener('change', () => {
        document.getElementById('message').textContent = 'Changed';
      });
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#name-input", event: "change",
    expect: { selector: "#message", text: "Changed" },
  });
  assert(result.passed, "should pass");
});

test("dispatch: keyboard event works", () => {
  const engine = makeEngine(
    `
      document.getElementById('name-input').addEventListener('keydown', (e) => {
        document.getElementById('message').textContent = 'Key: ' + e.key;
      });
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#name-input", event: "keydown", key: "Enter",
    expect: { selector: "#message", text: "Key: Enter" },
  });
  assert(result.passed, "should pass with keyboard event");
});

test("dispatch: fails when the resulting text differs", () => {
  const engine = makeEngine(
    `
      document.getElementById('click-button').addEventListener('click', () => {
        document.getElementById('message').textContent = 'Other';
      });
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#click-button", event: "click",
    expect: { selector: "#message", text: "Button clicked!" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes('"Other"'), "message should include actual text");
});

test("dispatch: fails when element is missing", () => {
  const engine = makeEngine("", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#nope", event: "click",
    expect: { selector: "#message", text: "x" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("not found"), "message should say element not found");
});

test("dispatch: fails when expect target is missing", () => {
  const engine = makeEngine(
    "document.getElementById('click-button').addEventListener('click', () => {});",
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#click-button", event: "click",
    expect: { selector: "#missing", text: "x" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("was not found"), "message should say expect target missing");
});

test("dispatch: invalid selector fails gracefully", () => {
  const engine = makeEngine("", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "###", event: "click",
    expect: { selector: "#message", text: "x" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("Invalid selector"), "message should mention invalid selector");
});

test("dispatch: unknown assertion returns failure", () => {
  const engine = makeEngine("", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "clickCount", selector: "#click-button", event: "click",
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("Unknown events assertion"), "message should mention unknown assertion");
});

test("dispatch: execution error returns failure", () => {
  const engine = makeEngine("throw new Error('boom');", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "dispatch", selector: "#click-button", event: "click",
    expect: { selector: "#message", text: "x" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("JavaScript error prevented evaluation"), "message should mention execution error");
});

// ---------------------------------------------------------------------------
// Input value changes
// ---------------------------------------------------------------------------

test("inputValueChanges: input value updates and app reacts", () => {
  const engine = makeEngine(
    `
      const input = document.getElementById('name-input');
      input.addEventListener('input', () => {
        document.getElementById('output').textContent = 'Hello ' + input.value;
      });
    `,
    BASE_HTML
  );
  const result = runEvents(engine, {
    type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Yahya",
    expect: { selector: "#output", text: "Hello Yahya" },
  });
  assert(result.passed, "should pass");
});

test("inputValueChanges: fails when the app does not react", () => {
  const engine = makeEngine("", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Yahya",
    expect: { selector: "#output", text: "Hello Yahya" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes('"Hello Yahya"'), "message should include expected text");
});

test("inputValueChanges: fails when input element is missing", () => {
  const engine = makeEngine("", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "inputValueChanges", selector: "#nope", value: "Yahya",
    expect: { selector: "#output", text: "Hello Yahya" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("not found"), "message should say input not found");
});

test("inputValueChanges: execution error returns failure", () => {
  const engine = makeEngine("throw new Error('boom');", BASE_HTML);
  const result = runEvents(engine, {
    type: "events", assertion: "inputValueChanges", selector: "#name-input", value: "Yahya",
    expect: { selector: "#output", text: "Hello Yahya" },
  });
  assert(!result.passed, "should fail");
  assert(result.message.includes("JavaScript error prevented evaluation"), "message should mention execution error");
});

console.log("\n");
