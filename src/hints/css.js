const CSS_HINTS = {
  flexbox:
    "Use display: flex on the container to enable Flexbox layout.",
  grid:
    "Use display: grid on the container to enable CSS Grid layout.",
  color:
    "Use the color property to set text color. Example: color: red;",
  backgroundColor:
    "Use the background-color property. Example: background-color: blue;",
  fontSize:
    "Use the font-size property. Example: font-size: 16px;",
  fontFamily:
    "Use the font-family property. Example: font-family: Arial, sans-serif;",
  fontWeight:
    "Use the font-weight property. Example: font-weight: bold;",
  textAlign:
    "Use the text-align property. Example: text-align: center;",
  margin:
    "Use the margin property to add space outside the element.",
  padding:
    "Use the padding property to add space inside the element.",
  border:
    "Use the border property. Example: border: 1px solid black;",
  borderRadius:
    "Use the border-radius property for rounded corners.",
  display:
    "Use the display property to control how the element is displayed.",
  position:
    "Use the position property (relative, absolute, fixed, sticky).",
  width:
    "Use the width property to set the element width.",
  height:
    "Use the height property to set the element height.",
  maxWidth:
    "Use the max-width property to constrain the maximum width.",
  minWidth:
    "Use the min-width property to set a minimum width.",
  overflow:
    "Use the overflow property to control content overflow.",
  visibility:
    "Use visibility: hidden or display: none to hide elements.",
  opacity:
    "Use the opacity property (0 to 1) to control transparency.",
  zIndex:
    "Use the z-index property to control stacking order.",
  responsive:
    "Use media queries (@media) to make your design responsive.",
};

export function getCSSHint(requirement) {
  const { check } = requirement;

  if (check.assertion === "flexbox") {
    return CSS_HINTS.flexbox;
  }
  if (check.assertion === "grid") {
    return CSS_HINTS.grid;
  }
  if (check.assertion === "visible") {
    return CSS_HINTS.visibility;
  }
  if (check.assertion === "hidden") {
    return CSS_HINTS.visibility;
  }

  if (check.property) {
    const prop = check.property
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      .replace(/-/g, "");

    const hintKey = Object.keys(CSS_HINTS).find(
      (k) => k.toLowerCase() === prop.toLowerCase()
    );

    if (hintKey) return CSS_HINTS[hintKey];

    return `Check the ${check.property} property on ${check.selector}.`;
  }

  return null;
}
