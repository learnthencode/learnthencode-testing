import { expect } from "../expect.js";
import { queryElement } from "../../providers/css-renderer.js";

export function toUseGrid(window, requirement) {
  const { check } = requirement;
  const { selector, index = 0 } = check;

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

  const passed =
    display === "grid" || display === "inline-grid";

  return expect({
    requirement,
    condition: passed,
    message: passed
      ? ""
      : `Expected "${selector}" to use CSS Grid (display: grid), but received display: ${display}.`,
  });
}

export function gridAssertion(window, requirement) {
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
    const actualValue =
      computed.getPropertyValue(kebabProp);
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

  const display =
    computed.getPropertyValue("display");
  const isGrid =
    display === "grid" || display === "inline-grid";

  return expect({
    requirement,
    condition: isGrid,
    message: isGrid
      ? ""
      : `Expected "${selector}" to be a grid container, but display is ${display}.`,
  });
}
