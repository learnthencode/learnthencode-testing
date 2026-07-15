import { expect } from "./expect.js";


/**
 * Checks whether semantic HTML elements exist.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function semanticExists($, requirement) {

  const {
    check,
  } = requirement;


  let passed = false;
  let message = "";


  /*
   * Single semantic element check
   *
   * Example:
   * {
   *   "selector": "main"
   * }
   */
  if ("selector" in check) {

    const exists =
      $(check.selector).length > 0;


    passed = exists;


    message =
      `Could not find semantic ${check.selector} element.`;

  }


  /*
   * Multiple semantic element check
   *
   * Example:
   * {
   *   "elements": [
   *      "header",
   *      "main",
   *      "footer"
   *   ]
   * }
   */
  if ("elements" in check) {

    const missing =
      check.elements.filter(
        (element) =>
          $(element).length === 0
      );


    passed =
      missing.length === 0;


    message =
      `Missing semantic elements: ${missing.join(", ")}.`;

  }


  return expect({
    requirement,

    condition: passed,

    message,
  });
}