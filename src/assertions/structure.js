import { expect } from "./expect.js";


/**
 * Checks whether an HTML structure exists.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function structureExists($, requirement) {

  const {
    check,
  } = requirement;


  const exists =
    $(check.selector).length > 0;


  return expect({
    requirement,

    condition: exists,

    message:
      `Could not find required structure "${check.selector}".`,
  });
}