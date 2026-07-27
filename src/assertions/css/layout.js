import { expect } from "../expect.js";
import { queryElement } from "../../providers/css-renderer.js";
import { valuesEqual } from "./normalize.js";

const LAYOUT_PROPS = [
  "display",
  "position",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "overflow",
  "overflow-x",
  "overflow-y",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "float",
  "clear",
  "box-sizing",
];

export function layoutAssertion(window, requirement) {
  const { check } = requirement;
  const { selector, property, value, index = 0 } = check;

  const element = queryElement(window, selector, index);
  if (!element) {
    return expect({
      requirement,
      condition: false,
      message: `Could not find element matching "${selector}".`,
    });
  }

  const computed = window.getComputedStyle(element);

  if (property && value) {
    const kebabProp = property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase();
    const actualValue = computed.getPropertyValue(kebabProp);
    const passed = valuesEqual(kebabProp, value, actualValue);

    return expect({
      requirement,
      condition: passed,
      message: passed
        ? ""
        : `Expected ${kebabProp}: ${value} on "${selector}", but received: ${actualValue || "(not set)"}.`,
    });
  }

  const failures = [];

  for (const prop of LAYOUT_PROPS) {
    const expectedVal = check[prop];
    if (expectedVal !== undefined) {
      const actualValue = computed.getPropertyValue(prop);
      if (!valuesEqual(prop, expectedVal, actualValue)) {
        failures.push(
          `  ${prop}: expected "${expectedVal}", received "${actualValue || "(not set)"}"`
        );
      }
    }
  }

  const passed = failures.length === 0;

  return expect({
    requirement,
    condition: passed,
    message: passed
      ? ""
      : `Layout mismatches for "${selector}":\n${failures.join("\n")}`,
  });
}
