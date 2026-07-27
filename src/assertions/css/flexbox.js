import { expect } from "../expect.js";
import {
  queryElement,
} from "../../providers/css-renderer.js";

export function toUseFlexbox(window, requirement) {
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

  const passed = display === "flex" || display === "inline-flex";

  return expect({
    requirement,
    condition: passed,
    message: passed
      ? ""
      : `Expected "${selector}" to use Flexbox (display: flex), but received display: ${display}.`,
  });
}

export function flexAssertion(window, requirement) {
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
  const flexProps = [
    "flex-direction",
    "flex-wrap",
    "flex-flow",
    "justify-content",
    "align-items",
    "align-content",
    "align-self",
    "flex",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "order",
    "gap",
    "row-gap",
    "column-gap",
  ];

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

  const display = computed.getPropertyValue("display");
  const isFlex = display === "flex" || display === "inline-flex";

  return expect({
    requirement,
    condition: isFlex,
    message: isFlex
      ? ""
      : `Expected "${selector}" to be a flex container, but display is ${display}.`,
  });
}
