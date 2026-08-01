import { expect } from "../expect.js";
import { deepEqual } from "../../utils/deep-equal.js";
import { withTimeout, AsyncTimeoutError } from "../../utils/async.js";
import { ASYNC_TIMEOUT_MS, formatTimeoutMessage } from "../../constants/async.js";

const ASYNC_ASSERTIONS = new Set([
  "returnsPromise",
  "resolves",
  "rejects",
  "rejectsWith",
]);

/**
 * Whether a function assertion is one of the asynchronous assertions.
 *
 * @param {string} assertion - The check.assertion value.
 * @returns {boolean}
 */
export function isAsyncFunctionAssertion(assertion) {
  return ASYNC_ASSERTIONS.has(assertion);
}

/**
 * Formats an arbitrary value for use inside failure messages.
 *
 * @param {*} value
 * @returns {string}
 */
function formatValue(value) {
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Formats a promise rejection reason for use inside failure messages.
 * Handles host errors, errors created inside the sandbox, and plain
 * string rejections.
 *
 * @param {*} reason
 * @returns {string}
 */
function formatRejection(reason) {
  if (typeof reason === "string") {
    return reason;
  }
  if (
    reason !== null &&
    typeof reason === "object" &&
    typeof reason.message === "string"
  ) {
    return reason.message;
  }
  return formatValue(reason);
}

/**
 * Looks up the named function and calls it with the provided arguments.
 *
 * @returns {{value: *, failure: object|null}} The call result and any
 *          pre-promise failure (missing function, non-function, sync throw).
 */
function callFunction(engine, requirement, name, callArgs) {
  const result = engine.getValue(name);

  if (!result.exists) {
    return {
      value: undefined,
      failure: expect({
        requirement,
        condition: false,
        message: `Function "${name}" was not found.`,
      }),
    };
  }

  if (typeof result.value !== "function") {
    return {
      value: undefined,
      failure: expect({
        requirement,
        condition: false,
        message: `"${name}" exists but is not a function.`,
      }),
    };
  }

  let returned;
  try {
    returned = result.value(...callArgs);
  } catch (e) {
    return {
      value: undefined,
      failure: expect({
        requirement,
        condition: false,
        message: `Function "${name}(${callArgs.map(j => JSON.stringify(j)).join(", ")})" threw an error: ${e.message}.`,
      }),
    };
  }

  return { value: returned, failure: null };
}

/**
 * Checks that a call result is a real Promise.
 *
 * @returns {object|null} A failure result, or null when the value is a Promise.
 */
function requirePromise(requirement, name, returned) {
  if (
    returned &&
    typeof returned.then === "function" &&
    typeof returned.catch === "function"
  ) {
    return null;
  }
  return expect({
    requirement,
    condition: false,
    message: `Function "${name}" must return a Promise, but it returned ${formatValue(returned)}.`,
  });
}

/**
 * Executes one of the asynchronous function assertions.
 *
 * Supported check.assertion values:
 *   - returnsPromise — passes when the function returns a Promise.
 *   - resolves       — awaits the promise and deep-compares the resolved value.
 *   - rejects        — passes when the promise rejects.
 *   - rejectsWith    — passes when the promise rejects with the expected message.
 *
 * @param {object} engine - The JS execution engine (see createJSEngine).
 * @param {object} requirement - The requirement being evaluated.
 * @param {object} [options] - Internal options (e.g. { timeoutMs }).
 * @returns {Promise<object>} A result object (see createResult).
 */
export async function asyncFunctionAssertion(engine, requirement, options = {}) {
  const { check } = requirement;
  const { assertion, name, args, value } = check;

  const timeoutMs = options.timeoutMs ?? ASYNC_TIMEOUT_MS;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  const callArgs = args || [];

  const call = callFunction(engine, requirement, name, callArgs);
  if (call.failure) {
    return call.failure;
  }

  const promise = call.value;

  const notAPromise = requirePromise(requirement, name, promise);
  if (notAPromise) {
    return notAPromise;
  }

  if (assertion === "returnsPromise") {
    return expect({
      requirement,
      condition: true,
    });
  }

  let settled;
  try {
    settled = await withTimeout(promise, timeoutMs);
  } catch (e) {
    if (e instanceof AsyncTimeoutError) {
      return expect({
        requirement,
        condition: false,
        message: formatTimeoutMessage(name, timeoutMs),
      });
    }

    if (assertion === "rejects") {
      return expect({
        requirement,
        condition: true,
      });
    }

    if (assertion === "rejectsWith") {
      const rejectionMessage = formatRejection(e);
      if (rejectionMessage !== value) {
        return expect({
          requirement,
          condition: false,
          message: `Expected function "${name}" to reject with "${value}", but it rejected with: ${rejectionMessage}.`,
        });
      }
      return expect({
        requirement,
        condition: true,
      });
    }

    return expect({
      requirement,
      condition: false,
      message: `Expected function "${name}" to resolve, but it rejected with: ${formatRejection(e)}.`,
    });
  }

  if (assertion === "rejects") {
    return expect({
      requirement,
      condition: false,
      message: `Expected function "${name}" to reject, but it resolved to ${formatValue(settled)}.`,
    });
  }

  if (assertion === "rejectsWith") {
    return expect({
      requirement,
      condition: false,
      message: `Expected function "${name}" to reject with "${value}", but it resolved to ${formatValue(settled)}.`,
    });
  }

  if (value === undefined) {
    return expect({
      requirement,
      condition: true,
    });
  }

  if (!deepEqual(settled, value)) {
    return expect({
      requirement,
      condition: false,
      message: `Expected "${name}" to resolve to ${formatValue(value)}, but it resolved to ${formatValue(settled)}.`,
    });
  }

  return expect({
    requirement,
    condition: true,
  });
}
