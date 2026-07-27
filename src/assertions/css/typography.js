import { expect } from "../expect.js";
import { queryElement } from "../../providers/css-renderer.js";
import { valuesEqual, normalizeCSSValue } from "./normalize.js";

export function typographyAssertion(window, requirement) {
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

    const expectedStr = normalizeCSSValue(kebabProp, value);
    const actualStr = normalizeCSSValue(kebabProp, actualValue);

    return expect({
      requirement,
      condition: passed,
      message: passed
        ? ""
        : `Expected ${kebabProp}: "${expectedStr}" on "${selector}", but received: "${actualStr || "(not set)"}".`,
    });
  }

  const supportedChecks = [
    "font-size",
    "font-family",
    "font-weight",
    "font-style",
    "line-height",
    "text-align",
    "text-decoration",
    "text-transform",
    "letter-spacing",
    "word-spacing",
    "white-space",
  ];

  const failures = [];

  for (const prop of supportedChecks) {
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
      : `Typography mismatches for "${selector}":\n${failures.join("\n")}`,
  });
}
