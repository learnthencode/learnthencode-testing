/**
 * Recursively compares two values for deep equality.
 *
 * Supports primitives, objects, and arrays at any nesting depth.
 * Prototypes are intentionally ignored so values produced inside the
 * vm sandbox (a different JavaScript realm) compare correctly against
 * plain JSON values from the requirements file.
 *
 * @param {*} actual   - The value produced by student code.
 * @param {*} expected - The expected value from the requirement.
 * @returns {boolean} True when both values are deeply equal.
 */
export function deepEqual(actual, expected) {
  if (actual === expected) {
    return true;
  }

  if (
    typeof actual === "number" &&
    typeof expected === "number" &&
    Number.isNaN(actual) &&
    Number.isNaN(expected)
  ) {
    return true;
  }

  if (
    typeof actual !== "object" ||
    actual === null ||
    typeof expected !== "object" ||
    expected === null
  ) {
    return false;
  }

  const actualIsArray = Array.isArray(actual);
  const expectedIsArray = Array.isArray(expected);

  if (actualIsArray !== expectedIsArray) {
    return false;
  }

  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);

  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  for (const key of expectedKeys) {
    if (!Object.prototype.hasOwnProperty.call(actual, key)) {
      return false;
    }
    if (!deepEqual(actual[key], expected[key])) {
      return false;
    }
  }

  return true;
}
