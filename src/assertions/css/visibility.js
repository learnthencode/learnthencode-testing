import { expect } from "../expect.js";
import { queryElement } from "../../providers/css-renderer.js";

export function visibilityAssertion(window, requirement) {
  const { check } = requirement;
  const { selector, assertion, index = 0 } = check;

  const element = queryElement(window, selector, index);
  if (!element) {
    return expect({
      requirement,
      condition: false,
      message: `Could not find element matching "${selector}".`,
    });
  }

  const computed = window.getComputedStyle(element);
  const display = computed.getPropertyValue("display");
  const visibility = computed.getPropertyValue("visibility");
  const opacity = parseFloat(computed.getPropertyValue("opacity"));

  if (assertion === "visible") {
    const passed =
      display !== "none" &&
      visibility !== "hidden" &&
      opacity > 0;

    return expect({
      requirement,
      condition: passed,
      message: passed
        ? ""
        : `Expected "${selector}" to be visible, but display: ${display}, visibility: ${visibility}, opacity: ${opacity}.`,
    });
  }

  if (assertion === "hidden") {
    const passed =
      display === "none" ||
      visibility === "hidden" ||
      opacity === 0;

    return expect({
      requirement,
      condition: passed,
      message: passed
        ? ""
        : `Expected "${selector}" to be hidden, but display: ${display}, visibility: ${visibility}, opacity: ${opacity}.`,
    });
  }

  const VISIBILITY_PROPS = [
    "visibility",
    "opacity",
    "display",
    "overflow",
    "z-index",
  ];

  const { property, value } = check;

  if (property && value) {
    const kebabProp = property
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase();
    const actualValue = computed.getPropertyValue(kebabProp);
    const passed =
      actualValue.toLowerCase().trim() ===
      value.toLowerCase().trim();

    return expect({
      requirement,
      condition: passed,
      message: passed
        ? ""
        : `Expected ${kebabProp}: ${value} on "${selector}", but received: ${actualValue || "(not set)"}.`,
    });
  }

  const failures = [];

  for (const prop of VISIBILITY_PROPS) {
    const expectedVal = check[prop];
    if (expectedVal !== undefined) {
      const actualValue = computed.getPropertyValue(prop);
      if (
        actualValue.toLowerCase().trim() !==
        expectedVal.toLowerCase().trim()
      ) {
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
      : `Visibility mismatches for "${selector}":\n${failures.join("\n")}`,
  });
}
