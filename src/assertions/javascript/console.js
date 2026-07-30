import { expect } from "../expect.js";

const VALID_ASSERTIONS = new Set([
  "logContains",
  "logEquals",
  "logCount",
  "logOrder",
]);

export function consoleAssertion(engine, requirement) {
  const { check } = requirement;
  const { assertion, value } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  if (!VALID_ASSERTIONS.has(assertion)) {
    return expect({
      requirement,
      condition: false,
      message: `Unknown console assertion: "${assertion}". Valid values: logContains, logEquals, logCount, logOrder.`,
    });
  }

  const logs = engine.consoleOutput;

  switch (assertion) {
    case "logContains": {
      const matched = logs.some(log => log.includes(value));
      if (!matched) {
        return expect({
          requirement,
          condition: false,
          message: `Expected console.log output to contain "${value}", but none of the ${logs.length} log calls matched.`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "logEquals": {
      const matched = logs.some(log => log === value);
      if (!matched) {
        const quoted = logs.map(l => `"${l}"`).join(", ");
        return expect({
          requirement,
          condition: false,
          message: `Expected console.log output to exactly equal "${value}", but got: [${quoted}].`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "logCount": {
      const expected = Number(value);
      if (isNaN(expected)) {
        return expect({
          requirement,
          condition: false,
          message: `Expected "value" to be a number for logCount assertion, but got "${value}".`,
        });
      }
      if (logs.length !== expected) {
        return expect({
          requirement,
          condition: false,
          message: `Expected console.log to be called ${expected} time(s), but it was called ${logs.length} time(s).`,
        });
      }
      return expect({ requirement, condition: true });
    }

    case "logOrder": {
      const joined = logs.join("\n");
      if (!joined.includes(value)) {
        const rendered = logs.map(l => `"${l}"`).join(", ");
        return expect({
          requirement,
          condition: false,
          message: `Expected the ordered console.log output to contain "${value}", but got: [${rendered}].`,
        });
      }
      return expect({ requirement, condition: true });
    }
  }
}
