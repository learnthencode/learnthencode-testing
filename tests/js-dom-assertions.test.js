import { createJSEngine } from "../src/core/js-execution-engine.js";
import { executeRequirement } from "../src/core/execute-requirements.js";
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

function makeReq(id, check) {
  return {
    id,
    name: `DOM Assertion ${id}`,
    points: 1,
    check,
  };
}

function runDom(engine, requirement) {
  return executeRequirement(requirement, "", "", engine);
}

console.log("\nJS DOM Assertion Tests\n");

test("elementExists: passes when element is found", () => {
  const engine = createJSEngine({ code: "", html: "<html><body><main></main></body></html>" });
  const result = runDom(engine, makeReq("a1", {
    type: "dom", assertion: "elementExists", selector: "main",
  }));
  assert(result.passed, "should pass");
});

test("elementExists: fails when selector is missing", () => {
  const engine = createJSEngine({ code: "", html: "<html><body><main></main></body></html>" });
  const result = runDom(engine, makeReq("a2", {
    type: "dom", assertion: "elementExists", selector: ".nope",
  }));
  assert(!result.passed, "should fail");
  assert(result.message.includes(".nope"), "message should mention selector");
});

test("elementExists: invalid selector fails gracefully, does not crash", () => {
  const engine = createJSEngine({ code: "", html: "<html><body><main></main></body></html>" });
  const result = runDom(engine, makeReq("a3", {
    type: "dom", assertion: "elementExists", selector: "###",
  }));
  assert(!result.passed, "should fail");
  assert(result.message.includes("Invalid selector"), `should mention invalid selector, got: ${result.message}`);
});

test("elementRemoved: passes when element was removed by script", () => {
  const engine = createJSEngine({
    code: "document.getElementById('gone').remove();",
    html: "<html><body><div id='gone'></div></body></html>",
  });
  const result = runDom(engine, makeReq("a4", {
    type: "dom", assertion: "elementRemoved", selector: "#gone",
  }));
  assert(result.passed, "should pass");
});

test("textUpdated: passes when text matches", () => {
  const engine = createJSEngine({
    code: "document.getElementById('out').textContent = 'Success';",
    html: "<html><body><div id='out'></div></body></html>",
  });
  const result = runDom(engine, makeReq("a5", {
    type: "dom", assertion: "textUpdated", selector: "#out", value: "Success",
  }));
  assert(result.passed, "should pass");
});

test("textUpdated: fails when text differs", () => {
  const engine = createJSEngine({ code: "", html: "<html><body><div id='out'>old</div></body></html>" });
  const result = runDom(engine, makeReq("a6", {
    type: "dom", assertion: "textUpdated", selector: "#out", value: "new",
  }));
  assert(!result.passed, "should fail");
  assert(result.message.includes('"old"'), "message should include actual text");
});

test("textUpdated: fails when element missing", () => {
  const engine = createJSEngine({ code: "", html: "<html><body></body></html>" });
  const result = runDom(engine, makeReq("a7", {
    type: "dom", assertion: "textUpdated", selector: "#out", value: "new",
  }));
  assert(!result.passed, "should fail");
  assert(result.message.includes("not found"), "message should say element not found");
});

test("classAdded: passes when class present", () => {
  const engine = createJSEngine({
    code: "document.getElementById('box').classList.add('active');",
    html: "<html><body><div id='box'></div></body></html>",
  });
  const result = runDom(engine, makeReq("a8", {
    type: "dom", assertion: "classAdded", selector: "#box", className: "active",
  }));
  assert(result.passed, "should pass");
});

test("classAdded: fails when class absent", () => {
  const engine = createJSEngine({ code: "", html: "<html><body><div id='box'></div></body></html>" });
  const result = runDom(engine, makeReq("a9", {
    type: "dom", assertion: "classAdded", selector: "#box", className: "active",
  }));
  assert(!result.passed, "should fail");
  assert(result.message.includes('"active"'), "message should mention class");
});

test("classRemoved: passes when class removed by script", () => {
  const engine = createJSEngine({
    code: "document.getElementById('box').classList.remove('hidden');",
    html: "<html><body><div id='box' class='hidden'></div></body></html>",
  });
  const result = runDom(engine, makeReq("a10", {
    type: "dom", assertion: "classRemoved", selector: "#box", className: "hidden",
  }));
  assert(result.passed, "should pass");
});

test("classRemoved: fails when class still present", () => {
  const engine = createJSEngine({ code: "", html: "<html><body><div id='box' class='hidden'></div></body></html>" });
  const result = runDom(engine, makeReq("a11", {
    type: "dom", assertion: "classRemoved", selector: "#box", className: "hidden",
  }));
  assert(!result.passed, "should fail");
});

test("elementCreated: passes with tagName inside parent", () => {
  const engine = createJSEngine({
    code: "const li = document.createElement('li'); document.querySelector('ul').appendChild(li);",
    html: "<html><body><ul></ul></body></html>",
  });
  const result = runDom(engine, makeReq("a12", {
    type: "dom", assertion: "elementCreated", tagName: "li", parent: "ul",
  }));
  assert(result.passed, "should pass");
});

test("elementCreated: passes with selector", () => {
  const engine = createJSEngine({
    code: "const p = document.createElement('p'); document.body.appendChild(p);",
    html: "<html><body></body></html>",
  });
  const result = runDom(engine, makeReq("a13", {
    type: "dom", assertion: "elementCreated", selector: "p",
  }));
  assert(result.passed, "should pass");
});

test("multiple DOM assertions in one lab share the same DOM", async () => {
  const labDir = createTempLab({
    html: `
      <!DOCTYPE html><html><body>
        <div id="status">idle</div>
        <script>
          document.getElementById('status').textContent = 'done';
          document.getElementById('status').classList.add('finished');
          const extra = document.createElement('section');
          extra.id = 'created';
          document.body.appendChild(extra);
        </script>
      </body></html>
    `,
    requirements: [
      makeReq("m1", { type: "dom", assertion: "textUpdated", selector: "#status", value: "done" }),
      makeReq("m2", { type: "dom", assertion: "classAdded", selector: "#status", className: "finished" }),
      makeReq("m3", { type: "dom", assertion: "elementExists", selector: "#created" }),
    ],
  });
  try {
    const results = await runLab(labDir);
    assert(results.summary().failed === 0, "all DOM assertions should pass against one jsdom instance");
  } finally {
    removeTempLab(labDir);
  }
});

console.log("\n");
