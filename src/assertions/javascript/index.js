import { variableAssertion } from "./variables.js";
import { functionAssertion } from "./functions.js";
import { arrayAssertion } from "./arrays.js";
import { objectAssertion } from "./objects.js";
import { domAssertion } from "./dom.js";
import { eventAssertion } from "./events.js";
import { fetchAssertion } from "./fetch.js";
import { jsonAssertion } from "./json.js";
import { consoleAssertion } from "./console.js";

export const jsAssertions = {
  variable: variableAssertion,
  function: functionAssertion,
  array: arrayAssertion,
  object: objectAssertion,
  dom: domAssertion,
  event: eventAssertion,
  fetch: fetchAssertion,
  json: jsonAssertion,
  console: consoleAssertion,
};
