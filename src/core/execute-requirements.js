import { load } from "cheerio";
import { assertions } from "../assertions/index.js";


export function executeRequirement(
  requirement,
  html
) {
  const $ = load(html);


  const { check } = requirement;


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