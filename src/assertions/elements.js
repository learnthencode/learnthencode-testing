import { expect } from "./expect.js";


/**
 * Checks whether at least one element matching the selector exists.
 *
 * Use this for simple, single-element presence checks (e.g. "does an h1 exist?").
 * For nested structure checks (e.g. "nav > ul > li > a"), use the `structure` assertion.
 *
 * @param {CheerioAPI} $ - Cheerio instance loaded with the learner's HTML.
 * @param {object} requirement - The requirement being evaluated.
 * @returns {object} A result object (see expect.js).
 */
export function elementExists($, requirement) {
  const { check } = requirement;

  // A non-zero length means at least one matching element was found
  const exists = $(check.selector).length > 0;

  return expect({
    requirement,

    condition: exists,

    message:
      `Could not find ${check.selector} element.`,
  });
}