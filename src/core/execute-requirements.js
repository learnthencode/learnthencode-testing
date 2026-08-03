import { load } from "cheerio";
import { assertions } from "../assertions/index.js";
import { reactAssertions } from "../assertions/react/index.js";
import { renderCSS } from "../providers/css-renderer.js";
import {
  isCSSType,
  isJSType,
  isReactType,
} from "../constants/assertion-types.js";

export { isJSType };

export function executeRequirement(
  requirement,
  html,
  htmlFilePath,
  jsEngine,
  reactEngine
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

  if (isReactType(check.type)) {
    if (!reactEngine) {
      throw new Error(
        `React assertion "${check.subtype}" requires a React execution environment. Ensure the lab is a React project with a .jsx entry file.`
      );
    }
    const assertion = reactAssertions[check.subtype];
    if (!assertion) {
      throw new Error(
        `Unsupported React assertion subtype: ${check.subtype}`
      );
    }
    return assertion(reactEngine, requirement);
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
