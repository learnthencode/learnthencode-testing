import { executeRequirement } from "../src/core/execute-requirements.js";
import { renderCSS, setViewport } from "../src/providers/css-renderer.js";
import { runAtViewport } from "../src/assertions/css/responsive.js";
import { toHaveCSS } from "../src/assertions/css/base.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB_DIR = path.resolve(__dirname, "..", "test-lab-css");
const HTML_PATH = path.join(LAB_DIR, "starter", "index.html");

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

console.log("\nIntegration Tests\n");

// Test: executeRequirement with CSS type
test("executeRequirement handles css type", () => {
  const html = '<h1 style="color: red;">Hello</h1>';
  const req = {
    id: "int-001",
    name: "Test",
    points: 5,
    check: { type: "css", selector: "h1", property: "color", value: "red" },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, `CSS assertion via executeRequirement should pass: ${result.message}`);
});

test("executeRequirement handles css type with embedded style", () => {
  const html = '<html><head><style>h1 { color: green; }</style></head><body><h1>Hello</h1></body></html>';
  const req = {
    id: "int-002",
    name: "Test",
    points: 5,
    check: { type: "css", selector: "h1", property: "color", value: "green" },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, `Embedded style should pass: ${result.message}`);
});

test("executeRequirement handles css type with grouped styles", () => {
  const html = '<html><head><style>.c { display: flex; justify-content: center; }</style></head><body><div class="c">X</div></body></html>';
  const req = {
    id: "int-003",
    name: "Test",
    points: 5,
    check: { type: "css", selector: ".c", styles: { display: "flex", justifyContent: "center" } },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, `Grouped styles should pass: ${result.message}`);
});

test("executeRequirement handles css type with flexbox assertion", () => {
  const html = '<html><head><style>.f { display: flex; }</style></head><body><div class="f">X</div></body></html>';
  const req = {
    id: "int-004",
    name: "Test",
    points: 5,
    check: { type: "css", selector: ".f", assertion: "flexbox" },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, `Flexbox assertion should pass: ${result.message}`);
});

test("executeRequirement handles css type with grid assertion", () => {
  const html = '<html><head><style>.g { display: grid; }</style></head><body><div class="g">X</div></body></html>';
  const req = {
    id: "int-005",
    name: "Test",
    points: 5,
    check: { type: "css", selector: ".g", assertion: "grid" },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, `Grid assertion should pass: ${result.message}`);
});

test("executeRequirement handles css type with visibility assertion", () => {
  const html = '<html><head><style>.h { display: none; }</style></head><body><div class="h">X</div></body></html>';
  const req = {
    id: "int-006",
    name: "Test",
    points: 5,
    check: { type: "css", selector: ".h", assertion: "visibility", property: "display", value: "none" },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, `Visibility assertion should pass: ${result.message}`);
});

test("executeRequirement returns failure for wrong CSS value", () => {
  const html = '<h1 style="color: red;">Hello</h1>';
  const req = {
    id: "int-007",
    name: "Test",
    points: 5,
    check: { type: "css", selector: "h1", property: "color", value: "blue" },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(!result.passed, "Wrong color should fail");
});

// Test: CSS + HTML assertions coexist
test("HTML element assertion still works with executeRequirement", () => {
  const html = '<h1>Hello</h1>';
  const req = {
    id: "int-008",
    name: "Test",
    points: 5,
    check: { type: "element", selector: "h1" },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, "HTML element assertion should still work");
});

test("HTML count assertion still works with executeRequirement", () => {
  const html = '<p>A</p><p>B</p>';
  const req = {
    id: "int-009",
    name: "Test",
    points: 5,
    check: { type: "count", selector: "p", equals: 2 },
  };
  const result = executeRequirement(req, html, HTML_PATH);
  assert(result.passed, "HTML count assertion should still work");
});

// Test: responsive viewport
test("runAtViewport changes viewport and runs assertion", () => {
  const html = `<!DOCTYPE html>
<html><head>
  <style>
    .navbar { display: flex; flex-direction: row; }
    @media (max-width: 600px) {
      .navbar { flex-direction: column; }
    }
  </style>
</head><body><div class="navbar">Nav</div></body></html>`;

  const window = renderCSS(html, HTML_PATH);

  setViewport(window, 375, 667);
  const styleMobile = window.getComputedStyle(window.document.querySelector(".navbar"));
  const mobileFlexDir = styleMobile.getPropertyValue("flex-direction");

  setViewport(window, 1024, 768);
  const styleDesktop = window.getComputedStyle(window.document.querySelector(".navbar"));
  const desktopFlexDir = styleDesktop.getPropertyValue("flex-direction");

  assert(typeof mobileFlexDir === "string", "mobile flex-direction should exist");
  assert(typeof desktopFlexDir === "string", "desktop flex-direction should exist");
});

console.log("\n");
