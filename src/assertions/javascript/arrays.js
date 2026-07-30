import { expect } from "../expect.js";

export function arrayAssertion(engine, requirement) {
  const { check } = requirement;
  const { name, length, contains } = check;

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
      message: `Array "${name}" was not found.`,
    });
  }

  if (!Array.isArray(result.value)) {
    return expect({
      requirement,
      condition: false,
      message: `"${name}" exists but is not an array.`,
    });
  }

  const arr = result.value;

  if (length !== undefined) {
    if (arr.length !== length) {
      return expect({
        requirement,
        condition: false,
        message: `Expected "${name}" to have length ${length}, but got length ${arr.length}.`,
      });
    }
  }

  if (contains !== undefined) {
    const items = Array.isArray(contains) ? contains : [contains];

    for (const item of items) {
      const expectedJson = JSON.stringify(item);
      if (!arr.some(element => JSON.stringify(element) === expectedJson)) {
        return expect({
          requirement,
          condition: false,
          message: `Expected "${name}" to contain ${expectedJson}, but it was not found.`,
        });
      }
    }
  }

  return expect({
    requirement,
    condition: true,
  });
}
