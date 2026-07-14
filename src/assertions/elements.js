import { expect } from "./expect.js";

/**
 * Checks whether an HTML element exists.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function elementExists($, requirement) {
  const { name, check } = requirement;

  const exists = $(check.selector).length > 0;

  return expect({
    name,
    condition: exists,
    message: `Could not find ${check.selector} element.`,
    hint: `Add a ${check.selector} element to your page.`,
  });
}