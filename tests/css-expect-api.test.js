import { expectCSS } from "../src/assertions/css/expect.js";

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

console.log("\nCSS Expect API Tests\n");

test("expectCSS().toHaveCSS() returns correct structure", () => {
  const result = expectCSS("h1").toHaveCSS("color", "red");
  assertEqual(result.type, "css");
  assertEqual(result.selector, "h1");
  assertEqual(result.property, "color");
  assertEqual(result.value, "red");
  assertEqual(result.index, 0);
});

test("expectCSS().toHaveStyles() returns correct structure", () => {
  const result = expectCSS(".container").toHaveStyles({
    display: "flex",
    justifyContent: "center",
  });
  assertEqual(result.type, "css-styles");
  assertEqual(result.selector, ".container");
  assert(result.styles.display === "flex");
  assert(result.styles.justifyContent === "center");
});

test("expectCSS().toUseFlexbox() works", () => {
  const result = expectCSS(".container").toUseFlexbox();
  assertEqual(result.type, "css-flexbox");
  assertEqual(result.selector, ".container");
});

test("expectCSS().toUseGrid() works", () => {
  const result = expectCSS(".grid").toUseGrid();
  assertEqual(result.type, "css-grid");
  assertEqual(result.selector, ".grid");
});

test("expectCSS().toBeVisible() works", () => {
  const result = expectCSS(".visible").toBeVisible();
  assertEqual(result.type, "css-visibility");
  assertEqual(result.assertion, "visible");
});

test("expectCSS().toBeHidden() works", () => {
  const result = expectCSS(".hidden").toBeHidden();
  assertEqual(result.type, "css-visibility");
  assertEqual(result.assertion, "hidden");
});

test("expectCSS().toHaveBackgroundColor() works", () => {
  const result = expectCSS(".box").toHaveBackgroundColor("red");
  assertEqual(result.property, "background-color");
  assertEqual(result.value, "red");
});

test("expectCSS().toHaveTextColor() works", () => {
  const result = expectCSS("h1").toHaveTextColor("blue");
  assertEqual(result.property, "color");
  assertEqual(result.value, "blue");
});

test("expectCSS().toHaveFontSize() works", () => {
  const result = expectCSS("p").toHaveFontSize("16px");
  assertEqual(result.property, "font-size");
  assertEqual(result.value, "16px");
});

test("expectCSS().toHaveFontFamily() works", () => {
  const result = expectCSS("p").toHaveFontFamily("Arial");
  assertEqual(result.property, "font-family");
  assertEqual(result.value, "Arial");
});

test("expectCSS().toHaveMargin() works", () => {
  const result = expectCSS("div").toHaveMargin("10px");
  assertEqual(result.property, "margin");
});

test("expectCSS().toHavePadding() works", () => {
  const result = expectCSS("div").toHavePadding("20px");
  assertEqual(result.property, "padding");
});

test("expectCSS().toHaveBorder() works", () => {
  const result = expectCSS("div").toHaveBorder("1px solid black");
  assertEqual(result.property, "border");
});

test("expectCSS().toHaveBorderRadius() works", () => {
  const result = expectCSS("div").toHaveBorderRadius("4px");
  assertEqual(result.property, "border-radius");
});

test("expectCSS().toHaveWidth() works", () => {
  const result = expectCSS("div").toHaveWidth("200px");
  assertEqual(result.property, "width");
});

test("expectCSS().toHaveHeight() works", () => {
  const result = expectCSS("div").toHaveHeight("100px");
  assertEqual(result.property, "height");
});

test("expectCSS().toHaveMaxWidth() works", () => {
  const result = expectCSS("div").toHaveMaxWidth("300px");
  assertEqual(result.property, "max-width");
});

test("expectCSS().toHaveMinWidth() works", () => {
  const result = expectCSS("div").toHaveMinWidth("50px");
  assertEqual(result.property, "min-width");
});

test("expectCSS().toHaveDisplay() works", () => {
  const result = expectCSS("div").toHaveDisplay("flex");
  assertEqual(result.property, "display");
  assertEqual(result.value, "flex");
});

test("expectCSS().toHavePosition() works", () => {
  const result = expectCSS("div").toHavePosition("absolute");
  assertEqual(result.property, "position");
  assertEqual(result.value, "absolute");
});

test("expectCSS().toHaveOverflow() works", () => {
  const result = expectCSS("div").toHaveOverflow("hidden");
  assertEqual(result.property, "overflow");
  assertEqual(result.value, "hidden");
});

test("expectCSS().atIndex() sets index", () => {
  const result = expectCSS("div").atIndex(2).toHaveDisplay("block");
  assertEqual(result.index, 2);
});

console.log("\n");
