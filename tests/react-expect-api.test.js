import React from "react";
import { renderReact } from "../src/assertions/react/render.js";
import { expectReact } from "../src/assertions/react/expect.js";
import { fireEvent } from "../src/assertions/react/fire.js";
import { mockFetch, restoreFetch } from "../src/assertions/react/fetch.js";
import { withRouter } from "../src/assertions/react/router.js";

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

function Counter() {
  const [count, setCount] = React.useState(0);
  return React.createElement(
    "div",
    null,
    React.createElement("h1", null, "Counter"),
    React.createElement("p", { className: "count" }, `Count: ${count}`),
    React.createElement(
      "button",
      { onClick: () => setCount(count + 1) },
      "Add"
    )
  );
}

function Greeting({ name }) {
  return React.createElement("p", null, `Hello, ${name}!`);
}

console.log("\nReact Expect API Tests\n");

test("expectReact exposes all builder methods", async () => {
  const view = await renderReact(Counter);
  try {
    const builder = expectReact(view);
    for (const method of [
      "toBeRendered",
      "toHaveText",
      "toHaveElement",
      "toHaveRole",
      "toHaveLabel",
      "toHavePlaceholder",
      "toHaveButton",
      "toHaveHeading",
      "toHaveLink",
      "toHaveImage",
      "toHaveList",
      "toHaveForm",
      "toHaveCount",
    ]) {
      assert(
        typeof builder[method] === "function",
        `${method} should exist on the builder`
      );
    }
  } finally {
    await view.unmount();
  }
});

test("renderReact handle queries the rendered output", async () => {
  const view = await renderReact(Counter);
  try {
    assert(view.textContent().includes("Count: 0"), "initial text");
    assert(view.querySelector("button"), "button via querySelector");
    assert(view.getByText("Count: 0"), "getByText");
    assert(view.getByRole("button", "Add"), "getByRole with name");
    assert(view.getByRole("heading", "Counter"), "getByRole heading");
  } finally {
    await view.unmount();
  }
});

test("fireEvent.click updates state in the standalone handle", async () => {
  const view = await renderReact(Counter);
  try {
    const button = view.getByRole("button", "Add");
    await fireEvent.click(button);
    assert(view.textContent().includes("Count: 1"), "count updated");
  } finally {
    await view.unmount();
  }
});

test("props are passed through renderReact", async () => {
  const view = await renderReact(Greeting, { name: "Ada" });
  try {
    assert(view.getByText("Hello, Ada!"), "greeting with prop");
  } finally {
    await view.unmount();
  }
});

test("mockFetch/restoreFetch work against the standalone environment", async () => {
  mockFetch({ "/api/data": { body: [{ id: 1, name: "Alice" }] } });
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    assert(Array.isArray(data) && data[0].name === "Alice", "mocked body");
  } finally {
    restoreFetch();
  }
});

test("withRouter wraps a component in MemoryRouter", async () => {
  function Routed() {
    return React.createElement("p", null, "in router");
  }
  const Wrapped = withRouter(Routed);
  const view = await renderReact(Wrapped);
  try {
    assert(view.getByText("in router"), "rendered inside MemoryRouter");
  } finally {
    await view.unmount();
  }
});

test("expectReact throws with clear messages on failure", async () => {
  const view = await renderReact(Greeting, { name: "Ada" });
  try {
    let threw = null;
    try {
      expectReact(view).toHaveText("Goodbye");
    } catch (e) {
      threw = e;
    }
    assert(threw instanceof Error, "should throw");
    assert(threw.message.includes("Goodbye"), threw.message);
  } finally {
    await view.unmount();
  }
});

test("expectReact passes for valid expectations", async () => {
  const view = await renderReact(Counter);
  try {
    expectReact(view).toBeRendered();
    expectReact(view).toHaveText("Count: 0");
    expectReact(view).toHaveElement(".count");
    expectReact(view).toHaveRole("button", "Add");
    expectReact(view).toHaveHeading("Counter");
    expectReact(view).toHaveButton("Add");
    expectReact(view).toHaveCount(".count", 1);
  } finally {
    await view.unmount();
  }
});

await run();
