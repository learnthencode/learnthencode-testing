import { expect } from "../expect.js";
import { flushAsync } from "./render.js";
import { act } from "./environment.js";
import { verifyExpect } from "./interactions.js";
import { fetchCallMatches } from "./fetch.js";

/**
 * useEffect / async behavior assertions (v1.3.0).
 *
 *   - loadsOnMount — the component fetches data in a useEffect with an
 *     empty dependency array; the UI transitions through loading and
 *     settled states.
 *   - async        - the component schedules a delayed update (setTimeout)
 *     and the new state eventually appears in the UI.
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

/**
 * An empty state is either a blank output or a typical "nothing to show"
 * message ("No users found.", "Nothing here", ...).
 */
const EMPTY_STATE_PATTERN =
  /no (users|items|data|results|records|matches|books|posts|things)|nothing (to )?(show|see|display)|no (users|items|data|results|records|matches|books|posts|things) found|empty/i;

function isEmptyState(text) {
  return text.trim().length === 0 || EMPTY_STATE_PATTERN.test(text);
}

/**
 * Flushes pending microtasks/promises inside act() so effects and
 * fetch mocks have a chance to settle.
 */
async function settle(rounds = 8) {
  await act(async () => {
    await flushAsync(rounds);
  });
}

export async function loadsOnMountAssertion(engine, requirement) {
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

  if (check.expect.loading === true) {
    const stillLoading =
      engine.fetchCalls.length === 0 ||
      container.textContent.includes(check.expect.text || "");
    if (stillLoading && engine.fetchCalls.length === 0) {
      return fail(
        requirement,
        "Expected the component to fetch data when it mounts (useEffect with []), but no fetch call was made."
      );
    }
    return pass(requirement);
  }

  if (check.fetch) {
    for (const key of Object.keys(check.fetch)) {
      if (key === "*") {
        // A catch-all matches any URL the component may call; behavior
        // is verified through the expect checks below.
        continue;
      }
      const called = engine.fetchCalls.some((call) =>
        fetchCallMatches(call, key)
      );
      if (!called) {
        return fail(
          requirement,
          `Expected the component to fetch "${key}" when it mounts (useEffect with []), but no fetch call to that URL was made.`
        );
      }
    }
  }

  if (check.expect.text !== undefined) {
    const verification = verifyExpect(
      container,
      { text: check.expect.text },
      "the component loaded its data"
    );
    if (!verification.ok) {
      return fail(requirement, verification.message);
    }
  }

  if (check.expect.empty === true) {
    if (check.expect.text === undefined) {
      const text = container.textContent;
      if (!isEmptyState(text)) {
        return fail(
          requirement,
          `Expected the component to show an empty state after the fetch returned no data, but the rendered output was: "${text.trim()}".`
        );
      }
    }
    return pass(requirement);
  }

  if (check.expect.error === true) {
    const hasErrorText = /error|failed|something went wrong/i.test(
      container.textContent
    );
    if (!hasErrorText) {
      return fail(
        requirement,
        `Expected the component to show an error state after the fetch failed, but the rendered output was: "${container.textContent.trim()}".`
      );
    }
    return pass(requirement);
  }

  return pass(requirement);
}

export async function asyncAssertion(engine, requirement) {
  const { check } = requirement;
  const { result, container } = await renderFor(engine, check, requirement);
  if (result) {
    return result;
  }

  const delay = check.delay !== undefined ? check.delay : 50;

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, delay + 50));
  });
  await settle();

  if (check.expect.text !== undefined) {
    const verification = verifyExpect(
      container,
      { text: check.expect.text },
      "the delayed update ran"
    );
    if (!verification.ok) {
      return fail(requirement, verification.message);
    }
  }

  return pass(requirement);
}
