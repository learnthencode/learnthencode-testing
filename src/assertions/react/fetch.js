/**
 * Fetch API mocking for React assertions (v1.3.0).
 *
 * The same mock format powers both JSON requirements (the engine's
 * sandboxed `fetch`) and the standalone programmatic API (the host
 * `globalThis.fetch`), so lab authors never depend on real network
 * requests during tests.
 *
 * Mock route shape:
 *   {
 *     url: "/api/users",          // matched exactly, or as a substring
 *     status: 200,                // optional HTTP status (default 200)
 *     body: [...],                // JSON body returned by res.json()
 *     scenario: "success" | "error" | "empty" | "loading"
 *   }
 *
 * Scenarios:
 *   - success (default) — ok response with `body`.
 *   - error             — ok: false with status 500 (or `status`).
 *   - empty             — ok response with an empty array body.
 *   - loading           — a promise that never resolves.
 */

/**
 * Looks up a mock for a fetch URL.
 *
 * Exact keys win; otherwise the longest matching substring key wins;
 * a catch-all "*" key is the final fallback.
 *
 * @param {object|null} mocks - The mock route table (url -> mock).
 * @param {string} url - The URL the student code called fetch() with.
 * @returns {object|null} The matching mock, or null.
 */
export function resolveFetchMock(mocks, url) {
  if (!mocks) {
    return null;
  }

  if (mocks[url] !== undefined) {
    return mocks[url];
  }

  let best = null;
  let bestLength = -1;
  for (const [key, mock] of Object.entries(mocks)) {
    if (key === "*") {
      continue;
    }
    if (url.includes(key) && key.length > bestLength) {
      best = mock;
      bestLength = key.length;
    }
  }
  if (best) {
    return best;
  }

  return mocks["*"] ?? null;
}

/**
 * Builds a fetch Response-shaped object (or a never-settling promise for
 * the "loading" scenario) from a mock route.
 *
 * @param {object|null} mock - The mock route.
 * @returns {object|Promise} A Response-like object or a pending promise.
 */
export function createFetchResponse(mock) {
  if (!mock) {
    // Unmatched route: behave like a successful empty response so a
    // component that maps over the result renders its empty state
    // instead of crashing the whole assertion run.
    return {
      ok: true,
      status: 200,
      json: async () => [],
      text: async () => "[]",
    };
  }

  switch (mock.scenario) {
    case "error":
      return {
        ok: false,
        status: mock.status || 500,
        json: async () => ({ message: mock.error || "Server Error" }),
        text: async () => "",
      };

    case "empty":
      return {
        ok: true,
        status: mock.status || 200,
        json: async () => [],
        text: async () => "[]",
      };

    case "loading":
      return new Promise(() => {});

    default:
      return {
        ok: true,
        status: mock.status || 200,
        json: async () => mock.body,
        text: async () => JSON.stringify(mock.body),
      };
  }
}

const originalFetch =
  typeof globalThis.fetch === "function" ? globalThis.fetch : null;

/**
 * Installs a global fetch mock for standalone programmatic tests.
 *
 *   import { mockFetch, restoreFetch } from "learnthencode-testing/src/assertions/react/fetch.js";
 *
 *   mockFetch({
 *     "/api/users": { body: [{ id: 1, name: "Ada" }] },
 *     "/api/fail": { scenario: "error" },
 *   });
 *
 * @param {object} routes - The mock route table (url -> mock).
 */
export function mockFetch(routes) {
  globalThis.fetch = async (url, options = {}) => {
    const urlString = typeof url === "string" ? url : String(url);
    const mock = resolveFetchMock(routes, urlString);
    return createFetchResponse(mock);
  };
}

/**
 * Restores the original global fetch, if any, after mockFetch().
 */
export function restoreFetch() {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    delete globalThis.fetch;
  }
}
