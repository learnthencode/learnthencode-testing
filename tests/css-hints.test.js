import { getCSSHint } from "../src/hints/css.js";

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

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || ""} expected "${expected}", got "${actual}"`);
  }
}

console.log("\nCSS Hints Tests\n");

test("getCSSHint returns flexbox hint", () => {
  const req = { check: { assertion: "flexbox" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("Flexbox"), `hint should mention Flexbox, got: ${hint}`);
});

test("getCSSHint returns grid hint", () => {
  const req = { check: { assertion: "grid" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("Grid"), `hint should mention Grid, got: ${hint}`);
});

test("getCSSHint returns visibility hint", () => {
  const req = { check: { assertion: "hidden" } };
  const hint = getCSSHint(req);
  assert(hint, "should return a hint");
});

test("getCSSHint returns property-specific hint for color", () => {
  const req = { check: { property: "color" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("color"), `hint should mention color, got: ${hint}`);
});

test("getCSSHint returns property-specific hint for font-size", () => {
  const req = { check: { property: "font-size" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("font-size"), `hint should mention font-size, got: ${hint}`);
});

test("getCSSHint returns property-specific hint for display", () => {
  const req = { check: { property: "display" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("display"), `hint should mention display, got: ${hint}`);
});

test("getCSSHint returns property-specific hint for margin", () => {
  const req = { check: { property: "margin" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("margin"), `hint should mention margin, got: ${hint}`);
});

test("getCSSHint returns property-specific hint for padding", () => {
  const req = { check: { property: "padding" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("padding"), `hint should mention padding, got: ${hint}`);
});

test("getCSSHint returns generic hint for unknown property", () => {
  const req = { check: { property: "some-obscure-prop", selector: ".foo" } };
  const hint = getCSSHint(req);
  assert(hint && hint.includes("some-obscure-prop"), `hint should mention property, got: ${hint}`);
});

test("getCSSHint returns null for no matching hint", () => {
  const req = { check: {} };
  const hint = getCSSHint(req);
  assert(hint === null, "should return null for empty check");
});

console.log("\n");
