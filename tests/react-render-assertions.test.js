import { createReactEngine } from "../src/core/react-engine.js";
import { reactAssertions } from "../src/assertions/react/index.js";
import {
  createReactLab,
  removeReactLab,
  COUNTER_APP_JSX,
  PROPS_APP_JSX,
  STRING_RETURN_APP_JSX,
  CLASS_APP_JSX,
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
    id: "react-render-" + subtype,
    name: "React render test",
    points: 5,
    check: { type: "react", subtype, component: "src/App.jsx", ...extra },
  };
}

async function makeEngine(files, engineOptions = {}) {
  const lab = createReactLab({ files });
  const engine = createReactEngine({ labDirectory: lab, ...engineOptions });
  return { lab, engine };
}

console.log("\nReact Render Assertion Tests\n");

test("renders passes for a JSX component", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.renders(engine, makeReq("renders"));
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("renders fails for a plain string return", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": STRING_RETURN_APP_JSX,
  });
  try {
    const res = await reactAssertions.renders(engine, makeReq("renders"));
    assert(!res.passed, "should fail");
    assert(res.message.includes("plain string"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("renders fails for a missing component file", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const req = makeReq("renders", { component: "src/Nope.jsx" });
    const res = await reactAssertions.renders(engine, req);
    assert(!res.passed, "should fail");
    assert(res.message.includes("not found"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("props passes when the prop appears in the output", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": PROPS_APP_JSX });
  try {
    const res = await reactAssertions.props(
      engine,
      makeReq("props", {
        props: { name: "Ada", job: "Engineer" },
        expect: { text: "Hello, Ada!" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("props passes with a selector-based expect", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": PROPS_APP_JSX });
  try {
    const res = await reactAssertions.props(
      engine,
      makeReq("props", {
        props: { name: "Ada", job: "Engineer" },
        expect: { selector: "h1", text: "Hello, Ada!" },
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("props fails when the prop is ignored", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": PROPS_APP_JSX });
  try {
    const res = await reactAssertions.props(
      engine,
      makeReq("props", {
        props: { name: "Ada" },
        expect: { text: "Hello, Bob!" },
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Ada"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("state passes for the initial useState value", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.state(
      engine,
      makeReq("state", { value: "Count: 0" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("state passes for a custom initial value via props", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.state(
      engine,
      makeReq("state", { props: { initial: 5 }, value: "Count: 5" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("state fails when the value is missing", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.state(
      engine,
      makeReq("state", { value: "Count: 99" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Count: 99"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasText passes for contained text", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasText(
      engine,
      makeReq("hasText", { text: "Hello, World!" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasText passes with exact match", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasText(
      engine,
      makeReq("hasText", { selector: "h1", text: "Hello, World!", match: "equals" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasText fails with a clear message", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasText(
      engine,
      makeReq("hasText", { text: "Goodbye" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Goodbye"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasElement passes for a rendered selector", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasElement(
      engine,
      makeReq("hasElement", { selector: "button" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasRole passes for button and heading roles", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const button = await reactAssertions.hasRole(
      engine,
      makeReq("hasRole", { role: "button", name: "Add" })
    );
    assert(button.passed, button.message);
    const heading = await reactAssertions.hasRole(
      engine,
      makeReq("hasRole", { role: "heading", name: "Hello, World!" })
    );
    assert(heading.passed, heading.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasRole fails when the named element is missing", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasRole(
      engine,
      makeReq("hasRole", { role: "button", name: "Delete" })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("Delete"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasLabel passes for a labelled input", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
import { useState } from "react";
export default function Form() {
  const [v, setV] = useState("");
  return (
    <div>
      <label htmlFor="name">Name</label>
      <input id="name" value={v} onChange={(e) => setV(e.target.value)} />
    </div>
  );
}
`,
  });
  try {
    const res = await reactAssertions.hasLabel(
      engine,
      makeReq("hasLabel", { label: "Name" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasPlaceholder passes for a placeholder", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function Input() {
  return <input placeholder="Search..." />;
}
`,
  });
  try {
    const res = await reactAssertions.hasPlaceholder(
      engine,
      makeReq("hasPlaceholder", { placeholder: "Search..." })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasButton passes with count", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasButton(
      engine,
      makeReq("hasButton", { count: 1 })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasButton passes by accessible name", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasButton(
      engine,
      makeReq("hasButton", { name: "Add" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasHeading passes for level and text", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.hasHeading(
      engine,
      makeReq("hasHeading", { level: 1, text: "Hello, World!" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasLink passes for text and href", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function Nav() {
  return <a href="/about">About us</a>;
}
`,
  });
  try {
    const res = await reactAssertions.hasLink(
      engine,
      makeReq("hasLink", { text: "About us", href: "/about" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasImage passes for alt text", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function Pic() {
  return <img src="cat.png" alt="A cat" />;
}
`,
  });
  try {
    const res = await reactAssertions.hasImage(
      engine,
      makeReq("hasImage", { alt: "A cat" })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasList passes for items count", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function List() {
  return (
    <ul>
      <li>one</li>
      <li>two</li>
    </ul>
  );
}
`,
  });
  try {
    const res = await reactAssertions.hasList(
      engine,
      makeReq("hasList", { items: 2 })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("hasForm passes", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function F() {
  return <form><input /></form>;
}
`,
  });
  try {
    const res = await reactAssertions.hasForm(engine, makeReq("hasForm"));
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("count passes for equals", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function List() {
  return <ul><li>a</li><li>b</li><li>c</li></ul>;
}
`,
  });
  try {
    const res = await reactAssertions.count(
      engine,
      makeReq("count", { selector: "li", equals: 3 })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("count passes for minimum", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.count(
      engine,
      makeReq("count", { selector: "p", minimum: 1 })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("count fails with expected vs found", async () => {
  const { lab, engine } = await makeEngine({ "src/App.jsx": COUNTER_APP_JSX });
  try {
    const res = await reactAssertions.count(
      engine,
      makeReq("count", { selector: "button", equals: 2 })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("found 1"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("conditional passes for present element", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function Card({ show }) {
  return (
    <div>
      <h1>Card</h1>
      {show && <p className="detail">details</p>}
    </div>
  );
}
`,
  });
  try {
    const res = await reactAssertions.conditional(
      engine,
      makeReq("conditional", {
        props: { show: true },
        selector: ".detail",
        visible: true,
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("conditional passes for absent element", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function Card({ show }) {
  return (
    <div>
      <h1>Card</h1>
      {show && <p className="detail">details</p>}
    </div>
  );
}
`,
  });
  try {
    const res = await reactAssertions.conditional(
      engine,
      makeReq("conditional", {
        props: { show: false },
        selector: ".detail",
        visible: false,
      })
    );
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("conditional fails when the element is present but should not be", async () => {
  const { lab, engine } = await makeEngine({
    "src/App.jsx": `
export default function Card({ show }) {
  return (
    <div>
      <h1>Card</h1>
      {show && <p className="detail">details</p>}
    </div>
  );
}
`,
  });
  try {
    const res = await reactAssertions.conditional(
      engine,
      makeReq("conditional", {
        props: { show: true },
        selector: ".detail",
        visible: false,
      })
    );
    assert(!res.passed, "should fail");
    assert(res.message.includes("NOT to be rendered"), res.message);
  } finally {
    removeReactLab(lab);
  }
});

test("class components are rejected by renders assertion? (allowed: renders fine)", async () => {
  // Class components are valid React; the framework only requires them in
  // the functionComponent check. Rendering them must still work.
  const { lab, engine } = await makeEngine({ "src/App.jsx": CLASS_APP_JSX });
  try {
    const res = await reactAssertions.renders(engine, makeReq("renders"));
    assert(res.passed, res.message);
  } finally {
    removeReactLab(lab);
  }
});

await run();
