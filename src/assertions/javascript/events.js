import { expect } from "../expect.js";

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
