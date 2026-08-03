import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import {
  createReactLab,
  removeReactLab,
  COUNTER_APP_JSX,
  FORM_APP_JSX,
  CHECKBOX_APP_JSX,
  SELECT_APP_JSX,
  RESET_APP_JSX,
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

function makeReq(subtype, extra = {}) {
  return {
    id: "react-int-" + subtype,
    name: "React interaction test",
    points: 5,
    check: { type: "react", subtype, component: "src/App.jsx", ...extra },
  };
}

async function makeEngine(files) {
  const lab = createReactLab({ files });
  const engine = createReactEngine({ labDirectory: lab });
  return { lab, engine };
}

console.log("\nReact Interaction Assertion Tests\n");

test("click passes when state updates", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        selector: "button",
        expect: { text: "Count: 1" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("click passes with a selector-based expect", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        selector: "button",
        expect: { selector: ".count", text: "Count: 1" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("click fails when state does not change", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        selector: "button",
        expect: { text: "Count: 5" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Count: 5"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("click fails when the selector is missing", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        selector: ".nope",
        expect: { text: "Count: 1" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("not be found") || res.message.includes("was not found"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("type passes for a controlled input", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": FORM_APP_JSX });
  try {
    const res = await reactAssertions.type(
      engine,
      makeReq("type", {
        selector: "#name",
        value: "Ada",
        expect: { selector: "#name", value: "Ada" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("change passes for a checkbox", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CHECKBOX_APP_JSX });
  try {
    const res = await reactAssertions.change(
      engine,
      makeReq("change", {
        selector: "#agree",
        checked: true,
        expect: { text: "Agreed" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("change fails when the checkbox state is ignored", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": CHECKBOX_APP_JSX });
  try {
    const res = await reactAssertions.change(
      engine,
      makeReq("change", {
        selector: "#agree",
        checked: true,
        expect: { text: "Something else" },
      })
    );
    assert(!res.passed, "should fail");
  } finally {
    removeReactLab(lab);
  }
});

test("select passes for an option", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": SELECT_APP_JSX });
  try {
    const res = await reactAssertions.select(
      engine,
      makeReq("select", {
        selector: "#color",
        value: "blue",
        expect: { text: "Chosen: blue" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("submit passes after filling the form", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": FORM_APP_JSX });
  try {
    const res = await reactAssertions.submit(
      engine,
      makeReq("submit", {
        values: { "#name": "Ada" },
        expect: { text: "Submitted: Ada" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("submit fails when the submitted value is wrong", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": FORM_APP_JSX });
  try {
    const res = await reactAssertions.submit(
      engine,
      makeReq("submit", {
        values: { "#name": "Ada" },
        expect: { text: "Submitted: Bob" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Submitted: Bob"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("submit fails without a form", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.submit(
      engine,
      makeReq("submit", { expect: { text: "x" } })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("form"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("reset passes after clearing the input", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": RESET_APP_JSX });
  try {
    const res = await reactAssertions.reset(
      engine,
      makeReq("reset", {
        selector: "input",
        value: "typed text",
        resetSelector: "button",
        expect: { text: "empty" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("interaction errors surface as failures", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
import { useState } from "react";
export default function Bad() {
  const [n, setN] = useState(0);
  return (
    <button onClick={() => { setN(n + 1); throw new Error("boom"); }}>
      {n}
    </button>
  );
}
`,
  });
  try {
    const res = await reactAssertions.click(
      engine,
      makeReq("click", {
        selector: "button",
        expect: { text: "1" },
      })
    );
    assert(!res.passed, "should fail when the handler throws");
  } finally {
    removeReactLab(lab);
  }
});

await run();
