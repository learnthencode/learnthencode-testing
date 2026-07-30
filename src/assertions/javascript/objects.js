import { expect } from "../expect.js";

export function objectAssertion(engine, requirement) {
  const { check } = requirement;
  const { name, property, value } = check;

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
      message: `Object "${name}" was not found.`,
    });
  }

  if (typeof result.value !== "object" || result.value === null || Array.isArray(result.value)) {
    return expect({
      requirement,
      condition: false,
      message: `"${name}" exists but is not a plain object.`,
    });
  }

  const obj = result.value;

  if (property !== undefined) {
    if (!(property in obj)) {
      return expect({
        requirement,
        condition: false,
        message: `Object "${name}" does not have property "${property}".`,
      });
    }

    if (value !== undefined) {
      const actual = obj[property];
      const expectedJson = JSON.stringify(value);
      const actualJson = JSON.stringify(actual);

      if (actualJson !== expectedJson) {
        return expect({
          requirement,
          condition: false,
          message: `Expected "${name}.${property}" to be ${expectedJson}, but got ${actualJson}.`,
        });
      }

      if (actual !== value) {
        return expect({
          requirement,
          condition: false,
          message: `Expected "${name}.${property}" to be ${expectedJson}, but got ${actualJson}.`,
        });
      }
    }
  }

  return expect({
    requirement,
    condition: true,
  });
}
