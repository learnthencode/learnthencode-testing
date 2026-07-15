import { elementExists } from "./elements.js";
import { attributeExists } from "./attributes.js";
import { semanticExists } from "./semantic.js";
import { textContains } from "./text.js";
import { elementCount } from "./count.js";
import { structureExists } from "./structure.js";

export const assertions = {
  element: elementExists,
  attribute: attributeExists,
  semantic: semanticExists,
  text: textContains,
  count: elementCount,
  structure: structureExists,
};