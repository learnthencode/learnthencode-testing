import { expect } from "../expect.js";
import { flushAsync } from "./render.js";
import { act } from "./environment.js";
import { verifyExpect } from "./interactions.js";

/**
 * Fetch mocking assertions (v1.3.0).
 *
 * The check declares mock routes (exact URL keys, longest-substring or
 * "*" catch-all supported) and the expected UI state after the fetch
 * settles. The engine intercepts window.fetch for the lab code.
 *
 *   check.fetch = {
 *     "/api/users": { scenario: "success", status: 200, body: [...] }
 *   }
 *   check.expect = { text } | { loading: true } | { empty: true } | { error: true }
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
  for (const url of urls) {
    if (url === "*") {
      // A catch-all matches any URL the component may call; behavior
      // is verified through the expect checks below.
      continue;
    }
    const called = engine.fetchCalls.some(
      (call) => call.url === url || call.url.includes(url)
    );
    if (!called) {
      return fail(
        requirement,
        `Expected the component to call fetch("${url}"), but no such call was made.`
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
