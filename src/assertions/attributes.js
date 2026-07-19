import { expect } from "./expect.js";


/**
 * Checks whether an element contains a specific attribute
 * and optionally validates its value.
 *
 * Evaluation order:
 *   1. Verify the element exists and the attribute is present.
 *   2. If `check.equals` is set, require an exact attribute value match.
 *   3. If `check.contains` is set, require a partial attribute value match.
 *
 * Only one of `equals` or `contains` should be specified per requirement.
 *
 * @param {CheerioAPI} $ - Cheerio instance loaded with the learner's HTML.
 * @param {object} requirement - The requirement being evaluated.
 * @returns {object} A result object (see expect.js).
 */
export function attributeExists($, requirement) {

  const {
    check,
  } = requirement;

  const element =
    $(check.selector);

  const attributeValue =
    element.attr(check.attribute);

  // Phase 1: the element must exist AND have the attribute at all
  const exists =
    element.length > 0 &&
    attributeValue !== undefined;

  // Default: passes as long as the attribute exists
  let passed =
    exists;

  let message =
    `Could not find ${check.attribute} attribute on ${check.selector} element.`;


  // Phase 2: optional exact value check (overrides the existence-only result)
  if (exists && "equals" in check) {

    passed =
      attributeValue === check.equals;

    message =
      `Expected ${check.selector} ${check.attribute} to equal "${check.equals}", but found "${attributeValue}".`;

  }


  // Phase 3: optional partial value check (overrides the existence-only result)
  if (exists && "contains" in check) {

    passed =
      attributeValue.includes(
        check.contains
      );

    message =
      `Expected ${check.selector} ${check.attribute} to contain "${check.contains}", but found "${attributeValue}".`;

  }


  return expect({
    requirement,

    condition: passed,

    message,
  });
}