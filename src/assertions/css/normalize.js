const FONT_WEIGHT_MAP = {
  normal: "400",
  bold: "700",
  lighter: "100",
  bolder: "900",
};

const COLOR_NAMED_MAP = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  transparent: "#00000000",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

function parseRGB(value) {
  const match = value.match(
    /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/
  );
  if (!match) return null;
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

function rgbToHex(r, g, b) {
  const toHex = (n) =>
    n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizeHexColor(value) {
  let hex = value.toLowerCase().replace(/[^0-9a-f]/g, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${hex}`;
}

export function normalizeColor(value) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();

  if (trimmed === "transparent") return "#00000000";

  if (COLOR_NAMED_MAP[trimmed]) return COLOR_NAMED_MAP[trimmed];

  if (trimmed.startsWith("#")) {
    if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
    if (/^#[0-9a-f]{3}$/.test(trimmed)) {
      return normalizeHexColor(trimmed);
    }
    if (/^#[0-9a-f]{8}$/.test(trimmed)) return trimmed;
  }

  const rgb = parseRGB(trimmed);
  if (rgb) return rgbToHex(rgb.r, rgb.g, rgb.b);

  const rgba = trimmed.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/
  );
  if (rgba) {
    return rgbToHex(
      parseInt(rgba[1], 10),
      parseInt(rgba[2], 10),
      parseInt(rgba[3], 10)
    );
  }

  return trimmed;
}

export function normalizeFontWeight(value) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (FONT_WEIGHT_MAP[trimmed]) return FONT_WEIGHT_MAP[trimmed];
  return trimmed;
}

function normalizeLengthToken(token) {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return trimmed;

  const numMatch = trimmed.match(
    /^(-?\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|vmin|vmax|pt|cm|mm|in|pc|ex|ch|q)?$/
  );
  if (!numMatch) return trimmed;

  const num = parseFloat(numMatch[1]);
  const unit = numMatch[2] || "";

  if (unit === "" || unit === "px") {
    if (num === 0) return "0px";
    if (Number.isInteger(num)) return `${num}px`;
    return `${num}px`;
  }

  return trimmed;
}

export function normalizeLength(value) {
  if (!value) return null;

  return value
    .trim()
    .split(/\s+/)
    .map(normalizeLengthToken)
    .join(" ");
}

function stripImportant(value) {
  return value
    .trim()
    .replace(/\s*!important\s*/g, "")
    .trim();
}

function stripTrailingSemicolon(value) {
  let v = value.trim();
  if (v.endsWith(";")) {
    v = v.slice(0, -1).trim();
  }
  return v;
}

const lengthProps = new Set([
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-width",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "gap",
  "row-gap",
  "column-gap",
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "top",
  "right",
  "bottom",
  "left",
  "font-size",
]);

const colorProps = new Set([
  "color",
  "background-color",
  "background",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
]);

const fontWeightProps = new Set(["font-weight"]);

export function normalizeCSSValue(property, value) {
  if (!value) return null;

  let cleaned = value;
  cleaned = stripImportant(cleaned);
  cleaned = stripTrailingSemicolon(cleaned);

  const lowerProp = property.toLowerCase();

  if (colorProps.has(lowerProp)) {
    return normalizeColor(cleaned);
  }

  if (fontWeightProps.has(lowerProp)) {
    return normalizeFontWeight(cleaned);
  }

  if (lengthProps.has(lowerProp)) {
    return normalizeLength(cleaned);
  }

  return cleaned.toLowerCase();
}

function valuesEqualColor(property, expected, actual) {
  const normExpected = normalizeColor(expected);
  const normActual = normalizeColor(actual);
  if (normExpected && normActual) return normExpected === normActual;
  return expected.toLowerCase().trim() === actual.toLowerCase().trim();
}

function valuesEqualFontWeight(expected, actual) {
  const normExpected = normalizeFontWeight(expected);
  const normActual = normalizeFontWeight(actual);
  return normExpected === normActual;
}

export function valuesEqual(property, expected, actual) {
  if (expected === undefined || expected === null) return false;
  if (actual === undefined || actual === null) return false;

  const lowerProp = property.toLowerCase();

  if (colorProps.has(lowerProp)) {
    return valuesEqualColor(lowerProp, expected, actual);
  }

  if (fontWeightProps.has(lowerProp)) {
    return valuesEqualFontWeight(expected, actual);
  }

  const normExpected = normalizeCSSValue(property, expected);
  const normActual = normalizeCSSValue(property, actual);

  return normExpected === normActual;
}
