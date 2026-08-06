import { expect } from "../expect.js";
import {
  getByRole,
  getByLabel,
  getByPlaceholder,
} from "./queries.js";

/**
 * Render-based React assertions (v1.3.0, list item checks v1.3.2).
 *
 * Every assertion renders the named component (with optional props)
 * into the shared jsdom window and inspects the resulting DOM. These
 * cover:
 *
 *   - renders        — the component renders JSX (not a plain string).
 *   - props          — the component accepts and uses the given props.
 *   - state          — the rendered output reflects useState's initial value.
 *   - hasText        — rendered text content.
 *   - hasNoText      — text is absent from the rendered output (v1.3.2).
 *   - hasItem        — a list item with the given text is rendered (v1.3.2).
 *   - missingItem    — a list item with the given text is absent (v1.3.2).
 *   - hasElement     - a CSS selector matches rendered output.
 *   - hasRole        — an element with an ARIA role (and optional name).
 *   - hasLabel       — a form control associated with a label.
 *   - hasPlaceholder — an input with a placeholder.
 *   - hasButton      - a button (and optional accessible name).
 *   - hasHeading     — a heading (and optional text).
 *   - hasLink        - a link (and optional text/href).
 *   - hasImage       - an image (and optional alt text).
 *   - hasList        — a list (and optional item count).
 *   - hasForm        — a form.
 *   - count          — element count for a selector.
 *   - conditional    — element present/absent for the given props.
 */

function fail(requirement, message) {
  return expect({ requirement, condition: false, message });
}

function pass(requirement) {
  return expect({ requirement, condition: true });
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Renders the component named in check and reports load/render errors.
 *
 * @param {object} engine - The React execution engine.
 * @param {object} check - The requirement check.
 * @param {object} requirement - The requirement being evaluated.
 * @returns {Promise<{ result: object|null, container: Element|null, errors: Error[] }>}
 */
async function renderFor(engine, check, requirement) {
  const { container, errors, error } = await engine.renderComponent({
    file: check.component,
    exportName: check.exportName,
    props: check.props,
  });

  if (error) {
    return { result: fail(requirement, error), container: null, errors };
  }
  if (errors.length > 0) {
    return {
      result: fail(
        requirement,
        `The component threw an error while rendering: ${errors[0].message}`
      ),
      container: null,
      errors,
    };
  }
  return { result: null, container, errors };
}

export async function rendersAssertion(engine, requirement) {
  const { result, container } = await renderFor(
    engine,
    requirement.check,
    requirement
  );
  if (result) {
    return result;
  }

  const hasElement = container.querySelector("*") !== null;
  if (!hasElement) {
    const text = normalizeText(container.textContent);
    if (text) {
      return fail(
        requirement,
        `The component returned a plain string (${JSON.stringify(text)}) instead of JSX. Wrap your output in a JSX element such as <div>...</div>.`
      );
    }
    return fail(
      requirement,
      "The component rendered nothing. Make sure it returns JSX."
    );
  }

  return pass(requirement);
}

export async function propsAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  if (!check.expect) {
    return pass(requirement);
  }

  const expected = check.expect;
  if (expected.text !== undefined && !expected.selector) {
    const actual = normalizeText(container.textContent);
    if (!actual.includes(expected.text)) {
      return fail(
        requirement,
        `Expected the component to use the passed props in its output: expected text "${expected.text}", but got ${
          actual ? `"${actual}"` : "nothing"
        }.`
      );
    }
    return pass(requirement);
  }

  const element = container.querySelector(expected.selector);
  if (!element) {
    return fail(
      requirement,
      `Expected the component to use the passed props: element "${expected.selector}" was not found in the rendered output.`
    );
  }
  const actual = normalizeText(element.textContent);
  if (expected.text !== undefined && actual !== expected.text) {
    return fail(
      requirement,
      `Expected "${expected.selector}" to show "${expected.text}" when rendered with the given props, but it shows "${actual}".`
    );
  }
  return pass(requirement);
}

export async function stateAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const target = String(check.value);
  const actual = normalizeText(container.textContent);
  if (!actual.includes(target)) {
    return fail(
      requirement,
      `Expected the component to show the initial state value "${target}" after rendering, but got ${
        actual ? `"${actual}"` : "nothing"
      }.`
    );
  }
  return pass(requirement);
}

async function textAssertion(engine, requirement, kind) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const target = String(check.text);
  const match = check.match || "contains";

  if (check.selector) {
    const element = container.querySelector(check.selector);
    if (!element) {
      return fail(
        requirement,
        `Expected element "${check.selector}" to be rendered, but it was not found.`
      );
    }
    const actual = normalizeText(element.textContent);
    const matched =
      match === "equals" ? actual === target : actual.includes(target);
    if (!matched) {
      return fail(
        requirement,
        `Expected "${check.selector}" text to ${
          match === "equals" ? "exactly equal" : "contain"
        } "${target}", but got ${actual ? `"${actual}"` : "nothing"}.`
      );
    }
    return pass(requirement);
  }

  const actual = normalizeText(container.textContent);
  const matched = match === "equals" ? actual === target : actual.includes(target);
  if (!matched) {
    return fail(
      requirement,
      `Expected the rendered output to ${
        match === "equals" ? "exactly equal" : "contain"
      } "${target}", but got ${actual ? `"${actual}"` : "nothing"}.`
    );
  }
  return pass(requirement);
}

export function hasTextAssertion(engine, requirement) {
  return textAssertion(engine, requirement);
}

/**
 * List-content assertions (v1.3.2).
 *
 * hasNoText — "text" must NOT appear anywhere in the rendered output.
 * hasItem   — "text" must appear (a semantic alias for list contents,
 *             with learner-friendly item messages).
 * missingItem — "text" must NOT appear (an item was removed).
 *
 * Optional check.fetch mocks are installed before rendering so CRUD
 * components can load their data before the check runs.
 */
async function listContentAssertion(engine, requirement, kind) {
  const { check } = requirement;
  if (check.fetch) {
    engine.setFetchMocks(check.fetch);
  }

  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const target = String(check.text);
  const actual = normalizeText(container.textContent);
  const present = actual.includes(target);

  if (kind === "hasItem") {
    if (!present) {
      return fail(
        requirement,
        `Expected the list to contain the item "${target}", but it was not found in the rendered output: ${
          actual ? `"${actual}"` : "nothing"
        }.`
      );
    }
    return pass(requirement);
  }

  if (present) {
    return fail(
      requirement,
      kind === "hasNoText"
        ? `Expected the text "${target}" to no longer be rendered, but it is still visible in the output: "${actual}".`
        : `Expected the item "${target}" to be removed from the list, but it is still rendered: "${actual}".`
    );
  }
  return pass(requirement);
}

export async function hasNoTextAssertion(engine, requirement) {
  return listContentAssertion(engine, requirement, "hasNoText");
}

export async function hasItemAssertion(engine, requirement) {
  return listContentAssertion(engine, requirement, "hasItem");
}

export async function missingItemAssertion(engine, requirement) {
  return listContentAssertion(engine, requirement, "missingItem");
}

export async function elementAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const element = container.querySelector(check.selector);
  if (!element) {
    return fail(
      requirement,
      `Expected an element matching "${check.selector}" to be rendered, but it was not found.`
    );
  }
  return pass(requirement);
}

export async function roleAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const element = getByRole(container, check.role, check.name);
  if (!element) {
    return fail(
      requirement,
      `Expected an element with role "${check.role}"${
        check.name !== undefined ? ` named "${check.name}"` : ""
      } to be rendered, but it was not found.`
    );
  }
  return pass(requirement);
}

export async function labelAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const element = getByLabel(container, check.label);
  if (!element) {
    return fail(
      requirement,
      `Expected a form control labelled "${check.label}" to be rendered, but it was not found. Use a <label> with a matching "for" attribute.`
    );
  }
  return pass(requirement);
}

export async function placeholderAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const element = getByPlaceholder(container, check.placeholder);
  if (!element) {
    return fail(
      requirement,
      `Expected an input with placeholder "${check.placeholder}" to be rendered, but it was not found.`
    );
  }
  return pass(requirement);
}

export async function buttonAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  if (check.count !== undefined) {
    const buttons = [...container.querySelectorAll("button")];
    if (buttons.length !== check.count) {
      return fail(
        requirement,
        `Expected ${check.count} button(s) to be rendered, but found ${buttons.length}.`
      );
    }
    return pass(requirement);
  }

  const button = getByRole(container, "button", check.name);
  if (!button) {
    return fail(
      requirement,
      `Expected a button${
        check.name !== undefined ? ` named "${check.name}"` : ""
      } to be rendered, but it was not found.`
    );
  }
  return pass(requirement);
}

export async function headingAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const selector = check.level ? `h${check.level}` : "h1, h2, h3, h4, h5, h6";
  const headings = [...container.querySelectorAll(selector)];
  if (headings.length === 0) {
    return fail(
      requirement,
      `Expected a heading${
        check.level ? ` of level ${check.level}` : ""
      } to be rendered, but none was found.`
    );
  }
  if (check.text !== undefined) {
    const heading = headings.find(
      (element) => normalizeText(element.textContent) === check.text
    );
    if (!heading) {
      return fail(
        requirement,
        `Expected a heading with text "${check.text}", but the rendered headings were: ${
          headings.map((element) => `"${normalizeText(element.textContent)}"`).join(", ") || "none"
        }.`
      );
    }
  }
  return pass(requirement);
}

export async function linkAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const links = [...container.querySelectorAll("a[href]")];
  if (links.length === 0) {
    return fail(
      requirement,
      "Expected a link (<a href=\"...\">) to be rendered, but none was found."
    );
  }

  if (check.text !== undefined) {
    const link = links.find(
      (element) => normalizeText(element.textContent) === check.text
    );
    if (!link) {
      return fail(
        requirement,
        `Expected a link with text "${check.text}", but the rendered links were: ${
          links.map((element) => `"${normalizeText(element.textContent)}"`).join(", ") || "none"
        }.`
      );
    }
    if (check.href !== undefined && link.getAttribute("href") !== check.href) {
      return fail(
        requirement,
        `Expected the link to point to "${check.href}", but it points to "${link.getAttribute("href")}".`
      );
    }
    return pass(requirement);
  }

  if (check.href !== undefined) {
    const link = links.find(
      (element) => element.getAttribute("href") === check.href
    );
    if (!link) {
      return fail(
        requirement,
        `Expected a link pointing to "${check.href}", but the rendered links were: ${
          links.map((element) => `"${element.getAttribute("href")}"`).join(", ") || "none"
        }.`
      );
    }
  }
  return pass(requirement);
}

export async function imageAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const images = [...container.querySelectorAll("img")];
  if (images.length === 0) {
    return fail(
      requirement,
      "Expected an image (<img>) to be rendered, but none was found."
    );
  }
  if (check.alt !== undefined) {
    const image = images.find(
      (element) => (element.getAttribute("alt") || "").trim() === check.alt
    );
    if (!image) {
      return fail(
        requirement,
        `Expected an image with alt text "${check.alt}", but the rendered images were: ${
          images.map((element) => `"${element.getAttribute("alt") || ""}"`).join(", ") || "none"
        }.`
      );
    }
  }
  return pass(requirement);
}

export async function listAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const list = container.querySelector("ul, ol");
  if (!list) {
    return fail(
      requirement,
      "Expected a list (<ul> or <ol>) to be rendered, but none was found."
    );
  }
  if (check.items !== undefined) {
    const items = list.querySelectorAll("li").length;
    if (items !== check.items) {
      return fail(
        requirement,
        `Expected the list to contain ${check.items} item(s), but it contains ${items}.`
      );
    }
  }
  return pass(requirement);
}

export async function formAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  if (!container.querySelector("form")) {
    return fail(
      requirement,
      "Expected a form to be rendered, but none was found."
    );
  }
  return pass(requirement);
}

export async function countAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const actual = container.querySelectorAll(check.selector).length;

  if (check.equals !== undefined) {
    if (actual !== check.equals) {
      return fail(
        requirement,
        `Expected ${check.equals} element(s) matching "${check.selector}", but found ${actual}.`
      );
    }
    return pass(requirement);
  }
  if (check.minimum !== undefined) {
    if (actual < check.minimum) {
      return fail(
        requirement,
        `Expected at least ${check.minimum} element(s) matching "${check.selector}", but found ${actual}.`
      );
    }
    return pass(requirement);
  }
  if (check.maximum !== undefined) {
    if (actual > check.maximum) {
      return fail(
        requirement,
        `Expected at most ${check.maximum} element(s) matching "${check.selector}", but found ${actual}.`
      );
    }
    return pass(requirement);
  }

  return fail(
    requirement,
    'The "count" assertion requires "equals", "minimum", or "maximum".'
  );
}

export async function conditionalAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const element = container.querySelector(check.selector);
  const visible = check.visible !== false;

  if (visible && !element) {
    return fail(
      requirement,
      `Expected element "${check.selector}" to be rendered for the given props (conditional rendering), but it was not found.`
    );
  }
  if (!visible && element) {
    return fail(
      requirement,
      `Expected element "${check.selector}" NOT to be rendered for the given props (conditional rendering), but it was found.`
    );
  }
  return pass(requirement);
}
