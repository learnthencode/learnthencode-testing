import { expect } from "./expect.js";


/**
 * Checks whether a semantic HTML element exists.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function semanticExists($, requirement) {

  const {
    check,
  } = requirement;


  const exists =
    $(check.selector).length > 0;


  return expect({
    requirement,

    condition: exists,

    message:
      `Could not find semantic ${check.selector} element.`,
  });
}