import { expect } from "./expect.js";

/**
 * Checks the number of elements matching a CSS selector.
 *
 * Exactly one comparison mode must be specified:
 *   - `check.equals`   — the count must match exactly.
 *   - `check.minimum`  — the count must be at least this value.
 *   - `check.maximum`  — the count must be at most this value.
 *
 * @param {CheerioAPI} $ - Cheerio instance loaded with the learner's HTML.
 * @param {object} requirement - The requirement being evaluated.
 * @returns {object} A result object (see expect.js).
 */
export function elementCount($, requirement) {

  const { check } = requirement;

  // Count how many elements currently match the selector
  const count =
    $(check.selector).length;

  let passed = false;
  let expected = "";

  // Exact match: the count must equal the specified number precisely
  if ("equals" in check) {

    passed =
      count === check.equals;

    expected =
      `exactly ${check.equals}`;

  // Minimum: at least N elements must be present
  } else if ("minimum" in check) {

    passed =
      count >= check.minimum;

    expected =
      `at least ${check.minimum}`;

  // Maximum: no more than N elements may be present
  } else if ("maximum" in check) {

    passed =
      count <= check.maximum;

    expected =
      `at most ${check.maximum}`;

  }

  return expect({
    requirement,

    condition: passed,

    message:
      `Expected ${expected} "${check.selector}" element(s), but found ${count}.`,
  });

}