import { expect } from "../expect.js";
import {
  clickElement,
  typeInto,
  changeControl,
  selectOption,
  submitForm,
} from "./fire.js";
import { flushAsync } from "./render.js";
import { act } from "./environment.js";

/**
 * Interaction assertions (v1.3.0).
 *
 * Each assertion renders the named component, simulates a user action in
 * an act() scope, and verifies the resulting UI:
 *
 *   - click   — click a button/element, verify the updated UI.
 *   - type    — type into an input/textarea, verify the updated UI.
 *   - change  — change a checkbox, select, or other control.
 *   - select  — pick an option from a <select> menu.
 *   - submit  — fill (optional) values and submit the form.
 *   - reset   — fill an input, then click a reset button and verify.
 */

function fail(requirement, message) {
  return expect({ requirement, condition: false, message });
}

function pass(requirement) {
  return expect({ requirement, condition: true });
}

/**
 * Verifies an expected post-interaction state (v1.3.2 supports multiple
 * expectations within a single interaction).
 *
 * check.expect shapes:
 *   - { text }                  — the rendered output contains text.
 *   - { selector, text }        — the element's text equals text (legacy
 *                                 single-rule form).
 *   - { selector, value }       — the element's value property equals value.
 *   - { selector, checked }     - the element's checked property matches.
 *   - { hasNoText }             — the text is absent from the output (v1.3.2).
 *   - { hasItem }               — the text is present (v1.3.2).
 *   - { missingItem }           - the text is absent (v1.3.2).
 *
 * When more than one rule is present, every rule is evaluated; `text`
 * and `hasItem` check the whole output, `hasNoText`/`missingItem` check
 * absence, and a `selector`-based `value`/`checked` checks the element.
 * The first failing rule determines the failure message.
 *
 * @param {Element} container - The rendered container.
 * @param {object} expected - The expect object.
 * @param {string} label - What happened (for failure messages).
 * @returns {{ ok: boolean, message: string }}
 */
export function verifyExpect(container, expected, label) {
  const isLegacyElementText =
    expected.selector &&
    expected.text !== undefined &&
    expected.value === undefined &&
    expected.checked === undefined &&
    expected.hasNoText === undefined &&
    expected.hasItem === undefined &&
    expected.missingItem === undefined;

  if (isLegacyElementText) {
    const element = container.querySelector(expected.selector);
    if (!element) {
      return {
        ok: false,
        message: `After ${label}, expected element "${expected.selector}" to be rendered, but it was not found.`,
      };
    }
    const actual = element.textContent.trim();
    if (actual !== expected.text) {
      return {
        ok: false,
        message: `After ${label}, expected "${expected.selector}" to show "${expected.text}", but it shows "${actual}".`,
      };
    }
    return { ok: true, message: "" };
  }

  if (expected.hasNoText !== undefined) {
    if (container.textContent.includes(expected.hasNoText)) {
      return {
        ok: false,
        message: `After ${label}, expected the text "${expected.hasNoText}" to no longer be rendered, but it is still visible in the output: "${container.textContent.trim()}".`,
      };
    }
  }

  if (expected.missingItem !== undefined) {
    if (container.textContent.includes(expected.missingItem)) {
      return {
        ok: false,
        message: `After ${label}, expected the item "${expected.missingItem}" to be removed from the list, but it is still rendered: "${container.textContent.trim()}".`,
      };
    }
  }

  if (expected.text !== undefined) {
    const actual = container.textContent.trim();
    if (!actual.includes(expected.text)) {
      return {
        ok: false,
        message: `After ${label}, expected the rendered output to contain "${expected.text}", but got ${
          actual ? `"${actual}"` : "nothing"
        }.`,
      };
    }
  }

  if (expected.hasItem !== undefined) {
    if (!container.textContent.includes(expected.hasItem)) {
      return {
        ok: false,
        message: `After ${label}, expected the list to contain the item "${expected.hasItem}", but it was not found in the rendered output: ${
          container.textContent.trim() ? `"${container.textContent.trim()}"` : "nothing"
        }.`,
      };
    }
  }

  if (expected.selector) {
    const element = container.querySelector(expected.selector);
    if (!element) {
      return {
        ok: false,
        message: `After ${label}, expected element "${expected.selector}" to be rendered, but it was not found.`,
      };
    }

    if (expected.value !== undefined) {
      const actual = element.value ?? "";
      if (String(actual) !== String(expected.value)) {
        return {
          ok: false,
          message: `After ${label}, expected "${expected.selector}" value to be "${expected.value}", but it is "${actual}".`,
        };
      }
    }

    if (expected.checked !== undefined) {
      const actual = !!element.checked;
      if (actual !== !!expected.checked) {
        return {
          ok: false,
          message: `After ${label}, expected "${expected.selector}" to be ${
            expected.checked ? "checked" : "unchecked"
          }, but it is ${actual ? "checked" : "unchecked"}.`,
        };
      }
    }
  }

  const hasAnyRule =
    isLegacyElementText ||
    expected.text !== undefined ||
    expected.hasNoText !== undefined ||
    expected.hasItem !== undefined ||
    expected.missingItem !== undefined ||
    (expected.selector &&
      (expected.value !== undefined || expected.checked !== undefined));

  if (!hasAnyRule) {
    return { ok: false, message: 'Invalid "expect" object.' };
  }

  return { ok: true, message: "" };
}

/**
 * Renders the component and guards against load/render errors.
 */
async function renderFor(engine, check, requirement) {
  const { container, errors, error } = await engine.renderComponent({
    file: check.component,
    exportName: check.exportName,
    props: check.props,
  });

  if (error) {
    return { result: fail(requirement, error), container: null };
  }
  if (errors.length > 0) {
    return {
      result: fail(
        requirement,
        `The component threw an error while rendering: ${errors[0].message}`
      ),
      container: null,
    };
  }
  return { result: null, container };
}

function findInteractionTarget(requirement, container, selector) {
  const element = container.querySelector(selector);
  if (!element) {
    return fail(
      requirement,
      `Expected an element matching "${selector}" to be rendered so it can be interacted with, but it was not found.`
    );
  }
  return null;
}

function dispatchError(requirement, errors, label) {
  if (errors.length > 0) {
    return fail(
      requirement,
      `${label} caused an error: ${errors[0].message}`
    );
  }
  return null;
}

/**
 * Installs check.fetch mocks before rendering so a CRUD component's
 * mount request (and the request triggered by the interaction) hits the
 * declared routes (v1.3.2).
 */
function installFetchMocks(engine, check) {
  if (check.fetch) {
    engine.setFetchMocks(check.fetch);
  }
}

/**
 * Flushes promises scheduled by mocked fetch calls inside act() so the
 * UI reflects the request outcome before expectations are verified.
 */
async function settle(rounds = 8) {
  await act(async () => {
    await flushAsync(rounds);
  });
}

/**
 * Finds the form that encloses the first control named in check.values,
 * falling back to the first form in the container.
 */
export function formForValues(container, values) {
  for (const selector of Object.keys(values)) {
    const element = container.querySelector(selector);
    if (element && typeof element.closest === "function") {
      const form = element.closest("form");
      if (form) {
        return form;
      }
    }
  }
  return container.querySelector("form");
}

/**
 * Fills every input named in check.values and submits the enclosing
 * form (v1.3.2, used by click and the CRUD request assertions).
 *
 * @returns {Promise<object|null>} A failure result, or null on success.
 */
async function fillAndSubmitValues(requirement, container, values) {
  for (const [selector, value] of Object.entries(values)) {
    const input = container.querySelector(selector);
    if (!input) {
      return fail(
        requirement,
        `Expected an input matching "${selector}" (declared in "values") to be rendered, but it was not found.`
      );
    }
    await typeInto(input, value);
  }

  const form = formForValues(container, values);
  if (!form) {
    return fail(
      requirement,
      "Expected a form to be rendered for submission, but it was not found."
    );
  }
  await submitForm(form);
  return null;
}

export async function clickAssertion(engine, requirement) {
  const { check } = requirement;
  installFetchMocks(engine, check);
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const targetError = findInteractionTarget(requirement, container, check.selector);
  if (targetError) {
    return targetError;
  }
  const element = container.querySelector(check.selector);

  await clickElement(element);

  if (check.fetch) {
    await settle();
  }

  if (check.values) {
    const fillError = await fillAndSubmitValues(requirement, container, check.values);
    if (fillError) {
      return fillError;
    }
    if (check.fetch) {
      await settle();
    }
  }

  const errorResult = dispatchError(
    requirement,
    engine.environment.activeErrorSink ?? [],
    `Clicking "${check.selector}"`
  );
  if (errorResult) {
    return errorResult;
  }

  const verification = verifyExpect(
    container,
    check.expect,
    `clicking "${check.selector}"`
  );
  if (!verification.ok) {
    return fail(requirement, verification.message);
  }
  return pass(requirement);
}

export async function typeAssertion(engine, requirement) {
  const { check } = requirement;
  installFetchMocks(engine, check);
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const targetError = findInteractionTarget(requirement, container, check.selector);
  if (targetError) {
    return targetError;
  }
  const element = container.querySelector(check.selector);

  await typeInto(element, check.value);

  if (check.fetch) {
    await settle();
  }

  const errorResult = dispatchError(
    requirement,
    engine.environment.activeErrorSink ?? [],
    `Typing "${check.value}" into "${check.selector}"`
  );
  if (errorResult) {
    return errorResult;
  }

  const verification = verifyExpect(
    container,
    check.expect,
    `typing "${check.value}" into "${check.selector}"`
  );
  if (!verification.ok) {
    return fail(requirement, verification.message);
  }
  return pass(requirement);
}

export async function changeAssertion(engine, requirement) {
  const { check } = requirement;
  installFetchMocks(engine, check);
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const targetError = findInteractionTarget(requirement, container, check.selector);
  if (targetError) {
    return targetError;
  }
  const element = container.querySelector(check.selector);

  await changeControl(element, {
    value: check.value,
    checked: check.checked,
  });

  if (check.fetch) {
    await settle();
  }

  const errorResult = dispatchError(
    requirement,
    engine.environment.activeErrorSink ?? [],
    `Changing "${check.selector}"`
  );
  if (errorResult) {
    return errorResult;
  }

  const verification = verifyExpect(
    container,
    check.expect,
    `changing "${check.selector}"`
  );
  if (!verification.ok) {
    return fail(requirement, verification.message);
  }
  return pass(requirement);
}

export async function selectAssertion(engine, requirement) {
  const { check } = requirement;
  installFetchMocks(engine, check);
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const targetError = findInteractionTarget(requirement, container, check.selector);
  if (targetError) {
    return targetError;
  }
  const element = container.querySelector(check.selector);

  await selectOption(element, check.value);

  if (check.fetch) {
    await settle();
  }

  const errorResult = dispatchError(
    requirement,
    engine.environment.activeErrorSink ?? [],
    `Selecting "${check.value}" in "${check.selector}"`
  );
  if (errorResult) {
    return errorResult;
  }

  const verification = verifyExpect(
    container,
    check.expect,
    `selecting "${check.value}" in "${check.selector}"`
  );
  if (!verification.ok) {
    return fail(requirement, verification.message);
  }
  return pass(requirement);
}

export async function submitAssertion(engine, requirement) {
  const { check } = requirement;
  installFetchMocks(engine, check);
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const form = check.selector
    ? container.querySelector(check.selector)
    : container.querySelector("form");

  if (!form) {
    return fail(
      requirement,
      `Expected a form${
        check.selector ? ` matching "${check.selector}"` : ""
      } to be rendered for submission, but it was not found.`
    );
  }

  if (check.values) {
    // Fills the inputs and submits the form that encloses them.
    const fillError = await fillAndSubmitValues(requirement, container, check.values);
    if (fillError) {
      return fillError;
    }
  } else {
    await submitForm(form);
  }

  if (check.fetch) {
    await settle();
  }

  const errorResult = dispatchError(
    requirement,
    engine.environment.activeErrorSink ?? [],
    "Submitting the form"
  );
  if (errorResult) {
    return errorResult;
  }

  const verification = verifyExpect(container, check.expect, "submitting the form");
  if (!verification.ok) {
    return fail(requirement, verification.message);
  }
  return pass(requirement);
}

export async function resetAssertion(engine, requirement) {
  const { check } = requirement;
  installFetchMocks(engine, check);
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const inputError = findInteractionTarget(requirement, container, check.selector);
  if (inputError) {
    return inputError;
  }
  const input = container.querySelector(check.selector);

  await typeInto(input, check.value);

  const resetButton = container.querySelector(check.resetSelector);
  if (!resetButton) {
    return fail(
      requirement,
      `Expected a reset button matching "${check.resetSelector}" to be rendered, but it was not found.`
    );
  }

  await act(async () => {
    resetButton.dispatchEvent(
      new (container.ownerDocument.defaultView.MouseEvent)("click", {
        bubbles: true,
        cancelable: true,
      })
    );
    await flushAsync();
  });

  if (check.fetch) {
    await settle();
  }

  const errorResult = dispatchError(
    requirement,
    engine.environment.activeErrorSink ?? [],
    `Clicking the reset button "${check.resetSelector}"`
  );
  if (errorResult) {
    return errorResult;
  }

  const verification = verifyExpect(
    container,
    check.expect,
    "resetting the form"
  );
  if (!verification.ok) {
    return fail(requirement, verification.message);
  }
  return pass(requirement);
}
