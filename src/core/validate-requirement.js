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
  "hasNoText",
  "hasItem",
  "missingItem",
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
  "method",
  "requestBody",
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
  "hasNoText",
  "hasItem",
  "missingItem",
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
  "method",
  "requestBody",
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
      if (check.fetch) {
        validateFetchRoutes(check.fetch);
      }
      validateReactExpect(check);
      break;

    case "submit":
      if (check.fetch) {
        validateFetchRoutes(check.fetch);
      }
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
      validateFetchRoutes(check.fetch);
      break;

    case "method":
      validateMethodExpect(check);
      break;

    case "requestBody":
      if (
        !check.expect ||
        typeof check.expect !== "object" ||
        Array.isArray(check.expect) ||
        Object.keys(check.expect).length === 0
      ) {
        throw new Error(
          `React assertion "requestBody" must include an "expect" object with the expected JSON body (e.g., { "name": "Bob" }).`
        );
      }
      break;

    case "hasNoText":
    case "hasItem":
    case "missingItem":
      if (typeof check.text !== "string" || !check.text) {
        throw new Error(
          `React assertion "${check.subtype}" must include "text" (the item text to verify).`
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
  const hasTextRule =
    expected.text !== undefined ||
    expected.hasNoText !== undefined ||
    expected.hasItem !== undefined ||
    expected.missingItem !== undefined;
  const isAsyncState =
    expected.loading === true ||
    expected.empty === true ||
    expected.error === true;
  if (!hasSelectorRule && !hasTextRule && !isAsyncState) {
    throw new Error(
      `React assertion "${check.subtype}" "expect" must include "text" (or "selector" with "text"/"value"/"checked", or "hasNoText"/"hasItem"/"missingItem").`
    );
  }
}

const SUPPORTED_FETCH_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const FETCH_SCENARIOS = new Set(["success", "error", "empty", "loading"]);

/**
 * Validates a fetch mock route table (v1.3.2).
 *
 * Keys may be plain URLs ("/api/users") or method-prefixed
 * ("POST /api/users"). Each mock must be an object whose optional
 * "status" is a number and optional "scenario" is a known scenario.
 */
function validateFetchRoutes(routes) {
  for (const [key, mock] of Object.entries(routes)) {
    if (typeof key !== "string" || !key.trim()) {
      throw new Error(
        `Fetch mock route keys must be non-empty strings (e.g., "/api/users" or "POST /api/users").`
      );
    }
    const methodPrefix = /^([A-Za-z]+)\s+(.+)$/.exec(key);
    if (methodPrefix && !SUPPORTED_FETCH_METHODS.has(methodPrefix[1].toUpperCase())) {
      throw new Error(
        `Fetch mock route "${key}" uses an unsupported HTTP method. Supported methods: ${[...SUPPORTED_FETCH_METHODS].join(", ")}.`
      );
    }
    if (!mock || typeof mock !== "object") {
      throw new Error(
        `Fetch mock route "${key}" must map to an object (e.g., { "status": 201, "body": [...] }).`
      );
    }
    if (mock.status !== undefined && typeof mock.status !== "number") {
      throw new Error(
        `Fetch mock route "${key}" has an invalid "status": expected a number, got ${JSON.stringify(mock.status)}.`
      );
    }
    if (mock.scenario !== undefined && !FETCH_SCENARIOS.has(mock.scenario)) {
      throw new Error(
        `Fetch mock route "${key}" has an invalid "scenario": must be one of ${[...FETCH_SCENARIOS].join(", ")}, got "${mock.scenario}".`
      );
    }
  }
}

/**
 * Validates the "method" assertion's expect object.
 */
function validateMethodExpect(check) {
  const { expect: expected } = check;
  if (!expected || typeof expected !== "object") {
    throw new Error(
      `React assertion "method" must include an "expect" object with "method" and "url" (e.g., { "method": "POST", "url": "/users" }).`
    );
  }
  if (typeof expected.method !== "string" || !expected.method) {
    throw new Error(
      `React assertion "method" "expect" must include "method" (e.g., "POST").`
    );
  }
  const method = expected.method.toUpperCase();
  if (!SUPPORTED_FETCH_METHODS.has(method)) {
    throw new Error(
      `React assertion "method" "expect" "method" must be one of ${[...SUPPORTED_FETCH_METHODS].join(", ")}, got "${expected.method}".`
    );
  }
  if (typeof expected.url !== "string" || !expected.url) {
    throw new Error(
      `React assertion "method" "expect" must include "url" (e.g., "/users").`
    );
  }
}
