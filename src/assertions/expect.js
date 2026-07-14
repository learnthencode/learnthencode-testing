import { createResult } from "../core/results.js";


/**
 * Creates an assertion result.
 *
 * @param {object} options
 * @returns {object}
 */
export function expect({
  name,
  condition,
  message,
  hint,
}) {
  return createResult({
    name,
    passed: condition,
    message: condition
      ? ""
      : message,
    hint: condition
      ? ""
      : hint,
  });
}