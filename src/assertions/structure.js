import { expect } from "./expect.js";


/**
 * Checks whether an HTML nesting structure exists.
 *
 * Unlike the `element` assertion (which checks for a single tag), this
 * is intended for CSS selector chains that enforce correct parent-child
 * relationships (e.g. "nav > ul > li > a").
 *
 * @param {CheerioAPI} $ - Cheerio instance loaded with the learner's HTML.
 * @param {object} requirement - The requirement being evaluated.
 * @returns {object} A result object (see expect.js).
 */
export function structureExists($, requirement) {

  const {
    check,
  } = requirement;

  // The selector is typically a descendant/child chain, so any match means
  // the required nesting exists in the document.
  const exists =
    $(check.selector).length > 0;

  return expect({
    requirement,

    condition: exists,

    message:
      `Could not find required structure "${check.selector}".`,
  });
}