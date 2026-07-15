import { expect } from "./expect.js";


/**
 * Checks whether an element contains an attribute
 * and optionally validates its value.
 *
 * @param {CheerioAPI} $
 * @param {object} requirement
 * @returns {object}
 */
export function attributeExists($, requirement) {

  const {
    check,
  } = requirement;


  const element =
    $(check.selector);


  const attributeValue =
    element.attr(check.attribute);


  const exists =
    element.length > 0 &&
    attributeValue !== undefined;


  let passed =
    exists;


  let message =
    `Could not find ${check.attribute} attribute on ${check.selector} element.`;


  if (exists && "equals" in check) {

    passed =
      attributeValue === check.equals;


    message =
      `Expected ${check.selector} ${check.attribute} to equal "${check.equals}", but found "${attributeValue}".`;

  }


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