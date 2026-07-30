import { expect } from "../expect.js";

export function jsonAssertion(engine, requirement) {
  const { check } = requirement;
  const { assertion } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  switch (assertion) {
    case "parse": {
      if (engine.jsonParseCalls.length === 0) {
        return expect({
          requirement,
          condition: false,
          message: "Expected JSON.parse() to be called, but it was never used.",
        });
      }
      return expect({ requirement, condition: true });
    }

    case "stringify": {
      if (engine.jsonStringifyCalls.length === 0) {
        return expect({
          requirement,
          condition: false,
          message: "Expected JSON.stringify() to be called, but it was never used.",
        });
      }
      return expect({ requirement, condition: true });
    }

    default:
      return expect({
        requirement,
        condition: false,
        message: `Unknown JSON assertion: "${assertion}". Use "parse" or "stringify".`,
      });
  }
}
