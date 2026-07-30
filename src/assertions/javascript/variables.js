import { expect } from "../expect.js";

export function variableAssertion(engine, requirement) {
  const { check } = requirement;
  const { name, value } = check;

  if (engine.executionError) {
    return expect({
      requirement,
      condition: false,
      message: `JavaScript error prevented evaluation: ${engine.executionError.message}`,
    });
  }

  const result = engine.getValue(name);

  if (!result.exists) {
    return expect({
      requirement,
      condition: false,
      message: `Variable "${name}" was not found.`,
    });
  }

  if (value !== undefined) {
    const actual = result.value;
    const expectedJson = JSON.stringify(value);
    const actualJson = JSON.stringify(actual);

    if (actualJson !== expectedJson) {
      return expect({
        requirement,
        condition: false,
        message: `Expected "${name}" to be ${expectedJson}, but got ${actualJson}.`,
      });
    }

    if (actual !== value) {
      return expect({
        requirement,
        condition: false,
        message: `Expected "${name}" to be ${expectedJson}, but got ${actualJson}.`,
      });
    }
  }

  return expect({
    requirement,
    condition: true,
  });
}
