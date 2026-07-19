import { elementExists } from "./elements.js";
import { attributeExists } from "./attributes.js";
import { semanticExists } from "./semantic.js";
import { textContains } from "./text.js";
import { elementCount } from "./count.js";
import { structureExists } from "./structure.js";


/**
 * Registry mapping requirement check `type` strings to their
 * assertion functions.
 *
 * When a requirement is executed, `executeRequirement` looks up the
 * function by `check.type` from this object. To add a new assertion
 * type, implement the function and add it here.
 *
 * Each assertion function has the signature:
 *   ($ : CheerioAPI, requirement : object) => object
 */
export const assertions = {
  element:   elementExists,
  attribute: attributeExists,
  semantic:  semanticExists,
  text:      textContains,
  count:     elementCount,
  structure: structureExists,
};