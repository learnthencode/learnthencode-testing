import { load } from "cheerio";
import { createResult } from "./results.js";


/**
 * Executes a single requirement.
 *
 * @param {object} requirement
 * @param {string} html
 * @returns {object}
 */
export function executeRequirement(
  requirement,
  html
) {
  const $ = load(html);

  const { name, check } = requirement;


  if (check.type === "element") {
    const exists =
      $(check.selector).length > 0;


    return createResult({
      name,
      passed: exists,
      message: exists
        ? ""
        : `Could not find ${check.selector} element.`,
      hint: exists
        ? ""
        : `Add a ${check.selector} element to your page.`,
    });
  }


  return createResult({
    name,
    passed: false,
    message: "Unsupported requirement type.",
    hint: "Ask your instructor for guidance.",
  });
}