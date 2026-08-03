import {
  getByRole,
  getByLabel,
  getByPlaceholder,
  getByText,
} from "./queries.js";

/**
 * Chainable React assertions for `.test.js` files (v1.3.0).
 *
 * Accepts either a render handle (from renderReact) or a raw container.
 * Every method throws an Error with an educational message when the
 * expectation fails, so it can be used with any simple test runner:
 *
 *   import { expectReact } from "learnthencode-testing/src/assertions/react/expect.js";
 *
 *   const view = await renderReact(Greeting, { name: "Ada" });
 *   expectReact(view).toHaveText("Hello, Ada");
 *   expectReact(view).toHaveButton("Save");
 *
 * @param {object|Element} handle - A renderReact handle or container.
 * @returns {ReactExpectBuilder}
 */
export function expectReact(handle) {
  const container = handle && handle.container ? handle.container : handle;
  return new ReactExpectBuilder(container);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function describeText(container) {
  const text = container.textContent.replace(/\s+/g, " ").trim();
  return text ? `"${text}"` : "(nothing was rendered)";
}

class ReactExpectBuilder {
  constructor(container) {
    this._container = container;
  }

  /** The component rendered JSX (an element, not a plain string). */
  toBeRendered() {
    const hasElement = this._container.querySelector("*") !== null;
    const text = this._container.textContent.replace(/\s+/g, " ").trim();
    assert(
      hasElement,
      text
        ? `Expected the component to return JSX, but it rendered a plain string (${describeText(this._container)}). Wrap the output in a JSX element.`
        : "Expected the component to render JSX, but it rendered nothing."
    );
    return this;
  }

  /** The rendered output contains (or equals) the given text. */
  toHaveText(text, options = {}) {
    const { exact = false, selector } = options;
    const target = String(text);
    const element = selector
      ? this._container.querySelector(selector)
      : this._container;
    assert(element, `Expected element "${selector}" to be rendered.`);

    const actual = element.textContent.replace(/\s+/g, " ").trim();
    const matched = exact ? actual === target : actual.includes(target);
    assert(
      matched,
      `Expected the rendered output to ${exact ? "exactly equal" : "contain"} "${target}", but got ${describeText(element)}.`
    );
    return this;
  }

  /** An element matching the CSS selector was rendered. */
  toHaveElement(selector) {
    const element = this._container.querySelector(selector);
    assert(
      element,
      `Expected an element matching "${selector}" to be rendered, but it was not found.`
    );
    return this;
  }

  /** An element with the given ARIA role (and optional accessible name) was rendered. */
  toHaveRole(role, name) {
    const element = getByRole(this._container, role, name);
    assert(
      element,
      `Expected an element with role "${role}"${
        name !== undefined ? ` named "${name}"` : ""
      } to be rendered, but it was not found.`
    );
    return this;
  }

  /** A form control associated with the given label was rendered. */
  toHaveLabel(label) {
    const element = getByLabel(this._container, label);
    assert(
      element,
      `Expected a form control labelled "${label}" to be rendered, but it was not found.`
    );
    return this;
  }

  /** An input with the given placeholder was rendered. */
  toHavePlaceholder(placeholder) {
    const element = getByPlaceholder(this._container, placeholder);
    assert(
      element,
      `Expected an input with placeholder "${placeholder}" to be rendered, but it was not found.`
    );
    return this;
  }

  /** A button (optionally with an accessible name) was rendered. */
  toHaveButton(name) {
    const element = getByRole(this._container, "button", name);
    assert(
      element,
      `Expected a button${name !== undefined ? ` named "${name}"` : ""} to be rendered, but it was not found.`
    );
    return this;
  }

  /** A heading (optionally with the given text) was rendered. */
  toHaveHeading(text) {
    const element = getByRole(this._container, "heading", text);
    assert(
      element,
      `Expected a heading${text !== undefined ? ` with text "${text}"` : ""} to be rendered, but it was not found.`
    );
    return this;
  }

  /** A link (optionally matching text and href) was rendered. */
  toHaveLink(text, href) {
    const link = getByRole(this._container, "link", text);
    assert(
      link,
      `Expected a link${text !== undefined ? ` with text "${text}"` : ""} to be rendered, but it was not found.`
    );
    if (href !== undefined) {
      assert(
        link.getAttribute("href") === href,
        `Expected the link to point to "${href}", but it points to "${link.getAttribute("href")}".`
      );
    }
    return this;
  }

  /** An image (optionally with the given alt text) was rendered. */
  toHaveImage(alt) {
    const image = getByRole(this._container, "img", alt);
    assert(
      image,
      `Expected an image${alt !== undefined ? ` with alt text "${alt}"` : ""} to be rendered, but it was not found.`
    );
    return this;
  }

  /** A list was rendered (optionally with the given number of items). */
  toHaveList(items) {
    const list = getByRole(this._container, "list");
    assert(list, "Expected a list (<ul> or <ol>) to be rendered, but it was not found.");
    if (items !== undefined) {
      const actual = list.querySelectorAll("li").length;
      assert(
        actual === items,
        `Expected the list to contain ${items} item(s), but it contains ${actual}.`
      );
    }
    return this;
  }

  /** A form was rendered. */
  toHaveForm() {
    const form = getByRole(this._container, "form");
    assert(form, "Expected a form to be rendered, but it was not found.");
    return this;
  }

  /** The number of elements matching the selector matches the expected count. */
  toHaveCount(selector, expected) {
    const actual = this._container.querySelectorAll(selector).length;
    assert(
      actual === expected,
      `Expected ${expected} element(s) matching "${selector}", but found ${actual}.`
    );
    return this;
  }
}
