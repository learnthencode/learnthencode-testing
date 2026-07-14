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
    check,
  } = requirement;


  const element =
    $(check.selector);


  const text =
    element.text().trim();


  const exists =
    text.includes(
      check.contains
    );


  return expect({
    requirement,

    condition: exists,

    message:
      `Expected ${check.selector} to contain "${check.contains}".`,
  });
}