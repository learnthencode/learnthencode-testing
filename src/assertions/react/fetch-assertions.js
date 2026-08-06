import { expect } from "../expect.js";
import { flushAsync } from "./render.js";
import { act } from "./environment.js";
import { verifyExpect, formForValues } from "./interactions.js";
import { fetchCallMatches } from "./fetch.js";
import { typeInto, clickElement, submitForm } from "./fire.js";
import { deepEqual } from "../../utils/deep-equal.js";

/**
 * Fetch mocking assertions (v1.3.0, CRUD methods + request checks v1.3.2).
 *
 * The check declares mock routes (exact URL keys, longest-substring or
 * "*" catch-all supported; method-prefixed keys like "POST /api/users"
 * since v1.3.2) and the expected UI state after the fetch settles. The
 * engine intercepts window.fetch for the lab code.
 *
 *   check.fetch = {
 *     "/api/users": { scenario: "success", status: 200, body: [...] },
 *     "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } }
 *   }
 *   check.expect = { text } | { loading: true } | { empty: true } | { error: true }
 *
 * Two CRUD request assertions (v1.3.2) verify the requests the component
 * actually sends after an optional interaction (check.selector clicks an
 * element, check.values fills inputs and submits the enclosing form):
 *
 *   - method      — a request with check.expect.method and
 *                   check.expect.url was recorded.
 *   - requestBody — a request whose JSON body deep-equals check.expect
 *                   was recorded.
 */

function fail(requirement, message) {
  return expect({ requirement, condition: false, message });
}

function pass(requirement) {
  return expect({ requirement, condition: true });
}

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

async function settle(rounds = 8) {
  await act(async () => {
    await flushAsync(rounds);
  });
}

/**
 * An empty state is either a blank output or a typical "nothing to show"
 * message ("No users found.", "Nothing here", ...).
 */
const EMPTY_STATE_PATTERN =
  /no (users|items|data|results|records|matches|books|posts|things)|nothing (to )?(show|see|display)|no (users|items|data|results|records|matches|books|posts|things) found|empty/i;

function isEmptyState(text) {
  return text.trim().length === 0 || EMPTY_STATE_PATTERN.test(text);
}

export async function fetchAssertion(engine, requirement) {
  const { check } = requirement;
  if (check.fetch) {
    // Must be installed before the component renders: a useEffect runs
    // during the render flush, so mocks set afterwards are too late.
    engine.setFetchMocks(check.fetch);
  }

  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  await settle();

  const urls = check.fetch ? Object.keys(check.fetch) : [];
  for (const key of urls) {
    if (key === "*") {
      // A catch-all matches any URL the component may call; behavior
      // is verified through the expect checks below.
      continue;
    }
    const called = engine.fetchCalls.some((call) => fetchCallMatches(call, key));
    if (!called) {
      return fail(
        requirement,
        `Expected the component to call fetch("${key}"), but no such call was made.`
      );
    }
  }

  if (check.expect) {
    if (check.expect.text !== undefined) {
      const verification = verifyExpect(
        container,
        { text: check.expect.text },
        "the fetch response was processed"
      );
      if (!verification.ok) {
        return fail(requirement, verification.message);
      }
    }

    if (check.expect.loading === true) {
      const appears = /loading|loading\.\.\.|\.\.\./i.test(
        container.textContent
      );
      if (!appears) {
        return fail(
          requirement,
          `Expected the component to show a loading state before the fetch settles, but the rendered output was: "${container.textContent.trim()}".`
        );
      }
    }

    if (check.expect.empty === true) {
      const text = container.textContent;
      if (!isEmptyState(text)) {
        return fail(
          requirement,
          `Expected the component to show an empty state when the fetch returns no data, but the rendered output was: "${text.trim()}".`
        );
      }
    }

    if (check.expect.error === true) {
      const hasErrorText = /error|failed|something went wrong/i.test(
        container.textContent
      );
      if (!hasErrorText) {
        return fail(
          requirement,
          `Expected the component to show an error state when the fetch fails, but the rendered output was: "${container.textContent.trim()}".`
        );
      }
    }
  }

  return pass(requirement);
}

// ---------------------------------------------------------------------------
// Request verification (v1.3.2): method and requestBody assertions.
// ---------------------------------------------------------------------------

/**
 * Performs the optional interaction that triggers the request being
 * verified: check.selector is clicked, then check.values are typed into
 * their inputs and the enclosing form is submitted.
 *
 * @returns {Promise<object|null>} A failure result, or null on success.
 */
async function performRequestInteraction(engine, check, container, requirement) {
  if (check.selector) {
    const element = container.querySelector(check.selector);
    if (!element) {
      return fail(
        requirement,
        `Expected an element matching "${check.selector}" to be rendered so the request can be triggered, but it was not found.`
      );
    }
    await clickElement(element);
  }

  if (check.values) {
    for (const [selector, value] of Object.entries(check.values)) {
      const input = container.querySelector(selector);
      if (!input) {
        return fail(
          requirement,
          `Expected an input matching "${selector}" (declared in "values") to be rendered, but it was not found.`
        );
      }
      await typeInto(input, value);
    }

    const form = formForValues(container, check.values);
    if (!form) {
      return fail(
        requirement,
        "Expected a form to be rendered for submission, but it was not found."
      );
    }
    await submitForm(form);
  }

  const errors = engine.environment.activeErrorSink ?? [];
  if (errors.length > 0) {
    return fail(
      requirement,
      `Interacting with the component to trigger the request caused an error: ${errors[0].message}`
    );
  }
  return null;
}

function describeRecordedRequests(calls) {
  if (calls.length === 0) {
    return "no fetch requests were made";
  }
  return `the recorded requests were: ${calls
    .map((call) => `${String(call.method || "GET").toUpperCase()} ${call.url}`)
    .join(", ")}`;
}

/**
 * Parses a recorded request body: JSON strings are decoded so bodies
 * sent via JSON.stringify(...) compare against plain objects.
 *
 * @param {*} body - The recorded body.
 * @returns {*} The parsed body (or the raw body when not JSON).
 */
export function parseRequestBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

function bodiesMatch(call, expected) {
  if (call.body === null || call.body === undefined) {
    return false;
  }
  return deepEqual(parseRequestBody(call.body), expected);
}

export async function methodAssertion(engine, requirement) {
  const { check } = requirement;
  if (check.fetch) {
    engine.setFetchMocks(check.fetch);
  }

  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const interactionError = await performRequestInteraction(
    engine,
    check,
    container,
    requirement
  );
  if (interactionError) {
    return interactionError;
  }

  await settle();

  const expectedMethod = String(check.expect.method).toUpperCase();
  const expectedUrl = check.expect.url;

  const matched = engine.fetchCalls.some(
    (call) =>
      String(call.method || "GET").toUpperCase() === expectedMethod &&
      (call.url === expectedUrl || call.url.includes(expectedUrl))
  );
  if (!matched) {
    return fail(
      requirement,
      `Expected the component to send a ${expectedMethod} request to "${expectedUrl}", but ${describeRecordedRequests(
        engine.fetchCalls
      )}.`
    );
  }
  return pass(requirement);
}

export async function requestBodyAssertion(engine, requirement) {
  const { check } = requirement;
  if (check.fetch) {
    engine.setFetchMocks(check.fetch);
  }

  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const interactionError = await performRequestInteraction(
    engine,
    check,
    container,
    requirement
  );
  if (interactionError) {
    return interactionError;
  }

  await settle();

  const expected = check.expect;
  const matched = engine.fetchCalls.some((call) => bodiesMatch(call, expected));
  if (!matched) {
    const expectedBody = JSON.stringify(expected);
    if (engine.fetchCalls.length === 0) {
      return fail(
        requirement,
        `Expected the component to send a JSON body matching ${expectedBody}, but no fetch requests were made.`
      );
    }
    const actual = engine.fetchCalls
      .map((call) => {
        const body =
          call.body === null || call.body === undefined
            ? "no body"
            : JSON.stringify(parseRequestBody(call.body));
        return `${String(call.method || "GET").toUpperCase()} ${call.url} with body ${body}`;
      })
      .join(", ");
    return fail(
      requirement,
      `Expected the component to send a JSON body matching ${expectedBody}, but ${actual}.`
    );
  }
  return pass(requirement);
}
