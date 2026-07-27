import { expect } from "../expect.js";
import {
  getComputedStyle,
  queryElement,
} from "../../providers/css-renderer.js";
import { valuesEqual, normalizeCSSValue } from "./normalize.js";

const CAMEL_TO_KEBAB = {};

function camelToKebab(prop) {
  if (CAMEL_TO_KEBAB[prop]) return CAMEL_TO_KEBAB[prop];
  const result = prop
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase();
  CAMEL_TO_KEBAB[prop] = result;
  return result;
}

export function toHaveCSS(window, requirement) {
  const { check } = requirement;
  const { selector, property, value, index = 0 } = check;

  const kebabProperty = camelToKebab(property);
  const element = queryElement(window, selector, index);

  if (!element) {
    return expect({
      requirement,
      condition: false,
      message: `Could not find element matching "${selector}".`,
    });
  }

  const computed = window.getComputedStyle(element);
  const actualValue = computed.getPropertyValue(kebabProperty);

  const passed = valuesEqual(kebabProperty, value, actualValue);

  const expectedStr = `${kebabProperty}: ${value}`;
  const actualStr = `${kebabProperty}: ${actualValue || "(not set)"}`;

  return expect({
    requirement,
    condition: passed,
    message: `Expected:\n\n  ${expectedStr}\n\nReceived:\n\n  ${actualStr}`,
  });
}

export function toHaveStyles(window, requirement) {
  const { check } = requirement;
  const { selector, styles, index = 0 } = check;

  const element = queryElement(window, selector, index);
  if (!element) {
    return expect({
      requirement,
      condition: false,
      message: `Could not find element matching "${selector}".`,
    });
  }

  const computed = window.getComputedStyle(element);
  const failures = [];

  for (const [prop, expectedValue] of Object.entries(styles)) {
    const kebabProp = camelToKebab(prop);
    const actualValue = computed.getPropertyValue(kebabProp);
    if (!valuesEqual(kebabProp, expectedValue, actualValue)) {
      const normExpected = normalizeCSSValue(kebabProp, expectedValue);
      const normActual = normalizeCSSValue(kebabProp, actualValue);
      failures.push(
        `  ${kebabProp}: expected "${normExpected}", received "${normActual || "(not set)"}"`
      );
    }
  }

  const passed = failures.length === 0;

  return expect({
    requirement,
    condition: passed,
    message: passed ? "" : `Style mismatches for "${selector}":\n\n${failures.join("\n")}`,
  });
}
