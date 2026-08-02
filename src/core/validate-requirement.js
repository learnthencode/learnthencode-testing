import { JS_ASSERTION_TYPES } from "../constants/assertion-types.js";

const ASYNC_FUNCTION_ASSERTIONS = new Set([
  "returnsPromise",
  "resolves",
  "rejects",
  "rejectsWith",
]);

export function validateRequirement(requirement) {

  const requiredFields = [
    "name",
    "points",
    "check",
  ];

  for (const field of requiredFields) {
    if (!(field in requirement)) {
      throw new Error(
        `Invalid requirement. Missing required property: "${field}".`
      );
    }
  }

  if (typeof requirement.points !== "number") {
    throw new Error(
      `"points" must be a number.`
    );
  }

  if (typeof requirement.check !== "object") {
    throw new Error(
      `"check" must be an object.`
    );
  }

  const { check } = requirement;

  if (check.type === "css") {
    if (!check.selector) {
      throw new Error(
        `CSS assertion must include "selector".`
      );
    }
    if (!check.property && !check.styles && !check.assertion) {
      throw new Error(
        `CSS assertion must include "property" + "value", "styles", or "assertion".`
      );
    }
  }

  if (JS_ASSERTION_TYPES.has(check.type)) {
    validateJSRequirement(check);
  }

}

function validateJSRequirement(check) {
  switch (check.type) {
    case "variable":
      if (!check.name) {
        throw new Error(
          `Variable assertion must include "name".`
        );
      }
      break;

    case "function":
      if (!check.name) {
        throw new Error(
          `Function assertion must include "name".`
        );
      }
      if (ASYNC_FUNCTION_ASSERTIONS.has(check.assertion)) {
        if (
          (check.assertion === "resolves" ||
            check.assertion === "rejectsWith") &&
          check.value === undefined
        ) {
          throw new Error(
            `Function assertion "${check.assertion}" must include "value".`
          );
        }
      }
      break;

    case "array":
      if (!check.name) {
        throw new Error(
          `Array assertion must include "name".`
        );
      }
      break;

    case "object":
      if (!check.name) {
        throw new Error(
          `Object assertion must include "name".`
        );
      }
      break;

    case "dom":
      if (!check.assertion) {
        throw new Error(
          `DOM assertion must include "assertion".`
        );
      }
      if (!check.selector && check.assertion !== "elementCreated") {
        throw new Error(
          `DOM assertion must include "selector".`
        );
      }
      break;

    case "event":
      if (!check.assertion) {
        throw new Error(
          `Event assertion must include "assertion" (e.g., "click").`
        );
      }
      if (!check.selector) {
        throw new Error(
          `Event assertion must include "selector".`
        );
      }
      break;

    case "events":
      validateEventsRequirement(check);
      break;

    case "fetch":
      break;

    case "json":
      if (!check.assertion) {
        throw new Error(
          `JSON assertion must include "assertion" ("parse" or "stringify").`
        );
      }
      if (check.assertion !== "parse" && check.assertion !== "stringify") {
        throw new Error(
          `JSON assertion "assertion" must be "parse" or "stringify", got "${check.assertion}".`
        );
      }
      break;

    case "console":
      if (!check.assertion) {
        throw new Error(
          `Console assertion must include "assertion" ("logContains", "logEquals", "logCount", or "logOrder").`
        );
      }
      if (!["logContains", "logEquals", "logCount", "logOrder"].includes(check.assertion)) {
        throw new Error(
          `Console assertion "assertion" must be "logContains", "logEquals", "logCount", or "logOrder", got "${check.assertion}".`
        );
      }
      if (check.value === undefined || check.value === null) {
        throw new Error(
          `Console assertion must include "value".`
        );
      }
      break;
  }
}

const EVENTS_ASSERTIONS = new Set([
  "listenerExists",
  "dispatch",
  "inputValueChanges",
]);

function validateEventsRequirement(check) {
  if (!check.assertion) {
    throw new Error(
      `Events assertion must include "assertion" ("listenerExists", "dispatch", or "inputValueChanges").`
    );
  }
  if (!EVENTS_ASSERTIONS.has(check.assertion)) {
    throw new Error(
      `Events assertion "assertion" must be "listenerExists", "dispatch", or "inputValueChanges", got "${check.assertion}".`
    );
  }
  if (!check.selector) {
    throw new Error(
      `Events assertion must include "selector".`
    );
  }

  switch (check.assertion) {
    case "listenerExists":
      if (!check.event) {
        throw new Error(
          `Events assertion "listenerExists" must include "event" (e.g., "click").`
        );
      }
      break;

    case "dispatch":
      if (!check.event) {
        throw new Error(
          `Events assertion "dispatch" must include "event" (e.g., "click").`
        );
      }
      validateEventsExpect(check);
      break;

    case "inputValueChanges":
      if (check.value === undefined || check.value === null) {
        throw new Error(
          `Events assertion "inputValueChanges" must include "value".`
        );
      }
      validateEventsExpect(check);
      break;
  }
}

function validateEventsExpect(check) {
  const { expect: expected } = check;
  if (!expected || typeof expected !== "object") {
    throw new Error(
      `Events assertion "${check.assertion}" must include an "expect" object with "selector" and "text".`
    );
  }
  if (!expected.selector) {
    throw new Error(
      `Events assertion "${check.assertion}" "expect" must include "selector".`
    );
  }
  if (expected.text === undefined || expected.text === null) {
    throw new Error(
      `Events assertion "${check.assertion}" "expect" must include "text".`
    );
  }
}
