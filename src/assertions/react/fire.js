import { act } from "./environment.js";
import { flushAsync } from "./render.js";

/**
 * User interaction helpers for React assertions (v1.3.0).
 *
 * Every interaction is wrapped in React 19's act() so state updates
 * triggered by the event are flushed before the returned promise
 * resolves. Controlled inputs (the React pattern taught in the course)
 * ignore plain `.value = ...` assignment — React tracks the input value
 * via a native value tracker — so the native prototype setter is used
 * before dispatching the event, exactly like react-testing-library does.
 */

function getEventView(element) {
  return element.ownerDocument.defaultView;
}

function setNativeValue(element, value) {
  const prototype = element.constructor?.prototype;
  const descriptor =
    (prototype && Object.getOwnPropertyDescriptor(prototype, "value")) ||
    Object.getOwnPropertyDescriptor(element, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
}

function dispatch(element, eventName, eventClass, init = {}) {
  const EventClass =
    eventClass || getEventView(element).Event;
  const event = new EventClass(eventName, {
    bubbles: true,
    cancelable: true,
    composed: true,
    ...init,
  });
  element.dispatchEvent(event);
}

function focusElement(element) {
  dispatch(element, "focusin", null, { composed: true });
}

function fireChangeOnTextControl(element) {
  // React 19 reports onChange for text inputs through its input-event
  // polyfill: on keydown/keyup/selectionchange of the ACTIVE element, the
  // component's change handlers fire when the tracked value differs from
  // the element's value. A focusin first makes the input the active
  // element inside React, then the keydown dispatch triggers onChange.
  focusElement(element);
  dispatch(
    element,
    "keydown",
    getEventView(element).KeyboardEvent,
    { key: "Enter", composed: true }
  );
}

async function inAct(action) {
  await act(async () => {
    action();
    await flushAsync();
  });
}

const IS_CHECKABLE = (element) =>
  element.type === "checkbox" || element.type === "radio";

/**
 * Clicks an element (button, link, checkbox, ...).
 *
 * @param {Element} element - The element to click.
 * @returns {Promise<void>}
 */
export async function clickElement(element) {
  await inAct(() => {
    dispatch(element, "click", getEventView(element).MouseEvent);
  });
}

/**
 * Types a value into an input or textarea (controlled-component style).
 *
 * @param {Element} element - The input or textarea.
 * @param {string} value - The value to set.
 * @returns {Promise<void>}
 */
export async function typeInto(element, value) {
  await inAct(() => {
    setNativeValue(element, value);
    fireChangeOnTextControl(element);
  });
}

/**
 * Changes a control's value: checkbox/radio via click, select via the
 * change event, everything else via the input change path.
 *
 * @param {Element} element - The control to change.
 * @param {object} [options] - { value, checked }.
 * @returns {Promise<void>}
 */
export async function changeControl(element, options = {}) {
  if (IS_CHECKABLE(element)) {
    // jsdom's click already toggles the checked state, so pre-setting it
    // would cancel out; click alone mirrors what a learner's click does.
    await inAct(() => {
      dispatch(element, "click", getEventView(element).MouseEvent);
    });
    return;
  }

  if (element.tagName === "SELECT") {
    await inAct(() => {
      setNativeValue(element, options.value ?? "");
      dispatch(element, "change");
    });
    return;
  }

  await inAct(() => {
    setNativeValue(element, options.value ?? "");
    fireChangeOnTextControl(element);
  });
}

/**
 * Selects an option in a <select> menu.
 *
 * @param {Element} element - The select element.
 * @param {string} value - The option value to select.
 * @returns {Promise<void>}
 */
export async function selectOption(element, value) {
  await inAct(() => {
    setNativeValue(element, value);
    dispatch(element, "change");
  });
}

/**
 * Submits a form.
 *
 * @param {Element} form - The form element.
 * @returns {Promise<void>}
 */
export async function submitForm(form) {
  await inAct(() => {
    dispatch(form, "submit");
  });
}

/**
 * Dispatches a keyboard event (e.g. keydown with key "Enter").
 *
 * @param {Element} element - The focused element.
 * @param {string} key - The key value (e.g. "Enter").
 * @param {string} [eventType] - Event type (default "keydown").
 * @returns {Promise<void>}
 */
export async function keyDown(element, key, eventType = "keydown") {
  await inAct(() => {
    // React's change polyfill reads the active element, and its keydown
    // handler would otherwise crash when nothing is focused.
    focusElement(element);
    dispatch(element, eventType, getEventView(element).KeyboardEvent, {
      key,
    });
  });
}

/**
 * Standalone fireEvent object for `.test.js` files.
 *
 *   import { fireEvent } from "learnthencode-testing/src/assertions/react/fire.js";
 *   await fireEvent.click(button);
 *   await fireEvent.type(input, "Ada");
 *   await fireEvent.select(menu, "option-1");
 *   await fireEvent.submit(form);
 *   await fireEvent.keyDown(input, "Enter");
 */
export const fireEvent = {
  click: clickElement,
  type: typeInto,
  input: typeInto,
  change: changeControl,
  select: selectOption,
  submit: submitForm,
  keyDown,
  toggle: clickElement,
};
