import { expect } from "./expect.js";

/**
 * Checks the number of matching elements.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function elementCount($, requirement) {
  const { name, check } = requirement;

  const count = $(check.selector).length;

  let passed = false;
  let expected = "";

  if ("equals" in check) {
    passed = count === check.equals;
    expected = `exactly ${check.equals}`;
  } else if ("minimum" in check) {
    passed = count >= check.minimum;
    expected = `at least ${check.minimum}`;
  } else if ("maximum" in check) {
    passed = count <= check.maximum;
    expected = `at most ${check.maximum}`;
  }

  return expect({
    name,
    condition: passed,
    message: `Expected ${expected} "${check.selector}" element(s), but found ${count}.`,
    hint: `Check the number of "${check.selector}" elements in your HTML.`,
  });
}