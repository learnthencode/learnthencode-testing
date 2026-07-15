import { expect } from "./expect.js";

/**
 * Checks whether an element contains specific text.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function textContains($, requirement) {

  const {
    name,
    check,
  } = requirement;


  const element =
    $(check.selector);


  const actualText =
    element.text().trim();

  let expectedText =
    check.contains ?? check.equals;

  let comparisonText =
    actualText;

  if (check.caseSensitive === false) {

    comparisonText =
      actualText.toLowerCase();

    expectedText =
      expectedText.toLowerCase();

  }

  let passed = false;

  if ("contains" in check) {

    passed =
      comparisonText.includes(
        expectedText
      );

  }

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