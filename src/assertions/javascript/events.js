import { expect } from "../expect.js";

const EVENTS_ASSERTIONS = new Set([
  "listenerExists",
  "dispatch",
  "inputValueChanges",
]);

const KEYBOARD_EVENTS = new Set(["keydown", "keyup", "keypress"]);

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

function fail(requirement, message) {
  return expect({ requirement, condition: false, message });
}

/**
 * Builds a browser event for the given event type.
 *
 * Keyboard events use KeyboardEvent (when a key is provided) so student
 * handlers that inspect `event.key` behave as in a real browser; all
 * other events use a bubbling, cancelable Event.
 *
 * @param {object} engine - The JS execution engine.
 * @param {string} eventType - The event type (e.g. "click", "keydown").
 * @param {string} [key] - Optional key for keyboard events.
 * @returns {Event} A jsdom event.
 */
function createEvent(engine, eventType, key) {
  if (KEYBOARD_EVENTS.has(eventType) && key !== undefined && engine.window.KeyboardEvent) {
    return new engine.window.KeyboardEvent(eventType, {
      key,
      bubbles: true,
      cancelable: true,
    });
  }
  return new engine.window.Event(eventType, { bubbles: true, cancelable: true });
}

/**
 * Dispatches an event on an element and reports dispatch failures.
 *
 * @param {object} engine
 * @param {object} requirement
 * @param {Element} element - The jsdom element.
 * @param {string} eventType - The event type to dispatch.
 * @param {string} [key] - Optional key for keyboard events.
 * @returns {object|null} A failed result, or null when dispatch succeeded.
 */
function dispatchOn(engine, requirement, element, eventType, key) {
  const event = createEvent(engine, eventType, key);
  try {
    element.dispatchEvent(event);
    return null;
  } catch (e) {
    return fail(
      requirement,
      `Dispatching "${eventType}" on the element caused an error: ${e.message}.`
    );
  }
}

/**
 * Verifies an expected post-event state.
 *
 * `check.expect` must contain `{ selector, text }`; the element selected
 * by `expect.selector` must have `expect.text` as its text content after
 * the event was handled.
 *
 * @param {object} engine
 * @param {object} requirement
 * @param {string} label - Human-readable description of what happened.
 * @returns {object} A result object.
 */
function verifyExpect(engine, requirement, label) {
  const { expect: expected } = requirement.check;

  const { element, error } = query(engine.document, expected.selector);
  if (error) {
    return fail(
      requirement,
      `After ${label}, expected selector "${expected.selector}" is invalid.`
    );
  }
  if (!element) {
    return fail(
      requirement,
      `After ${label}, expected element "${expected.selector}" was not found.`
    );
  }

  const actualText = element.textContent.trim();
  if (actualText !== expected.text) {
    return fail(
      requirement,
      `After ${label}, expected "${expected.selector}" text to be "${expected.text}", but got "${actualText}".`
    );
  }

  return expect({ requirement, condition: true });
}

/**
 * Verifies that an element has a registered event listener.
 *
 * @param {object} engine
 * @param {object} requirement
 * @returns {object} A result object.
 */
function listenerExists(engine, requirement) {
  const { selector, event: eventType } = requirement.check;

  const { element, error } = query(engine.document, selector);
  if (error) {
    return fail(requirement, `Invalid selector "${selector}" for events assertion.`);
  }
  if (!element) {
    return fail(
      requirement,
      `Element "${selector}" not found for listener check.`
    );
  }

  const listeners = engine.getListeners(element, eventType);
  if (listeners.length === 0) {
    const tracked = engine.listenerRegistry.filter(
      (record) => record.target === element
    );
    const registered = [...new Set(tracked.map(r => r.event))].join(", ");
    return fail(
      requirement,
      `Expected "${selector}" to have a "${eventType}" listener, but none was registered.${
        registered ? ` Registered listeners on the element: ${registered}.` : ""
      }`
    );
  }

  return expect({ requirement, condition: true });
}

/**
 * Dispatches an event and verifies the application's response.
 *
 * @param {object} engine
 * @param {object} requirement
 * @returns {object} A result object.
 */
function dispatch(engine, requirement) {
  const { selector, event: eventType, key } = requirement.check;

  const { element, error } = query(engine.document, selector);
  if (error) {
    return fail(requirement, `Invalid selector "${selector}" for events assertion.`);
  }
  if (!element) {
    return fail(
      requirement,
      `Element "${selector}" not found for "${eventType}" dispatch.`
    );
  }

  const dispatchResult = dispatchOn(engine, requirement, element, eventType, key);
  if (dispatchResult) {
    return dispatchResult;
  }

  return verifyExpect(engine, requirement, `dispatching "${eventType}" on "${selector}"`);
}

/**
 * Sets an input value, dispatches input/change events, and verifies the
 * application's response.
 *
 * @param {object} engine
 * @param {object} requirement
 * @returns {object} A result object.
 */
function inputValueChanges(engine, requirement) {
  const { selector, value } = requirement.check;

  const { element, error } = query(engine.document, selector);
  if (error) {
    return fail(requirement, `Invalid selector "${selector}" for events assertion.`);
  }
  if (!element) {
    return fail(
      requirement,
      `Input element "${selector}" not found for value change.`
    );
  }

  element.value = value;

  const inputResult = dispatchOn(engine, requirement, element, "input");
  if (inputResult) {
    return inputResult;
  }
  const changeResult = dispatchOn(engine, requirement, element, "change");
  if (changeResult) {
    return changeResult;
  }

  return verifyExpect(engine, requirement, `setting "${selector}" to "${value}"`);
}

/**
 * Event assertion (type "events").
 *
 * Verifies that JavaScript applications correctly respond to browser
 * events. All checks run against the shared execution engine — the same
 * jsdom instance that executed the student's code.
 *
 * Supported check.assertion values:
 *   - listenerExists    — element has a registered listener for the event.
 *   - dispatch          — dispatch an event and verify the resulting state.
 *   - inputValueChanges — set an input value, dispatch input/change, verify.
 *
 * @param {object} engine - The JS execution engine (see createJSEngine).
 * @param {object} requirement - The requirement being evaluated.
 * @returns {object} A result object (see createResult).
 */
export function eventsAssertion(engine, requirement) {
  const { check } = requirement;
  const { assertion } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  if (!EVENTS_ASSERTIONS.has(assertion)) {
    return expect({
      requirement,
      condition: false,
      message: `Unknown events assertion: "${assertion}". Valid values: listenerExists, dispatch, inputValueChanges.`,
    });
  }

  switch (assertion) {
    case "listenerExists":
      return listenerExists(engine, requirement);
    case "dispatch":
      return dispatch(engine, requirement);
    case "inputValueChanges":
      return inputValueChanges(engine, requirement);
  }
}

export function eventAssertion(engine, requirement) {
  const { check } = requirement;
  const { assertion, selector, effect } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  const element = engine.document.querySelector(selector);

  if (!element) {
    return expect({
      requirement,
      condition: false,
      message: `Element "${selector}" not found for event dispatch.`,
    });
  }

  const eventType = assertion;

  let event;
  if (eventType === "submit") {
    event = new engine.window.Event(eventType, { bubbles: true, cancelable: true });
  } else if (eventType === "click" || eventType === "input" || eventType === "change") {
    event = new engine.window.Event(eventType, { bubbles: true, cancelable: true });
  } else {
    event = new engine.window.Event(eventType, { bubbles: true, cancelable: true });
  }

  let dispatchError = null;
  try {
    element.dispatchEvent(event);
  } catch (e) {
    dispatchError = e;
  }

  if (dispatchError) {
    return expect({
      requirement,
      condition: false,
      message: `Dispatching "${eventType}" on "${selector}" caused an error: ${dispatchError.message}.`,
    });
  }

  if (effect) {
    const { target, property, equals } = effect;
    const effectEl = engine.document.querySelector(target);

    if (!effectEl) {
      return expect({
        requirement,
        condition: false,
        message: `After "${eventType}" on "${selector}", effect target "${target}" not found.`,
      });
    }

    const actualValue = effectEl[property];
    const actualStr = String(actualValue).trim();
    const expectedStr = String(equals);

    if (actualStr !== expectedStr) {
      return expect({
        requirement,
        condition: false,
        message: `After "${eventType}" on "${selector}", expected "${target}".${property} to be "${equals}", but got "${actualStr}".`,
      });
    }
  }

  return expect({
    requirement,
    condition: true,
  });
}
