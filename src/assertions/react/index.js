import {
  projectAssertion,
  dependencyAssertion,
  componentAssertion,
  jsxAssertion,
} from "./static.js";
import {
  rendersAssertion,
  propsAssertion,
  stateAssertion,
  hasTextAssertion,
  hasNoTextAssertion,
  hasItemAssertion,
  missingItemAssertion,
  elementAssertion,
  roleAssertion,
  labelAssertion,
  placeholderAssertion,
  buttonAssertion,
  headingAssertion,
  linkAssertion,
  imageAssertion,
  listAssertion,
  formAssertion,
  countAssertion,
  conditionalAssertion,
} from "./render-assertions.js";
import {
  clickAssertion,
  typeAssertion,
  changeAssertion,
  selectAssertion,
  submitAssertion,
  resetAssertion,
  verifyExpect,
} from "./interactions.js";
import { loadsOnMountAssertion, asyncAssertion } from "./effects.js";
import {
  fetchAssertion,
  methodAssertion,
  requestBodyAssertion,
} from "./fetch-assertions.js";
import { routerAssertion } from "./router-assertions.js";
import {
  effectAssertion,
  dependencyArrayAssertion,
  cleanupAssertion,
  customHookAssertion,
  importsAssertion,
  fileExistsAssertion,
  folderExistsAssertion,
  routeAssertion,
  routeParamAssertion,
  navLinkAssertion,
} from "./ast-assertions.js";

/**
 * All React assertion functions (v1.3.1, CRUD assertions v1.3.2), keyed
 * by requirement check subtype. Every function has the signature:
 *
 *   async (engine, requirement) => result
 *
 * and returns the result of expect() from src/assertions/expect.js.
 */
export const reactAssertions = {
  project: projectAssertion,
  dependency: dependencyAssertion,
  component: componentAssertion,
  jsx: jsxAssertion,

  renders: rendersAssertion,
  props: propsAssertion,
  state: stateAssertion,
  hasText: hasTextAssertion,
  hasNoText: hasNoTextAssertion,
  hasItem: hasItemAssertion,
  missingItem: missingItemAssertion,
  hasElement: elementAssertion,
  hasRole: roleAssertion,
  hasLabel: labelAssertion,
  hasPlaceholder: placeholderAssertion,
  hasButton: buttonAssertion,
  hasHeading: headingAssertion,
  hasLink: linkAssertion,
  hasImage: imageAssertion,
  hasList: listAssertion,
  hasForm: formAssertion,
  count: countAssertion,
  conditional: conditionalAssertion,

  click: clickAssertion,
  type: typeAssertion,
  change: changeAssertion,
  select: selectAssertion,
  submit: submitAssertion,
  reset: resetAssertion,

  loadsOnMount: loadsOnMountAssertion,
  async: asyncAssertion,
  fetch: fetchAssertion,
  method: methodAssertion,
  requestBody: requestBodyAssertion,
  router: routerAssertion,

  effect: effectAssertion,
  dependencyArray: dependencyArrayAssertion,
  cleanup: cleanupAssertion,
  customHook: customHookAssertion,
  imports: importsAssertion,
  fileExists: fileExistsAssertion,
  folderExists: folderExistsAssertion,
  route: routeAssertion,
  routeParam: routeParamAssertion,
  navLink: navLinkAssertion,
};

export { verifyExpect };

export { expectReact } from "./expect.js";
export { fireEvent } from "./fire.js";
export { mockFetch, restoreFetch } from "./fetch.js";
export { withRouter } from "./router.js";
export { renderReact } from "./render.js";
