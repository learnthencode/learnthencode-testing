import { renderCSS, queryElement, getComputedStyle, setViewport } from "../src/providers/css-renderer.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB_DIR = path.resolve(__dirname, "..", "test-lab-css");
const HTML_PATH = path.join(LAB_DIR, "starter", "index.html");

function makeHTML(body, style) {
  return `<!DOCTYPE html>
<html><head>${style ? `<style>${style}</style>` : ""}</head><body>${body}</body></html>`;
}

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

console.log("\nCSS Renderer Tests\n");

test("renders HTML and creates window", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>"), HTML_PATH);
  assert(w && w.document, "window should exist");
});

test("querySelector finds elements", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>"), HTML_PATH);
  const h1 = queryElement(w, "h1");
  assert(h1, "h1 should exist");
  assertEqual(h1.textContent.trim(), "Hello");
});

test("querySelector returns null for missing elements", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>"), HTML_PATH);
  const missing = queryElement(w, ".nonexistent");
  assert(missing === null, "should return null");
});

test("querySelector with index works", () => {
  const w = renderCSS(makeHTML("<span>A</span><span>B</span>"), HTML_PATH);
  const second = queryElement(w, "span", 1);
  assert(second, "second span should exist");
  assertEqual(second.textContent.trim(), "B");
});

test("getComputedStyle returns style object for element", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>", "h1 { color: red; }"), HTML_PATH);
  const h1 = queryElement(w, "h1");
  const style = w.getComputedStyle(h1);
  assert(style, "should return style");
  assert(typeof style.getPropertyValue === "function", "should have getPropertyValue");
});

test("getComputedStyle reads embedded style", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>", "h1 { color: red; }"), HTML_PATH);
  const style = w.getComputedStyle(queryElement(w, "h1"));
  const color = style.getPropertyValue("color");
  assert(color === "red" || color.includes("red") || color.includes("255, 0, 0"),
    `color should be red, got "${color}"`);
});

test("getComputedStyle reads inline styles", () => {
  const w = renderCSS(makeHTML('<p style="color: blue;">Text</p>'), HTML_PATH);
  const style = getComputedStyle(w, "p");
  const color = style.getPropertyValue("color");
  assert(color === "blue" || color.includes("blue") || color.includes("0, 0, 255"),
    `color should be blue, got "${color}"`);
});

test("getComputedStyle reads flex display", () => {
  const w = renderCSS(makeHTML('<div class="flex">Flex</div>', ".flex { display: flex; }"), HTML_PATH);
  const style = getComputedStyle(w, ".flex");
  const display = style.getPropertyValue("display");
  assertEqual(display, "flex");
});

test("getComputedStyle returns null for missing selector", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>"), HTML_PATH);
  const style = getComputedStyle(w, ".nonexistent");
  assert(style === null, "should be null");
});

test("setViewport changes innerWidth", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>"), HTML_PATH);
  setViewport(w, 375, 667);
  assertEqual(w.innerWidth, 375);
  assertEqual(w.innerHeight, 667);
});

test("setViewport changes to different size", () => {
  const w = renderCSS(makeHTML("<h1>Hello</h1>"), HTML_PATH);
  setViewport(w, 1024, 768);
  assertEqual(w.innerWidth, 1024);
});

test("renderCSS loads external stylesheet", () => {
  const htmlWithLink = `<!DOCTYPE html>
<html><head>
  <link rel="stylesheet" href="style.css">
</head><body>
  <h1 class="title">Test</h1>
</body></html>`;
  const w = renderCSS(htmlWithLink, HTML_PATH);
  const style = getComputedStyle(w, ".title");
  assert(style, "should get style");
  const textAlign = style.getPropertyValue("text-align");
  assertEqual(textAlign, "center");
});

test("renderCSS throws for missing stylesheet", () => {
  const htmlWithBadLink = `<!DOCTYPE html>
<html><head>
  <link rel="stylesheet" href="nonexistent.css">
</head><body><h1>Test</h1></body></html>`;
  let threw = false;
  try {
    renderCSS(htmlWithBadLink, HTML_PATH);
  } catch (e) {
    threw = true;
  }
  assert(threw, "should throw for missing stylesheet");
});

console.log("\n");
