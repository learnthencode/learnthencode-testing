import { expect } from "./expect.js";

/**
 * Checks whether an element's text content contains or exactly equals
 * a specified string.
 *
 * Supports:
 *   - `check.contains`      — passes if the text includes the substring.
 *   - `check.equals`        — passes if the text matches exactly.
 *   - `check.caseSensitive` — when false, both sides are lowercased before comparison.
 *
 * @param {CheerioAPI} $ - Cheerio instance loaded with the learner's HTML.
 * @param {object} requirement - The requirement being evaluated.
 * @returns {object} A result object (see expect.js).
 */
export function textContains($, requirement) {

  const {
    name,
    check,
  } = requirement;

  const element =
    $(check.selector);

  // Trim surrounding whitespace so indentation doesn't affect comparisons
  const actualText =
    element.text().trim();

  // Prefer `contains` over `equals` when choosing the expected value
  let expectedText =
    check.contains ?? check.equals;

  let comparisonText =
    actualText;

  // Normalise both sides to lowercase for case-insensitive comparisons
  if (check.caseSensitive === false) {

    comparisonText =
      actualText.toLowerCase();

    expectedText =
      expectedText.toLowerCase();

  }

  let passed = false;

  // Partial match: the element text just needs to include the substring
  if ("contains" in check) {

    passed =
      comparisonText.includes(
        expectedText
      );

  }

  // Exact match: the entire trimmed text must equal the expected value
  if ("equals" in check) {

    passed =
      comparisonText === expectedText;

  }

  return expect({
    requirement,

    condition: passed,

    message:
      check.contains
        ? `Expected ${check.selector} to contain "${check.contains}", but found "${actualText}".`
        : `Expected ${check.selector} to equal "${check.equals}", but found "${actualText}".`,
  });

}