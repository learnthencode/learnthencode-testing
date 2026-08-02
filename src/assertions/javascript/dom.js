import { expect } from "../expect.js";

/**
 * Runs a selector through the live DOM.
 *
 * Invalid selectors throw a SyntaxError in browsers, so they are
 * captured and reported as a failed assertion instead of crashing the
 * whole test run.
 *
 * @param {Document} doc - The jsdom document (shared with the engine).
 * @param {string} selector - The CSS selector to query.
 * @returns {{ element: Element|null, error: string|null }}
 */
function query(doc, selector) {
  try {
    return { element: doc.querySelector(selector), error: null };
  } catch (e) {
    return { element: null, error: e.message };
  }
}

/**
 * Returns a failed result for a selector that could not be queried.
 *
 * @param {object} requirement
 * @param {string} selector
 * @returns {object}
 */
function invalidSelector(requirement, selector) {
  return expect({
    requirement,
    condition: false,
    message: `Invalid selector "${selector}" for DOM assertion.`,
  });
}

export function domAssertion(engine, requirement) {
  const { check } = requirement;
  const { assertion, selector, value, className, tagName, parent } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  const doc = engine.document;

  switch (assertion) {
    case "elementExists": {
      const { element, error } = query(doc, selector);
      if (error) return invalidSelector(requirement, selector);
      const exists = !!element;
      if (!exists) {
        return expect({
          requirement,
          condition: false,
          message: `Expected element "${selector}" to exist in the DOM.`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "elementRemoved": {
      const { element, error } = query(doc, selector);
      if (error) return invalidSelector(requirement, selector);
      const exists = !!element;
      if (exists) {
        return expect({
          requirement,
          condition: false,
          message: `Expected element "${selector}" to be removed from the DOM.`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "textUpdated": {
      const { element: el, error } = query(doc, selector);
      if (error) return invalidSelector(requirement, selector);
      if (!el) {
        return expect({
          requirement,
          condition: false,
          message: `Element "${selector}" not found for text check.`,
        });
      }
      const actualText = el.textContent.trim();
      if (actualText !== value) {
        return expect({
          requirement,
          condition: false,
          message: `Expected "${selector}" text to be "${value}", but got "${actualText}".`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "classAdded": {
      const { element: el, error } = query(doc, selector);
      if (error) return invalidSelector(requirement, selector);
      if (!el) {
        return expect({
          requirement,
          condition: false,
          message: `Element "${selector}" not found for class check.`,
        });
      }
      if (!el.classList.contains(className)) {
        return expect({
          requirement,
          condition: false,
          message: `Expected "${selector}" to have class "${className}", but it was not found.`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "classRemoved": {
      const { element: el, error } = query(doc, selector);
      if (error) return invalidSelector(requirement, selector);
      if (!el) {
        return expect({
          requirement,
          condition: false,
          message: `Element "${selector}" not found for class check.`,
        });
      }
      if (el.classList.contains(className)) {
        return expect({
          requirement,
          condition: false,
          message: `Expected "${selector}" to not have class "${className}", but it was found.`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "elementCreated": {
      if (!tagName && !selector) {
        return expect({
          requirement,
          condition: false,
          message: `Assertion "elementCreated" requires "tagName" or "selector".`,
        });
      }
      let checkQuery = selector;
      if (tagName && !checkQuery) {
        checkQuery = tagName;
        if (parent) {
          const { element: parentEl, error: parentError } = query(doc, parent);
          if (parentError) return invalidSelector(requirement, parent);
          if (!parentEl) {
            return expect({
              requirement,
              condition: false,
              message: `Parent element "${parent}" not found.`,
            });
          }
          const children = parentEl.querySelectorAll(tagName);
          if (children.length === 0) {
            return expect({
              requirement,
              condition: false,
              message: `Expected a <${tagName}> element inside "${parent}".`,
            });
          }
          return expect({ requirement, condition: true });
        }
      }
      const { element, error } = query(doc, checkQuery);
      if (error) return invalidSelector(requirement, checkQuery);
      const exists = !!element;
      if (!exists) {
        return expect({
          requirement,
          condition: false,
          message: `Expected element "${checkQuery}" to be created in the DOM.`,
        });
      }
      return expect({ requirement, condition: true });
    }

    default:
      return expect({
        requirement,
        condition: false,
        message: `Unknown DOM assertion: "${assertion}".`,
      });
  }
}
