/**
 * Fetch API mocking for React assertions (v1.3.0, CRUD methods v1.3.2).
 *
 * The same mock format powers both JSON requirements (the engine's
 * sandboxed `fetch`) and the standalone programmatic API (the host
 * `globalThis.fetch`), so lab authors never depend on real network
 * requests during tests.
 *
 * Mock route shape:
 *   {
 *     "/api/users": {...},       // any method
 *     "POST /api/users": {...},  // only POST requests
 *     "PUT /api/users/1": {...}, // only PUT requests
 *     "PATCH /api/users/1": {...},
 *     "DELETE /api/users/1": {...}
 *   }
 *
 * A key may be prefixed with an HTTP method ("GET", "POST", "PUT",
 * "PATCH", or "DELETE") followed by a space. Method-prefixed routes only
 * match requests that use that method; plain URL keys match any method.
 * The route value is a mock:
 *   {
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

const METHOD_KEY_PATTERN = /^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i;

/**
 * Parses a route key that carries an HTTP method prefix.
 *
 * "POST /api/users" -> { method: "POST", url: "/api/users" }
 * "/api/users"      -> null (plain URL key matches any method)
 *
 * @param {string} key - The mock route key.
 * @returns {{ method: string, url: string }|null}
 */
export function parseMethodRouteKey(key) {
  const match = METHOD_KEY_PATTERN.exec(key);
  if (!match) {
    return null;
  }
  return { method: match[1].toUpperCase(), url: match[2] };
}

/**
 * Looks up a mock for a fetch call.
 *
 * Method-prefixed routes take precedence: among them the longest URL
 * substring whose method matches wins. Otherwise exact plain-URL keys
 * win, then the longest plain-URL substring, and a catch-all "*" key is
 * the final fallback.
 *
 * @param {object|null} mocks - The mock route table (route key -> mock).
 * @param {string} url - The URL the student code called fetch() with.
 * @param {string} [method] - The HTTP method used (default "GET").
 * @returns {object|null} The matching mock, or null.
 */
export function resolveFetchMock(mocks, url, method = "GET") {
  if (!mocks) {
    return null;
  }

  const requestMethod = String(method || "GET").toUpperCase();

  // 1. Best method-prefixed route whose method matches the request.
  let methodMatch = null;
  let methodLength = -1;
  for (const [key, mock] of Object.entries(mocks)) {
    const route = parseMethodRouteKey(key);
    if (
      route &&
      route.method === requestMethod &&
      url.includes(route.url) &&
      route.url.length > methodLength
    ) {
      methodMatch = mock;
      methodLength = route.url.length;
    }
  }
  if (methodMatch) {
    return methodMatch;
  }

  // 2. Exact plain URL key (matches any method).
  if (mocks[url] !== undefined) {
    return mocks[url];
  }

  // 3. Longest matching plain URL substring.
  let best = null;
  let bestLength = -1;
  for (const [key, mock] of Object.entries(mocks)) {
    if (key === "*" || parseMethodRouteKey(key)) {
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

  // 4. Catch-all fallback.
  return mocks["*"] ?? null;
}

/**
 * Checks whether a recorded fetch call satisfies a route key.
 *
 * Method-prefixed keys ("POST /api/users") require both the method and
 * the URL to match; plain URL keys match any method. URLs match exactly
 * or as a substring, mirroring resolveFetchMock().
 *
 * @param {{ url: string, method: string }} call - A recorded fetch call.
 * @param {string} key - A mock route key (method-prefixed or plain URL).
 * @returns {boolean} True when the call satisfies the route key.
 */
export function fetchCallMatches(call, key) {
  const route = parseMethodRouteKey(key);
  if (route) {
    return (
      String(call.method || "GET").toUpperCase() === route.method &&
      (call.url === route.url || call.url.includes(route.url))
    );
  }
  return call.url === key || call.url.includes(key);
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
 *     "POST /api/users": { status: 201, body: { id: 2, name: "Bob" } },
 *     "/api/fail": { scenario: "error" },
 *   });
 *
 * @param {object} routes - The mock route table (route key -> mock).
 */
export function mockFetch(routes) {
  globalThis.fetch = async (url, options = {}) => {
    const urlString = typeof url === "string" ? url : String(url);
    const method = (options.method || "GET").toUpperCase();
    const mock = resolveFetchMock(routes, urlString, method);
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
