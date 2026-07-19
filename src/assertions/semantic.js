import { expect } from "./expect.js";


/**
 * Checks whether one or more semantic HTML5 elements exist in the document.
 *
 * Supports two modes (mutually exclusive):
 *   - `check.selector`  — checks for a single element (e.g. "main").
 *   - `check.elements`  — checks for multiple elements; all must be present.
 *
 * @param {CheerioAPI} $ - Cheerio instance loaded with the learner's HTML.
 * @param {object} requirement - The requirement being evaluated.
 * @returns {object} A result object (see expect.js).
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
   * Example requirement check:
   * { "type": "semantic", "selector": "main" }
   */
  if ("selector" in check) {

    const exists =
      $(check.selector).length > 0;

    passed = exists;

    message =
      `Could not find semantic ${check.selector} element.`;

  }


  /*
   * Multiple semantic element check — all listed elements must be present.
   * Collects missing elements so the failure message can list them.
   *
   * Example requirement check:
   * { "type": "semantic", "elements": ["header", "main", "footer"] }
   */
  if ("elements" in check) {

    // Filter down to only the elements not found in the document
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