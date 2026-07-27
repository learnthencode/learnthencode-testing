import { normalizeColor, normalizeFontWeight, normalizeCSSValue, valuesEqual } from "../src/assertions/css/normalize.js";

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

console.log("\nCSS Value Normalization Tests\n");

// Color normalization
test("normalizeColor: named color red -> #ff0000", () => {
  assertEqual(normalizeColor("red"), "#ff0000");
});

test("normalizeColor: hex #ff0000 stays #ff0000", () => {
  assertEqual(normalizeColor("#ff0000"), "#ff0000");
});

test("normalizeColor: rgb(255, 0, 0) -> #ff0000", () => {
  assertEqual(normalizeColor("rgb(255, 0, 0)"), "#ff0000");
});

test("normalizeColor: uppercase hex normalized", () => {
  assertEqual(normalizeColor("#FF0000"), "#ff0000");
});

test("normalizeColor: blue -> #0000ff", () => {
  assertEqual(normalizeColor("blue"), "#0000ff");
});

test("normalizeColor: rgb(0, 0, 255) -> #0000ff", () => {
  assertEqual(normalizeColor("rgb(0, 0, 255)"), "#0000ff");
});

test("normalizeColor: green -> #008000", () => {
  assertEqual(normalizeColor("green"), "#008000");
});

test("normalizeColor: white -> #ffffff", () => {
  assertEqual(normalizeColor("white"), "#ffffff");
});

test("normalizeColor: black -> #000000", () => {
  assertEqual(normalizeColor("black"), "#000000");
});

test("normalizeColor: transparent -> #00000000", () => {
  assertEqual(normalizeColor("transparent"), "#00000000");
});

test("normalizeColor: null returns null", () => {
  assert(normalizeColor(null) === null, "should be null");
});

test("normalizeColor: undefined returns null", () => {
  assert(normalizeColor(undefined) === null, "should be null");
});

test("normalizeColor: rgb(128, 128, 128) -> #808080", () => {
  assertEqual(normalizeColor("rgb(128, 128, 128)"), "#808080");
});

test("normalizeColor: hex shorthand #abc -> #aabbcc", () => {
  assertEqual(normalizeColor("#abc"), "#aabbcc");
});

test("normalizeColor: hex lowercase preserved", () => {
  assertEqual(normalizeColor("#abcdef"), "#abcdef");
});

test("normalizeColor: unknown value returned as-is", () => {
  assertEqual(normalizeColor("somecolor"), "somecolor");
});

// Font weight normalization
test("normalizeFontWeight: normal -> 400", () => {
  assertEqual(normalizeFontWeight("normal"), "400");
});

test("normalizeFontWeight: bold -> 700", () => {
  assertEqual(normalizeFontWeight("bold"), "700");
});

test("normalizeFontWeight: 400 stays 400", () => {
  assertEqual(normalizeFontWeight("400"), "400");
});

test("normalizeFontWeight: null returns null", () => {
  assert(normalizeFontWeight(null) === null);
});

// General CSS value normalization
test("normalizeCSSValue: trims whitespace", () => {
  assertEqual(normalizeCSSValue("display", "  flex  "), "flex");
});

test("normalizeCSSValue: removes trailing semicolon", () => {
  assertEqual(normalizeCSSValue("display", "flex;"), "flex");
});

test("normalizeCSSValue: removes !important", () => {
  assertEqual(normalizeCSSValue("color", "red !important"), "#ff0000");
});

test("normalizeCSSValue: removes !important from non-color", () => {
  assertEqual(normalizeCSSValue("display", "flex !important"), "flex");
});

test("normalizeCSSValue: lowercases value", () => {
  assertEqual(normalizeCSSValue("display", "FLEX"), "flex");
});

test("normalizeCSSValue: returns null for null", () => {
  assert(normalizeCSSValue("color", null) === null);
});

test("normalizeCSSValue: normalizes color via normalizeColor", () => {
  assertEqual(normalizeCSSValue("color", "red"), "#ff0000");
  assertEqual(normalizeCSSValue("background-color", "rgb(255, 0, 0)"), "#ff0000");
});

test("normalizeCSSValue: normalizes font-weight", () => {
  assertEqual(normalizeCSSValue("font-weight", "bold"), "700");
});

// valuesEqual comparison
test("valuesEqual: identical strings match", () => {
  assert(valuesEqual("display", "flex", "flex"), "flex should match flex");
});

test("valuesEqual: case-insensitive match", () => {
  assert(valuesEqual("display", "FLEX", "flex"), "should be case insensitive");
});

test("valuesEqual: color named vs hex", () => {
  assert(valuesEqual("color", "red", "#ff0000"), "red == #ff0000");
});

test("valuesEqual: color named vs rgb", () => {
  assert(valuesEqual("color", "red", "rgb(255, 0, 0)"), "red == rgb()");
});

test("valuesEqual: color hex vs rgb", () => {
  assert(valuesEqual("color", "#ff0000", "rgb(255, 0, 0)"), "#ff0000 == rgb()");
});

test("valuesEqual: font-weight named vs numeric", () => {
  assert(valuesEqual("font-weight", "bold", "700"), "bold == 700");
});

test("valuesEqual: font-weight normal vs 400", () => {
  assert(valuesEqual("font-weight", "normal", "400"), "normal == 400");
});

test("valuesEqual: different values return false", () => {
  assert(!valuesEqual("display", "flex", "block"), "flex != block");
});

test("valuesEqual: null expected returns false", () => {
  assert(!valuesEqual("display", null, "flex"), "null expected returns false");
});

test("valuesEqual: null actual returns false", () => {
  assert(!valuesEqual("display", "flex", null), "null actual returns false");
});

test("valuesEqual: undefined expected returns false", () => {
  assert(!valuesEqual("display", undefined, "flex"), "undefined expected returns false");
});

console.log("\n");
