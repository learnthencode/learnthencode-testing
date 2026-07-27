export function expectCSS(selector) {
  return new CSSExpectBuilder(selector);
}

class CSSExpectBuilder {
  constructor(selector) {
    this._selector = selector;
    this._index = 0;
  }

  atIndex(index) {
    this._index = index;
    return this;
  }

  toHaveCSS(property, value) {
    return {
      type: "css",
      selector: this._selector,
      property,
      value,
      index: this._index,
    };
  }

  toHaveStyles(styles) {
    return {
      type: "css-styles",
      selector: this._selector,
      styles,
      index: this._index,
    };
  }

  toUseFlexbox() {
    return {
      type: "css-flexbox",
      selector: this._selector,
      index: this._index,
    };
  }

  toUseGrid() {
    return {
      type: "css-grid",
      selector: this._selector,
      index: this._index,
    };
  }

  toBeVisible() {
    return {
      type: "css-visibility",
      selector: this._selector,
      assertion: "visible",
      index: this._index,
    };
  }

  toBeHidden() {
    return {
      type: "css-visibility",
      selector: this._selector,
      assertion: "hidden",
      index: this._index,
    };
  }

  toHaveBackgroundColor(value) {
    return this.toHaveCSS("background-color", value);
  }

  toHaveTextColor(value) {
    return this.toHaveCSS("color", value);
  }

  toHaveFontSize(value) {
    return this.toHaveCSS("font-size", value);
  }

  toHaveFontFamily(value) {
    return this.toHaveCSS("font-family", value);
  }

  toHaveMargin(value) {
    return this.toHaveCSS("margin", value);
  }

  toHavePadding(value) {
    return this.toHaveCSS("padding", value);
  }

  toHaveBorder(value) {
    return this.toHaveCSS("border", value);
  }

  toHaveBorderRadius(value) {
    return this.toHaveCSS("border-radius", value);
  }

  toHaveWidth(value) {
    return this.toHaveCSS("width", value);
  }

  toHaveHeight(value) {
    return this.toHaveCSS("height", value);
  }

  toHaveMaxWidth(value) {
    return this.toHaveCSS("max-width", value);
  }

  toHaveMinWidth(value) {
    return this.toHaveCSS("min-width", value);
  }

  toHaveDisplay(value) {
    return this.toHaveCSS("display", value);
  }

  toHavePosition(value) {
    return this.toHaveCSS("position", value);
  }

  toHaveOverflow(value) {
    return this.toHaveCSS("overflow", value);
  }
}
