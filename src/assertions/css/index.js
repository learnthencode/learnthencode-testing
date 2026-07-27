import { toHaveCSS, toHaveStyles } from "./base.js";
import { flexAssertion, toUseFlexbox } from "./flexbox.js";
import { gridAssertion, toUseGrid } from "./grid.js";
import { typographyAssertion } from "./typography.js";
import { colorAssertion } from "./colors.js";
import { spacingAssertion } from "./spacing.js";
import { layoutAssertion } from "./layout.js";
import { borderAssertion } from "./borders.js";
import { visibilityAssertion } from "./visibility.js";
import { responsiveAssertion } from "./responsive.js";

export function cssAssertion(window, requirement) {
  const { check } = requirement;
  const subType = check.assertion || check.cssType;

  if (subType === "flexbox") {
    return flexAssertion(window, requirement);
  }
  if (subType === "grid") {
    return gridAssertion(window, requirement);
  }
  if (subType === "typography") {
    return typographyAssertion(window, requirement);
  }
  if (subType === "color" || subType === "colors") {
    return colorAssertion(window, requirement);
  }
  if (subType === "spacing") {
    return spacingAssertion(window, requirement);
  }
  if (subType === "layout") {
    return layoutAssertion(window, requirement);
  }
  if (subType === "border" || subType === "borders") {
    return borderAssertion(window, requirement);
  }
  if (subType === "visibility") {
    return visibilityAssertion(window, requirement);
  }
  if (subType === "responsive") {
    return responsiveAssertion(window, requirement);
  }

  if (check.styles) {
    return toHaveStyles(window, requirement);
  }

  if (check.property && check.value) {
    return toHaveCSS(window, requirement);
  }

  return toHaveCSS(window, requirement);
}

export {
  toHaveCSS,
  toHaveStyles,
  flexAssertion,
  toUseFlexbox,
  gridAssertion,
  toUseGrid,
  typographyAssertion,
  colorAssertion,
  spacingAssertion,
  layoutAssertion,
  borderAssertion,
  visibilityAssertion,
  responsiveAssertion,
};
