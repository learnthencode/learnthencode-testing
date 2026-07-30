import { load } from "cheerio";
import { assertions } from "../assertions/index.js";
import { renderCSS } from "../providers/css-renderer.js";

const CSS_TYPES = new Set(["css"]);

const JS_TYPES = new Set([
  "variable",
  "function",
  "array",
  "object",
  "dom",
  "event",
  "fetch",
  "json",
  "console",
]);

function isCSSType(type) {
  return CSS_TYPES.has(type);
}

function isJSType(type) {
  return JS_TYPES.has(type);
}

export { isJSType };

export function executeRequirement(
  requirement,
  html,
  htmlFilePath,
  jsEngine
) {
  const { check } = requirement;

  if (isCSSType(check.type)) {
    const window = renderCSS(html, htmlFilePath);
    const assertion = assertions[check.type];
    if (!assertion) {
      throw new Error(
        `Unsupported assertion type: ${check.type}`
      );
    }
    return assertion(window, requirement);
  }

  if (isJSType(check.type)) {
    if (!jsEngine) {
      throw new Error(
        `JavaScript assertion "${check.type}" requires a JavaScript execution environment. Ensure the lab entry points to a .js or .html file.`
      );
    }
    const assertion = assertions[check.type];
    if (!assertion) {
      throw new Error(
        `Unsupported assertion type: ${check.type}`
      );
    }
    return assertion(jsEngine, requirement);
  }

  const $ = load(html);

  const assertion = assertions[check.type];

  if (!assertion) {
    throw new Error(
      `Unsupported assertion type: ${check.type}`
    );
  }

  return assertion($, requirement);
}
