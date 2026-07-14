import { expect } from "./expect.js";


/**
 * Checks whether an HTML element exists.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function elementExists($, requirement) {
  const { check } = requirement;


  const exists = $(check.selector).length > 0;


  return expect({
    requirement,

    condition: exists,

    message:
      `Could not find ${check.selector} element.`,
  });
}