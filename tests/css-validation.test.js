import { validateRequirement } from "../src/core/validate-requirement.js";

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

function assertThrows(fn, msg) {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) throw new Error(msg || "Expected function to throw");
}

console.log("\nCSS Validation Tests\n");

test("validateRequirement accepts valid CSS property assertion", () => {
  validateRequirement({
    id: "css-001",
    name: "Test",
    points: 5,
    check: { type: "css", selector: "h1", property: "color", value: "red" },
  });
});

test("validateRequirement accepts valid CSS styles assertion", () => {
  validateRequirement({
    id: "css-002",
    name: "Test",
    points: 5,
    check: { type: "css", selector: ".container", styles: { display: "flex" } },
  });
});

test("validateRequirement accepts valid CSS assertion type assertion", () => {
  validateRequirement({
    id: "css-003",
    name: "Test",
    points: 5,
    check: { type: "css", selector: ".flex", assertion: "flexbox" },
  });
});

test("validateRequirement throws for CSS without selector", () => {
  assertThrows(() => {
    validateRequirement({
      id: "css-004",
      name: "Test",
      points: 5,
      check: { type: "css", property: "color", value: "red" },
    });
  }, "CSS without selector should throw");
});

test("validateRequirement throws for CSS without property, styles, or assertion", () => {
  assertThrows(() => {
    validateRequirement({
      id: "css-005",
      name: "Test",
      points: 5,
      check: { type: "css", selector: "h1" },
    });
  }, "CSS without property/styles/assertion should throw");
});

test("validateRequirement still accepts HTML assertions", () => {
  validateRequirement({
    id: "html-001",
    name: "Test",
    points: 5,
    check: { type: "element", selector: "h1" },
  });
});

test("validateRequirement still accepts HTML attribute assertions", () => {
  validateRequirement({
    id: "html-002",
    name: "Test",
    points: 5,
    check: { type: "attribute", selector: "img", attribute: "alt" },
  });
});

console.log("\n");
