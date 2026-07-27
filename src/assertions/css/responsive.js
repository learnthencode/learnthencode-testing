import { setViewport } from "../../providers/css-renderer.js";
import { toHaveCSS } from "./base.js";

export function runAtViewport(window, width, height, fn) {
  setViewport(window, width, height);
  return fn(window);
}

export function responsiveAssertion(window, requirement) {
  const { check } = requirement;
  const { selector, property, value, viewport, index = 0 } = check;

  if (viewport) {
    setViewport(window, viewport.width, viewport.height);
  }

  return toHaveCSS(window, {
    ...requirement,
    check: { selector, property, value, index },
  });
}
