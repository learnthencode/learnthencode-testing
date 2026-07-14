import { load } from "cheerio";
import { createResult } from "./results.js";
import { elementExists } from "../assertions/elements.js";

export function executeRequirement(requirement, html) {
  const $ = load(html);

  const { check } = requirement;

  switch (check.type) {
    case "element":
      return elementExists($, requirement);

    default:
      return createResult({
        name: requirement.name,
        passed: false,
        message: `Unsupported requirement type: ${check.type}`,
        hint: "Ask your instructor for guidance.",
      });
  }
}