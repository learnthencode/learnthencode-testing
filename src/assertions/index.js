import { elementExists } from "./elements.js";
import { attributeExists } from "./attributes.js";
import { semanticExists } from "./semantic.js";
import { textContains } from "./text.js";


export const assertions = {
  element: elementExists,
  attribute: attributeExists,
  semantic: semanticExists,
  text: textContains,
};