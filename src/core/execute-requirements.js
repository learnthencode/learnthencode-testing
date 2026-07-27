import { load } from "cheerio";
import { assertions } from "../assertions/index.js";
import { renderCSS } from "../providers/css-renderer.js";

const CSS_TYPES = new Set(["css"]);

function isCSSType(type) {
  return CSS_TYPES.has(type);
}

/**
 * Executes a single requirement against the learner's HTML.
 *
 * For HTML assertions, parses the HTML with Cheerio and runs the
 * assertion function. For CSS assertions, renders the HTML with CSS
 * using jsdom and runs the CSS assertion against computed styles.
 *
 * @param {object} requirement - A validated requirement object from requirements.json.
 * @param {string} html        - Raw HTML string to test against.
 * @param {string} htmlFilePath - Absolute path to the HTML entry file (needed for CSS rendering).
 * @returns {object}           - A result object (see createResult in results.js).
 * @throws {Error}             - If the check.type is not a recognised assertion.
 */
export function executeRequirement(
  requirement,
  html,
  htmlFilePath
) {
  const { check } = requirement;

  if (isCSSType(check.type)) {
    const window = renderCSS(html, htmlFilePath);
    const assertion =
      assertions[check.type];
    if (!assertion) {
      throw new Error(
        `Unsupported assertion type: ${check.type}`
      );
    }
    return assertion(
      window,
      requirement
    );
  }

  const $ = load(html);

  const assertion =
    assertions[check.type];

  if (!assertion) {
    throw new Error(
      `Unsupported assertion type: ${check.type}`
    );
  }

  return assertion(
    $,
    requirement
  );
}
