import { expect } from "../expect.js";

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
      const exists = !!doc.querySelector(selector);
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
      const exists = !!doc.querySelector(selector);
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
      const el = doc.querySelector(selector);
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
      const el = doc.querySelector(selector);
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
      const el = doc.querySelector(selector);
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
      let query = selector;
      if (tagName && !query) {
        query = tagName;
        if (parent) {
          const parentEl = doc.querySelector(parent);
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
      const exists = !!doc.querySelector(query);
      if (!exists) {
        return expect({
          requirement,
          condition: false,
          message: `Expected element "${query}" to be created in the DOM.`,
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
