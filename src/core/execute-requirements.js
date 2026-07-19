import { load } from "cheerio";
import { assertions } from "../assertions/index.js";


/**
 * Executes a single requirement against the learner's HTML.
 *
 * Parses the HTML with Cheerio, looks up the assertion function
 * for the requirement's check type, and returns the result.
 *
 * @param {object} requirement - A validated requirement object from requirements.json.
 * @param {string} html        - Raw HTML string to test against.
 * @returns {object}           - A result object (see createResult in results.js).
 * @throws {Error}             - If the check.type is not a recognised assertion.
 */
export function executeRequirement(
  requirement,
  html
) {
  // Parse the HTML string into a Cheerio instance for DOM querying
  const $ = load(html);

  const { check } = requirement;

  // Look up the assertion function by its type string (e.g. "element", "count")
  const assertion =
    assertions[check.type];

  // Guard against unsupported types specified in requirements.json
  if (!assertion) {
    throw new Error(
      `Unsupported assertion type: ${check.type}`
    );
  }

  // Run the assertion and return a structured result object
  return assertion(
    $,
    requirement
  );
}