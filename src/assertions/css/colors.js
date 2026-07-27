import { expect } from "../expect.js";
import { queryElement } from "../../providers/css-renderer.js";
import { normalizeColor } from "./normalize.js";

export function colorAssertion(window, requirement) {
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
    const normExpected = normalizeColor(value);
    const normActual = normalizeColor(actualValue);
    const passed = normExpected === normActual;

    return expect({
      requirement,
      condition: passed,
      message: passed
        ? ""
        : `Expected ${kebabProp}: ${value} on "${selector}", but received: ${actualValue || "(not set)"}.`,
    });
  }

  const colorProps = {
    "text-color": "color",
    "background-color": "background-color",
    "background": "background",
  };

  const failures = [];

  for (const [checkKey, cssProp] of Object.entries(colorProps)) {
    const expectedVal = check[checkKey];
    if (expectedVal !== undefined) {
      const actualValue = computed.getPropertyValue(cssProp);
      const normExpected = normalizeColor(expectedVal);
      const normActual = normalizeColor(actualValue);
      if (normExpected !== normActual) {
        failures.push(
          `  ${cssProp}: expected "${expectedVal}", received "${actualValue || "(not set)"}"`
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
      : `Color mismatches for "${selector}":\n${failures.join("\n")}`,
  });
}
