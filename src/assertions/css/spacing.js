import { expect } from "../expect.js";
import { queryElement } from "../../providers/css-renderer.js";
import { valuesEqual } from "./normalize.js";

const SPACING_PROPS = [
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
];

export function spacingAssertion(window, requirement) {
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

  for (const prop of SPACING_PROPS) {
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
      : `Spacing mismatches for "${selector}":\n${failures.join("\n")}`,
  });
}
