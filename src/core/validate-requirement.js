import { JS_ASSERTION_TYPES, isReactType } from "../constants/assertion-types.js";

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

  if (isReactType(check.type)) {
    validateReactRequirement(check);
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

const REACT_ASSERTION_SUBTYPES = new Set([
  "project",
  "dependency",
  "component",
  "jsx",
  "renders",
  "props",
  "state",
  "hasText",
  "hasElement",
  "hasRole",
  "hasLabel",
  "hasPlaceholder",
  "hasButton",
  "hasHeading",
  "hasLink",
  "hasImage",
  "hasList",
  "hasForm",
  "count",
  "conditional",
  "click",
  "type",
  "change",
  "select",
  "submit",
  "reset",
  "loadsOnMount",
  "async",
  "fetch",
  "router",
  "effect",
  "dependencyArray",
  "cleanup",
  "customHook",
  "imports",
  "fileExists",
  "folderExists",
  "route",
  "routeParam",
  "navLink",
]);

const COMPONENT_REQUIRED_SUBTYPES = new Set([
  "component",
  "jsx",
  "renders",
  "props",
  "state",
  "hasText",
  "hasElement",
  "hasRole",
  "hasLabel",
  "hasPlaceholder",
  "hasButton",
  "hasHeading",
  "hasLink",
  "hasImage",
  "hasList",
  "hasForm",
  "count",
  "conditional",
  "click",
  "type",
  "change",
  "select",
  "submit",
  "reset",
  "loadsOnMount",
  "async",
  "fetch",
  "router",
  "effect",
  "dependencyArray",
  "cleanup",
  "customHook",
  "imports",
  "route",
  "routeParam",
  "navLink",
]);

const INTERACTION_SUBTYPES = new Set([
  "click",
  "type",
  "change",
  "select",
  "reset",
]);

function validateReactRequirement(check) {
  if (!check.subtype) {
    throw new Error(
      `React assertion must include "subtype" (e.g., "renders", "click", "fetch").`
    );
  }
  if (!REACT_ASSERTION_SUBTYPES.has(check.subtype)) {
    throw new Error(
      `React assertion "subtype" must be one of: ${[...REACT_ASSERTION_SUBTYPES].join(", ")}, got "${check.subtype}".`
    );
  }

  if (COMPONENT_REQUIRED_SUBTYPES.has(check.subtype) && !check.component) {
    throw new Error(
      `React assertion "${check.subtype}" must include "component" (the file to render, relative to the lab).`
    );
  }

  switch (check.subtype) {
    case "dependency":
      if (
        !Array.isArray(check.dependencies) ||
        check.dependencies.length === 0
      ) {
        throw new Error(
          `React assertion "dependency" must include "dependencies" (an array of package names).`
        );
      }
      break;

    case "count":
      if (!check.selector) {
        throw new Error(
          `React assertion "count" must include "selector".`
        );
      }
      if (
        check.equals === undefined &&
        check.minimum === undefined &&
        check.maximum === undefined
      ) {
        throw new Error(
          `React assertion "count" must include "equals", "minimum", or "maximum".`
        );
      }
      break;

    case "conditional":
      if (!check.selector) {
        throw new Error(
          `React assertion "conditional" must include "selector".`
        );
      }
      break;

    case "click":
    case "type":
    case "change":
    case "select":
    case "reset":
      if (!check.selector) {
        throw new Error(
          `React assertion "${check.subtype}" must include "selector".`
        );
      }
      validateReactExpect(check);
      break;

    case "submit":
      validateReactExpect(check);
      break;

    case "fetch":
      if (
        !check.fetch ||
        typeof check.fetch !== "object" ||
        Object.keys(check.fetch).length === 0
      ) {
        throw new Error(
          `React assertion "fetch" must include a "fetch" object of mock routes (e.g., { "/api/users": { body: [...] } }).`
        );
      }
      break;

    case "router":
      if (check.router !== undefined && typeof check.router !== "object") {
        throw new Error(
          `React assertion "router" "router" must be an object (e.g., { path: "/" }).`
        );
      }
      break;

    case "imports":
      if (
        !Array.isArray(check.expect) ||
        check.expect.length === 0 ||
        check.expect.some((source) => typeof source !== "string")
      ) {
        throw new Error(
          `React assertion "imports" must include "expect" (a non-empty array of module specifiers, e.g. ["react-router-dom"]).`
        );
      }
      break;

    case "fileExists":
    case "folderExists":
      if (typeof check.path !== "string" || !check.path) {
        throw new Error(
          `React assertion "${check.subtype}" must include "path" (the file or folder relative to the lab).`
        );
      }
      break;

    case "route":
    case "routeParam":
      if (typeof check.path !== "string" || !check.path) {
        throw new Error(
          `React assertion "${check.subtype}" must include "path" (the route path, e.g. "/about" or "/users/:id").`
        );
      }
      break;

    case "navLink":
      if (typeof check.expect !== "string" || !check.expect) {
        throw new Error(
          `React assertion "navLink" must include "expect" (the link target path, e.g. "/about").`
        );
      }
      break;
  }
}

function validateReactExpect(check) {
  const { expect: expected } = check;
  if (!expected || typeof expected !== "object") {
    throw new Error(
      `React assertion "${check.subtype}" must include an "expect" object describing the state after the interaction.`
    );
  }
  const hasSelectorRule =
    expected.selector &&
    (expected.text !== undefined ||
      expected.value !== undefined ||
      expected.checked !== undefined);
  const hasTextRule = expected.text !== undefined;
  const isAsyncState =
    expected.loading === true ||
    expected.empty === true ||
    expected.error === true;
  if (!hasSelectorRule && !hasTextRule && !isAsyncState) {
    throw new Error(
      `React assertion "${check.subtype}" "expect" must include "text" (or "selector" with "text"/"value"/"checked").`
    );
  }
}
