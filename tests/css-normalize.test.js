import { normalizeColor, normalizeFontWeight, normalizeCSSValue, normalizeLength, valuesEqual } from "../src/assertions/css/normalize.js";

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

// Length normalization
test("normalizeLength: single px value unchanged", () => {
  assertEqual(normalizeLength("20px"), "20px");
});

test("normalizeLength: bare number gets px", () => {
  assertEqual(normalizeLength("20"), "20px");
});

test("normalizeLength: zero becomes 0px", () => {
  assertEqual(normalizeLength("0"), "0px");
});

test("normalizeLength: zero px stays 0px", () => {
  assertEqual(normalizeLength("0px"), "0px");
});

test("normalizeLength: margin shorthand 20px 0", () => {
  assertEqual(normalizeLength("20px 0"), "20px 0px");
});

test("normalizeLength: padding shorthand 10px 0", () => {
  assertEqual(normalizeLength("10px 0"), "10px 0px");
});

test("normalizeLength: padding shorthand 10px 0 5px", () => {
  assertEqual(normalizeLength("10px 0 5px"), "10px 0px 5px");
});

test("normalizeLength: margin 4-value shorthand", () => {
  assertEqual(normalizeLength("0 10px 0 10px"), "0px 10px 0px 10px");
});

test("normalizeLength: non-px unit preserved", () => {
  assertEqual(normalizeLength("2em"), "2em");
  assertEqual(normalizeLength("50%"), "50%");
});

test("normalizeLength: keyword preserved", () => {
  assertEqual(normalizeLength("auto"), "auto");
  assertEqual(normalizeLength("inherit"), "inherit");
});

test("normalizeLength: null returns null", () => {
  assert(normalizeLength(null) === null);
});

// Integration: normalizeCSSValue with length properties
test("normalizeCSSValue: margin shorthand normalized", () => {
  assertEqual(normalizeCSSValue("margin", "20px 0"), "20px 0px");
});

test("normalizeCSSValue: padding shorthand normalized", () => {
  assertEqual(normalizeCSSValue("padding", "10px 0"), "10px 0px");
});

test("normalizeCSSValue: border-width normalized", () => {
  assertEqual(normalizeCSSValue("border-width", "1px 0"), "1px 0px");
});

test("normalizeCSSValue: border-radius normalized", () => {
  assertEqual(normalizeCSSValue("border-radius", "0"), "0px");
});

test("normalizeCSSValue: non-length property unchanged", () => {
  assertEqual(normalizeCSSValue("display", "flex"), "flex");
});

// Integration: valuesEqual with length properties
test("valuesEqual: margin 20px 0 equals 20px 0px", () => {
  assert(valuesEqual("margin", "20px 0", "20px 0px"), "margin 20px 0 should equal 20px 0px");
});

test("valuesEqual: padding 10px 0 equals 10px 0px", () => {
  assert(valuesEqual("padding", "10px 0", "10px 0px"), "padding 10px 0 should equal 10px 0px");
});

test("valuesEqual: margin 0 10px 0 10px equals 0px 10px 0px 10px", () => {
  assert(valuesEqual("margin", "0 10px 0 10px", "0px 10px 0px 10px"), "margin shorthand should match");
});

test("valuesEqual: existing color normalization still passes", () => {
  assert(valuesEqual("color", "red", "#ff0000"), "red == #ff0000");
  assert(valuesEqual("color", "red", "rgb(255, 0, 0)"), "red == rgb()");
  assert(valuesEqual("background-color", "white", "rgb(255, 255, 255)"), "white == rgb(255,255,255)");
});

test("valuesEqual: existing font-weight normalization still passes", () => {
  assert(valuesEqual("font-weight", "bold", "700"), "bold == 700");
  assert(valuesEqual("font-weight", "normal", "400"), "normal == 400");
});

test("valuesEqual: non-length mismatches still fail", () => {
  assert(!valuesEqual("margin", "20px", "10px"), "20px != 10px");
  assert(!valuesEqual("display", "flex", "block"), "flex != block");
});

console.log("\n");
