/**
 * Single source of truth for the assertion type registry.
 *
 * Every assertion type is classified here so the execution pipeline
 * (runner, execute-requirements, validate-requirement) can route
 * requirements consistently. New JavaScript assertion types only need
 * to be registered in JS_ASSERTION_TYPES — the runner automatically
 * initializes the JavaScript execution environment whenever at least
 * one such assertion exists in a lab.
 */

export const CSS_ASSERTION_TYPES = new Set(["css"]);

export const JS_ASSERTION_TYPES = new Set([
  "variable",
  "function",
  "array",
  "object",
  "dom",
  "event",
  "events",
  "fetch",
  "json",
  "console",
]);

/**
 * React assertion types (v1.3.0) route to the React execution engine,
 * not the plain JavaScript engine: student code is spread across JSX
 * modules that must be bundled and rendered before anything can be
 * asserted.
 */
export const REACT_ASSERTION_TYPES = new Set(["react"]);

export function isCSSType(type) {
  return CSS_ASSERTION_TYPES.has(type);
}

export function isJSType(type) {
  return JS_ASSERTION_TYPES.has(type);
}

export function isReactType(type) {
  return REACT_ASSERTION_TYPES.has(type);
}
