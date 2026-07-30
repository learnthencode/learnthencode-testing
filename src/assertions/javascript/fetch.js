import { expect } from "../expect.js";

export function fetchAssertion(engine, requirement) {
  const { check } = requirement;
  const { assertion, endpoint, method } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  const calls = engine.fetchCalls;

  if (assertion === "called" || (!assertion && !endpoint && !method)) {
    if (calls.length === 0) {
      return expect({
        requirement,
        condition: false,
        message: "Expected fetch() to have been called, but it was never called.",
      });
    }
    return expect({ requirement, condition: true });
  }

  if (endpoint) {
    const matched = calls.some(call => {
      const callUrl = typeof call.url === "string" ? call.url : String(call.url);
      return callUrl.includes(endpoint) || callUrl === endpoint;
    });

    if (!matched) {
      const actualEndpoints = calls.map(c => `"${c.url}"`).join(", ");
      return expect({
        requirement,
        condition: false,
        message: `Expected fetch() to be called with endpoint "${endpoint}", but calls were to: ${actualEndpoints || "none"}.`,
      });
    }

    if (!method) {
      return expect({ requirement, condition: true });
    }
  }

  if (method) {
    const matched = endpoint
      ? calls.some(call => {
          const callUrl = typeof call.url === "string" ? call.url : String(call.url);
          return (callUrl.includes(endpoint) || callUrl === endpoint) && call.method === method.toUpperCase();
        })
      : calls.some(call => call.method === method.toUpperCase());

    if (!matched) {
      const actualCalls = calls.map(c => `${c.method} ${c.url}`).join(", ");
      return expect({
        requirement,
        condition: false,
        message: `Expected fetch() with method "${method.toUpperCase()}"${endpoint ? ` to "${endpoint}"` : ""}, but got: ${actualCalls || "no calls"}.`,
      });
    }
    return expect({ requirement, condition: true });
  }

  return expect({
    requirement,
    condition: true,
  });
}
