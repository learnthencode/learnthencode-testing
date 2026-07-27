import { renderCSS } from "../src/providers/css-renderer.js";
import { toUseFlexbox, flexAssertion } from "../src/assertions/css/flexbox.js";
import { toUseGrid, gridAssertion } from "../src/assertions/css/grid.js";
import { typographyAssertion } from "../src/assertions/css/typography.js";
import { colorAssertion } from "../src/assertions/css/colors.js";
import { spacingAssertion } from "../src/assertions/css/spacing.js";
import { layoutAssertion } from "../src/assertions/css/layout.js";
import { borderAssertion } from "../src/assertions/css/borders.js";
import { visibilityAssertion } from "../src/assertions/css/visibility.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB_DIR = path.resolve(__dirname, "..", "test-lab-css");
const HTML_PATH = path.join(LAB_DIR, "starter", "index.html");

const HTML = `<!DOCTYPE html>
<html><head>
  <style>
    .flex-container { display: flex; justify-content: center; align-items: center; }
    .inline-flex { display: inline-flex; }
    .grid-container { display: grid; grid-template-columns: 1fr 1fr; }
    .inline-grid { display: inline-grid; }
    .text-element { font-size: 16px; font-family: Arial; font-weight: bold; text-align: center; }
    .color-element { color: red; background-color: blue; }
    .spaced-element { margin: 10px; padding: 20px; }
    .layout-element { display: block; position: relative; width: 100px; height: 50px; overflow: hidden; }
    .bordered-element { border: 2px solid black; border-radius: 8px; }
    .visible-element { visibility: visible; opacity: 1; display: block; }
    .hidden-display { display: none; }
    .hidden-visibility { visibility: hidden; }
    .transparent { opacity: 0; }
  </style>
</head><body>
  <div class="flex-container">Flex</div>
  <div class="inline-flex">Inline Flex</div>
  <div class="grid-container">Grid</div>
  <div class="inline-grid">Inline Grid</div>
  <p class="text-element">Text</p>
  <span class="color-element">Colors</span>
  <section class="spaced-element">Spacing</section>
  <div class="layout-element">Layout</div>
  <div class="bordered-element">Border</div>
  <div class="visible-element">Visible</div>
  <div class="hidden-display">Hidden Display</div>
  <div class="hidden-visibility">Hidden Vis</div>
  <div class="transparent">Transparent</div>
</body></html>`;

function makeReq(id, check) {
  return { id: id || "test-001", name: "Test", points: 5, hint: "Try again", check: check || {} };
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

console.log("\nCSS Specialized Assertions Tests\n");

const window = renderCSS(HTML, HTML_PATH);

// Flexbox tests
test("toUseFlexbox: passes for display: flex", () => {
  const req = makeReq("flex-001", { selector: ".flex-container", assertion: "flexbox" });
  assert(toUseFlexbox(window, req).passed, "flex container should pass");
});

test("toUseFlexbox: passes for display: inline-flex", () => {
  const req = makeReq("flex-002", { selector: ".inline-flex", assertion: "flexbox" });
  assert(toUseFlexbox(window, req).passed, "inline-flex should pass");
});

test("toUseFlexbox: fails for non-flex element", () => {
  const req = makeReq("flex-003", { selector: ".grid-container", assertion: "flexbox" });
  assert(!toUseFlexbox(window, req).passed, "grid container should not pass flex check");
});

test("toUseFlexbox: fails for missing element", () => {
  const req = makeReq("flex-004", { selector: ".missing", assertion: "flexbox" });
  assert(!toUseFlexbox(window, req).passed, "missing element should fail");
});

test("flexAssertion: passes with property+value", () => {
  const req = makeReq("flex-005", { selector: ".flex-container", property: "justify-content", value: "center" });
  assert(flexAssertion(window, req).passed, "justify-content: center should pass");
});

test("flexAssertion: fails with wrong property value", () => {
  const req = makeReq("flex-006", { selector: ".flex-container", property: "justify-content", value: "left" });
  assert(!flexAssertion(window, req).passed, "wrong justify-content should fail");
});

// Grid tests
test("toUseGrid: passes for display: grid", () => {
  const req = makeReq("grid-001", { selector: ".grid-container", assertion: "grid" });
  assert(toUseGrid(window, req).passed, "grid container should pass");
});

test("toUseGrid: passes for display: inline-grid", () => {
  const req = makeReq("grid-002", { selector: ".inline-grid", assertion: "grid" });
  assert(toUseGrid(window, req).passed, "inline-grid should pass");
});

test("toUseGrid: fails for non-grid element", () => {
  const req = makeReq("grid-003", { selector: ".flex-container", assertion: "grid" });
  assert(!toUseGrid(window, req).passed, "flex container should not pass grid check");
});

// Typography tests
test("typographyAssertion: passes with font-size", () => {
  const req = makeReq("typo-001", { selector: ".text-element", property: "font-size", value: "16px" });
  assert(typographyAssertion(window, req).passed, "font-size should pass");
});

test("typographyAssertion: passes with font-weight bold", () => {
  const req = makeReq("typo-002", { selector: ".text-element", property: "font-weight", value: "bold" });
  assert(typographyAssertion(window, req).passed, "font-weight bold should pass");
});

test("typographyAssertion: passes with text-align", () => {
  const req = makeReq("typo-003", { selector: ".text-element", property: "text-align", value: "center" });
  assert(typographyAssertion(window, req).passed, "text-align should pass");
});

test("typographyAssertion: fails with wrong font-size", () => {
  const req = makeReq("typo-004", { selector: ".text-element", property: "font-size", value: "20px" });
  assert(!typographyAssertion(window, req).passed, "wrong font-size should fail");
});

// Color assertions
test("colorAssertion: passes with color red", () => {
  const req = makeReq("clr-001", { selector: ".color-element", property: "color", value: "red" });
  assert(colorAssertion(window, req).passed, "color red should pass");
});

test("colorAssertion: passes with background-color blue", () => {
  const req = makeReq("clr-002", { selector: ".color-element", property: "background-color", value: "blue" });
  assert(colorAssertion(window, req).passed, "background blue should pass");
});

test("colorAssertion: fails with wrong color", () => {
  const req = makeReq("clr-003", { selector: ".color-element", property: "color", value: "green" });
  assert(!colorAssertion(window, req).passed, "wrong color should fail");
});

// Spacing assertions
test("spacingAssertion: passes with margin", () => {
  const req = makeReq("spc-001", { selector: ".spaced-element", property: "margin", value: "10px" });
  assert(spacingAssertion(window, req).passed, "margin 10px should pass");
});

test("spacingAssertion: passes with padding", () => {
  const req = makeReq("spc-002", { selector: ".spaced-element", property: "padding", value: "20px" });
  assert(spacingAssertion(window, req).passed, "padding 20px should pass");
});

test("spacingAssertion: fails with wrong padding", () => {
  const req = makeReq("spc-003", { selector: ".spaced-element", property: "padding", value: "5px" });
  assert(!spacingAssertion(window, req).passed, "wrong padding should fail");
});

// Layout assertions
test("layoutAssertion: passes with display", () => {
  const req = makeReq("lay-001", { selector: ".layout-element", property: "display", value: "block" });
  assert(layoutAssertion(window, req).passed, "display block should pass");
});

test("layoutAssertion: passes with position", () => {
  const req = makeReq("lay-002", { selector: ".layout-element", property: "position", value: "relative" });
  assert(layoutAssertion(window, req).passed, "position relative should pass");
});

test("layoutAssertion: passes with width", () => {
  const req = makeReq("lay-003", { selector: ".layout-element", property: "width", value: "100px" });
  assert(layoutAssertion(window, req).passed, "width 100px should pass");
});

test("layoutAssertion: passes with height", () => {
  const req = makeReq("lay-004", { selector: ".layout-element", property: "height", value: "50px" });
  assert(layoutAssertion(window, req).passed, "height 50px should pass");
});

test("layoutAssertion: passes with overflow", () => {
  const req = makeReq("lay-005", { selector: ".layout-element", property: "overflow", value: "hidden" });
  assert(layoutAssertion(window, req).passed, "overflow hidden");
});

test("layoutAssertion: fails with wrong display", () => {
  const req = makeReq("lay-006", { selector: ".layout-element", property: "display", value: "flex" });
  assert(!layoutAssertion(window, req).passed, "wrong display should fail");
});

// Border assertions
test("borderAssertion: passes with border-radius", () => {
  const req = makeReq("brd-001", { selector: ".bordered-element", property: "border-radius", value: "8px" });
  assert(borderAssertion(window, req).passed, "border-radius 8px should pass");
});

test("borderAssertion: fails with wrong border-radius", () => {
  const req = makeReq("brd-002", { selector: ".bordered-element", property: "border-radius", value: "2px" });
  assert(!borderAssertion(window, req).passed, "wrong border-radius should fail");
});

// Visibility assertions
test("visibilityAssertion: passes with display: none detection", () => {
  const req = makeReq("vis-001", { selector: ".hidden-display", assertion: "hidden" });
  assert(visibilityAssertion(window, req).passed, "display:none should be hidden");
});

test("visibilityAssertion: passes with visibility: hidden detection", () => {
  const req = makeReq("vis-002", { selector: ".hidden-visibility", assertion: "hidden" });
  assert(visibilityAssertion(window, req).passed, "visibility:hidden should be hidden");
});

test("visibilityAssertion: passes with opacity: 0 detection", () => {
  const req = makeReq("vis-003", { selector: ".transparent", assertion: "hidden" });
  assert(visibilityAssertion(window, req).passed, "opacity:0 should be hidden");
});

test("visibilityAssertion: passes visibile detection", () => {
  const req = makeReq("vis-004", { selector: ".visible-element", assertion: "visible" });
  assert(visibilityAssertion(window, req).passed, "visible element should be visible");
});

test("visibilityAssertion: fails visible for hidden element", () => {
  const req = makeReq("vis-005", { selector: ".hidden-display", assertion: "visible" });
  assert(!visibilityAssertion(window, req).passed, "hidden element should not be visible");
});

test("visibilityAssertion: checks with property+value", () => {
  const req = makeReq("vis-006", { selector: ".hidden-display", property: "display", value: "none" });
  assert(visibilityAssertion(window, req).passed, "display:none check");
});

console.log("\n");
